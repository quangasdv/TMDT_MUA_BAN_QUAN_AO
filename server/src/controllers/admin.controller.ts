import bcrypt from "bcryptjs";
import { Request, Response, NextFunction } from "express";
import prisma from "../config/db";
import { OrderStatus } from "@prisma/client";

export class AdminController {
  /**
   * Quản lý đơn hàng (ADMIN + STAFF)
   */
  static async getOrders(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { status, page = "1", limit = "20" } = req.query;
      const pageNum = parseInt(page as string, 10) || 1;
      const limitNum = parseInt(limit as string, 10) || 20;

      const where: any = {};
      if (status) {
        where.status = status;
      }

      const [orders, total] = await Promise.all([
        prisma.order.findMany({
          where,
          include: {
            user: { select: { id: true, fullName: true, email: true } },
            items: { include: { variant: { include: { product: true } } } },
            payment: true,
            voucher: true,
          },
          skip: (pageNum - 1) * limitNum,
          take: limitNum,
          orderBy: { createdAt: "desc" },
        }),
        prisma.order.count({ where }),
      ]);

      res.status(200).json({
        success: true,
        data: {
          orders,
          pagination: {
            page: pageNum,
            limit: limitNum,
            total,
            totalPages: Math.ceil(total / limitNum),
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Cập nhật trạng thái đơn hàng (ADMIN + STAFF) với State Machine chuẩn luồng:
   * 1. Kiểm tra trạng thái hiện tại so với trạng thái mới có hợp lệ hay không.
   * 2. Nếu hủy đơn khi đang PENDING_PAYMENT -> Bắt buộc phải hoàn kho và chuyển lock sang EXPIRED trong $transaction!
   * 3. Chặn hành vi chuyển thẳng đơn chưa thanh toán sang giao hàng.
   */
  static async updateOrderStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const order = await prisma.order.findUnique({
        where: { id },
        include: { locks: true },
      });

      if (!order) {
        res.status(404).json({ success: false, message: "Không tìm thấy đơn hàng." });
        return;
      }

      // STATE MACHINE: Định nghĩa các bước chuyển trạng thái hợp lệ
      const allowedTransitions: Record<string, string[]> = {
        PENDING_PAYMENT: ["CANCELLED"], // Không được sang PROCESSING/SHIPPING khi chưa thanh toán
        PAID: ["PROCESSING", "CANCELLED"],
        PROCESSING: ["SHIPPING", "CANCELLED"],
        SHIPPING: ["DELIVERED", "CANCELLED"],
        DELIVERED: [], // Trạng thái cuối cùng, không thể đổi
        CANCELLED: [], // Đã hủy, không thể đổi
        PAYMENT_EXPIRED_PENDING_REFUND: ["CANCELLED"],
      };

      const validNextStates = allowedTransitions[order.status] || [];
      if (!validNextStates.includes(status)) {
        res.status(400).json({
          success: false,
          message: `Không thể chuyển trạng thái từ "${order.status}" sang "${status}". Các trạng thái hợp lệ: [${validNextStates.join(", ")}]`,
        });
        return;
      }

      // NẾU HỦY ĐƠN ĐANG PENDING_PAYMENT -> BẮT BUỘC HOÀN LẠI KHO VÀ ĐỔI LOCK SANG EXPIRED TRONG CHỐT CHẶN NGUYÊN TỬ!
      if (order.status === "PENDING_PAYMENT" && status === "CANCELLED") {
        try {
          const updatedOrder = await prisma.$transaction(async (tx) => {
            // Chốt chặn nguyên tử: Chỉ hủy nếu đơn vẫn đang thực sự là PENDING_PAYMENT
            const updateResult = await tx.order.updateMany({
              where: { id, status: OrderStatus.PENDING_PAYMENT },
              data: { status: OrderStatus.CANCELLED },
            });

            if (updateResult.count === 0) {
              throw new Error("CONFLICT_STATE");
            }

            // Đọc lại các lock đang LOCKED thực tế trong transaction
            const activeLocks = await tx.inventoryLock.findMany({
              where: { orderId: id, status: "LOCKED" },
            });

            for (const lock of activeLocks) {
              await tx.inventoryLock.update({
                where: { id: lock.id },
                data: { status: "EXPIRED" },
              });

              await tx.productVariant.update({
                where: { id: lock.variantId },
                data: {
                  stockQuantity: {
                    increment: lock.quantity,
                  },
                },
              });
            }

            return tx.order.findUnique({ where: { id } });
          });

          res.status(200).json({
            success: true,
            message: "Đã hủy đơn hàng và hoàn trả lại số lượng tồn kho thành công.",
            data: { order: updatedOrder },
          });
          return;
        } catch (err: unknown) {
          if ((err as Error)?.message === "CONFLICT_STATE") {
            res.status(409).json({
              success: false,
              message: "Đơn hàng đã được thanh toán hoặc đã bị hủy trước đó bởi tiến trình khác (Cron/Webhook).",
            });
            return;
          }
          throw err;
        }
      }

      // Đổi trạng thái thông thường có kiểm tra điều kiện nguyên tử (tránh race condition)
      const updateResult = await prisma.order.updateMany({
        where: {
          id,
          status: order.status,
        },
        data: {
          status: status as OrderStatus,
        },
      });

      if (updateResult.count === 0) {
        res.status(409).json({
          success: false,
          message: "Trạng thái đơn hàng đã bị thay đổi bởi thao tác khác. Vui lòng tải lại trang.",
        });
        return;
      }

      // Xử lý tự động cho đơn COD: Nếu đơn giao thành công (DELIVERED) mà chưa thanh toán, tự động đánh dấu PAID
      if (status === "DELIVERED" && order.paymentStatus !== "PAID") {
        await prisma.order.update({
          where: { id },
          data: { paymentStatus: "PAID" },
        });
        await prisma.paymentTransaction.updateMany({
          where: { orderId: id },
          data: { status: "SUCCESS" },
        });
      }

      // QUY CHUẨN HOÀN TIỀN & HOÀN KHO (HƯỚNG A):
      if (status === "CANCELLED") {
        // Hoàn trả số lượng tồn kho nếu đơn đã từng rời khỏi PENDING_PAYMENT
        if (order.status === "PROCESSING" || order.status === "PAID" || order.status === "SHIPPING") {
          const orderItems = await prisma.orderItem.findMany({ where: { orderId: id } });
          for (const item of orderItems) {
            await prisma.productVariant.update({
              where: { id: item.variantId },
              data: { stockQuantity: { increment: item.quantity } },
            });
          }
        }

        // Nếu đơn hàng trước đó ĐÃ THANH TOÁN (PAID), tự động chuyển sang CHỜ HOÀN TIỀN (PENDING_REFUND)
        if (order.paymentStatus === "PAID") {
          await prisma.order.update({
            where: { id },
            data: { paymentStatus: "PENDING_REFUND" },
          });
        }
      }

      const updatedOrder = await prisma.order.findUnique({ where: { id } });

      res.status(200).json({
        success: true,
        message: `Đã cập nhật trạng thái đơn hàng sang ${status}.`,
        data: { order: updatedOrder },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Xác nhận hoàn tiền đơn hàng (ADMIN & STAFF) - Hướng A
   * PATCH /api/admin/orders/:id/refund
   */
  static async confirmOrderRefund(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      const order = await prisma.order.findUnique({
        where: { id },
      });

      if (!order) {
        res.status(404).json({ success: false, message: "Không tìm thấy đơn hàng." });
        return;
      }

      if (order.status !== "CANCELLED") {
        res.status(400).json({
          success: false,
          message: "Chỉ có thể xác nhận hoàn tiền cho đơn hàng đã bị hủy.",
        });
        return;
      }

      if (order.paymentStatus === "REFUNDED") {
        res.status(400).json({
          success: false,
          message: "Đơn hàng này đã được xác nhận hoàn tiền trước đó rồi.",
        });
        return;
      }

      const updatedOrder = await prisma.order.update({
        where: { id },
        data: { paymentStatus: "REFUNDED" },
      });

      await prisma.paymentTransaction.updateMany({
        where: { orderId: id },
        data: { status: "REFUNDED" },
      });

      res.status(200).json({
        success: true,
        message: "Xác nhận hoàn tiền cho đơn hàng thành công!",
        data: { order: updatedOrder },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Quản lý sản phẩm (ADMIN)
   */
  static async getProducts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const products = await prisma.product.findMany({
        include: {
          category: true,
          variants: true,
          sizeCharts: true,
        },
        orderBy: { createdAt: "desc" },
      });

      res.status(200).json({ success: true, data: { products } });
    } catch (error) {
      next(error);
    }
  }

  static async createProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name, slug, description, basePrice, categoryId, variants, sizeCharts } = req.body;

      const base = Number(basePrice);
      if (!Number.isFinite(base) || base < 0) {
        res.status(400).json({ success: false, message: "Giá gốc (basePrice) phải là số không âm." });
        return;
      }

      if (variants && Array.isArray(variants)) {
        for (const v of variants) {
          const adj = Number(v.priceAdjustment || 0);
          const stock = Number(v.stockQuantity || 0);
          if (!Number.isFinite(adj) || base + adj < 0) {
            res.status(400).json({ success: false, message: `Giá bán của biến thể SKU "${v.sku || ""}" không được âm.` });
            return;
          }
          if (!Number.isInteger(stock) || stock < 0) {
            res.status(400).json({ success: false, message: `Số lượng tồn kho của biến thể SKU "${v.sku || ""}" phải là số nguyên không âm.` });
            return;
          }
        }
      }

      const product = await prisma.product.create({
        data: {
          name,
          slug,
          description,
          basePrice,
          categoryId,
          variants: {
            create: variants?.map((v: any) => ({
              sku: v.sku,
              color: v.color,
              size: v.size,
              priceAdjustment: v.priceAdjustment || 0,
              stockQuantity: v.stockQuantity || 0,
              imageUrl: v.imageUrl || "",
            })),
          },
          sizeCharts: {
            create: sizeCharts?.map((sc: any) => ({
              size: sc.size,
              minHeightCm: sc.minHeightCm,
              maxHeightCm: sc.maxHeightCm,
              minWeightKg: sc.minWeightKg,
              maxWeightKg: sc.maxWeightKg,
              chestCm: sc.chestCm,
              waistCm: sc.waistCm,
            })),
          },
        },
        include: { variants: true, sizeCharts: true },
      });

      res.status(201).json({
        success: true,
        message: "Tạo sản phẩm mới thành công!",
        data: { product },
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { name, description, basePrice, categoryId, isActive, images, variants } = req.body;

      if (basePrice !== undefined) {
        const base = Number(basePrice);
        if (!Number.isFinite(base) || base < 0) {
          res.status(400).json({ success: false, message: "Giá gốc sản phẩm không được là số âm." });
          return;
        }
      }

      // 1. Cập nhật thông tin chung sản phẩm
      const updateData: any = {
        ...(name && { name }),
        ...(description && { description }),
        ...(basePrice !== undefined && { basePrice: Number(basePrice) }),
        ...(categoryId && { categoryId }),
        ...(isActive !== undefined && { isActive }),
      };

      // Cập nhật ảnh chính nếu FE truyền imageUrl hoặc images[0]
      const primaryImage = (typeof req.body.imageUrl === "string" && req.body.imageUrl.trim()) ||
        (Array.isArray(images) && images.length > 0 && typeof images[0] === "string" && images[0].trim());
      if (primaryImage) {
        await prisma.productVariant.updateMany({
          where: { productId: id },
          data: { imageUrl: primaryImage },
        });
      }

      // 2. Cập nhật và đồng bộ từng biến thể SKU (Màu sắc, Size, Tồn kho, SKU, Giá phụ thu, Ảnh biến thể)
      if (Array.isArray(variants)) {
        const incomingIds = variants.map((v: any) => v.id).filter(Boolean);

        // Xóa các biến thể đã bị gỡ bỏ khỏi modal (nếu không có đơn hàng)
        const existingVariants = await prisma.productVariant.findMany({
          where: { productId: id },
          select: { id: true },
        });
        const toDeleteIds = existingVariants
          .map((ev) => ev.id)
          .filter((evId) => !incomingIds.includes(evId));

        for (const delId of toDeleteIds) {
          const hasOrders = await prisma.orderItem.count({ where: { variantId: delId } });
          if (hasOrders === 0) {
            await prisma.cartItem.deleteMany({ where: { variantId: delId } });
            await prisma.outfitItem.deleteMany({ where: { variantId: delId } });
            await prisma.inventoryLock.deleteMany({ where: { variantId: delId } });
            await prisma.productVariant.delete({ where: { id: delId } });
          }
        }

        // Cập nhật hoặc tạo mới biến thể
        for (const v of variants) {
          const finalVarImg = (v.imageUrl && String(v.imageUrl).trim())
            ? String(v.imageUrl).trim()
            : (primaryImage || undefined);

          if (v.id) {
            await prisma.productVariant.update({
              where: { id: v.id },
              data: {
                ...(v.sku && { sku: String(v.sku).trim() }),
                ...(v.color && { color: String(v.color).trim() }),
                ...(v.size && { size: String(v.size).trim() }),
                ...(v.priceAdjustment !== undefined && { priceAdjustment: Number(v.priceAdjustment) }),
                ...(v.stockQuantity !== undefined && { stockQuantity: Math.max(0, parseInt(String(v.stockQuantity), 10) || 0) }),
                ...(finalVarImg !== undefined && { imageUrl: finalVarImg }),
              },
            });
          } else if (v.sku && v.color && v.size) {
            // Thêm mới biến thể
            await prisma.productVariant.create({
              data: {
                productId: id,
                sku: String(v.sku).trim(),
                color: String(v.color).trim(),
                size: String(v.size).trim(),
                priceAdjustment: Number(v.priceAdjustment || 0),
                stockQuantity: Math.max(0, parseInt(String(v.stockQuantity), 10) || 0),
                imageUrl: finalVarImg || "",
              },
            });
          }
        }
      }

      const product = await prisma.product.update({
        where: { id },
        data: updateData,
        include: { variants: true, category: true, sizeCharts: true },
      });

      res.status(200).json({
        success: true,
        message: "Cập nhật thông tin và hình ảnh sản phẩm thành công!",
        data: { product },
      });
    } catch (error) {
      next(error);
    }
  }

  static async deleteProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      await prisma.product.update({
        where: { id },
        data: { isActive: false },
      });

      res.status(200).json({
        success: true,
        message: "Đã ẩn sản phẩm khỏi hệ thống bán hàng.",
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Quản lý Voucher (ADMIN)
   */
  static async getVouchers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const vouchers = await prisma.voucher.findMany({
        orderBy: { expiresAt: "desc" },
      });
      res.status(200).json({ success: true, data: { vouchers } });
    } catch (error) {
      next(error);
    }
  }

  static async createVoucher(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { code, discountType, discountValue, minOrderValue, usageLimit, expiresAt } = req.body;

      if (!code || typeof code !== "string") {
        res.status(400).json({ success: false, message: "Mã voucher (code) là bắt buộc." });
        return;
      }

      if (!["PERCENT", "FIXED"].includes(discountType)) {
        res.status(400).json({ success: false, message: "Loại giảm giá chỉ chấp nhận PERCENT hoặc FIXED." });
        return;
      }

      const val = Number(discountValue);
      if (!Number.isFinite(val) || val <= 0) {
        res.status(400).json({ success: false, message: "Mức giảm giá (discountValue) phải là số dương lớn hơn 0." });
        return;
      }

      if (discountType === "PERCENT" && val > 100) {
        res.status(400).json({ success: false, message: "Giảm giá theo phần trăm không được vượt quá 100%." });
        return;
      }

      let parsedMinOrder = 0;
      if (minOrderValue !== undefined && minOrderValue !== null && minOrderValue !== "") {
        parsedMinOrder = Number(minOrderValue);
        if (!Number.isFinite(parsedMinOrder) || parsedMinOrder < 0) {
          res.status(400).json({ success: false, message: "Giá trị đơn hàng tối thiểu (minOrderValue) phải là số không âm." });
          return;
        }
      }

      let parsedUsageLimit = 100;
      if (usageLimit !== undefined && usageLimit !== null && usageLimit !== "") {
        parsedUsageLimit = Number(usageLimit);
        if (!Number.isInteger(parsedUsageLimit) || parsedUsageLimit <= 0) {
          res.status(400).json({ success: false, message: "Số lượt sử dụng tối đa (usageLimit) phải là số nguyên dương." });
          return;
        }
      }

      if (!expiresAt) {
        res.status(400).json({ success: false, message: "Thời hạn voucher (expiresAt) là bắt buộc." });
        return;
      }
      const expiryDate = new Date(expiresAt);
      if (isNaN(expiryDate.getTime())) {
        res.status(400).json({ success: false, message: "Thời hạn voucher (expiresAt) không đúng định dạng ngày tháng." });
        return;
      }
      if (expiryDate.getTime() <= Date.now()) {
        res.status(400).json({
          success: false,
          message: "Thời hạn voucher (expiresAt) phải là ngày trong tương lai (lớn hơn thời điểm hiện tại).",
        });
        return;
      }

      const voucher = await prisma.voucher.create({
        data: {
          code: code.toUpperCase(),
          discountType,
          discountValue: val,
          minOrderValue: parsedMinOrder,
          usageLimit: parsedUsageLimit,
          expiresAt: expiryDate,
        },
      });

      res.status(201).json({
        success: true,
        message: "Tạo voucher thành công!",
        data: { voucher },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Cập nhật thông tin voucher (ADMIN)
   */
  static async updateVoucher(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { code, discountType, discountValue, minOrderValue, usageLimit, expiresAt, isActive } = req.body;

      const existingVoucher = await prisma.voucher.findUnique({ where: { id } });
      if (!existingVoucher) {
        res.status(404).json({ success: false, message: "Không tìm thấy mã voucher." });
        return;
      }

      const updateData: any = {};

      if (code !== undefined) {
        if (!code || typeof code !== "string") {
          res.status(400).json({ success: false, message: "Mã voucher (code) không được để trống." });
          return;
        }
        updateData.code = code.trim().toUpperCase();
      }

      if (discountType !== undefined) {
        if (!["PERCENT", "FIXED"].includes(discountType)) {
          res.status(400).json({ success: false, message: "Loại giảm giá chỉ chấp nhận PERCENT hoặc FIXED." });
          return;
        }
        updateData.discountType = discountType;
      }

      if (discountValue !== undefined) {
        const val = Number(discountValue);
        if (!Number.isFinite(val) || val <= 0) {
          res.status(400).json({ success: false, message: "Mức giảm giá (discountValue) phải là số dương lớn hơn 0." });
          return;
        }
        const effectiveType = discountType || existingVoucher.discountType;
        if (effectiveType === "PERCENT" && val > 100) {
          res.status(400).json({ success: false, message: "Giảm giá theo phần trăm không được vượt quá 100%." });
          return;
        }
        updateData.discountValue = val;
      }

      if (minOrderValue !== undefined && minOrderValue !== null && minOrderValue !== "") {
        const parsedMinOrder = Number(minOrderValue);
        if (!Number.isFinite(parsedMinOrder) || parsedMinOrder < 0) {
          res.status(400).json({ success: false, message: "Giá trị đơn hàng tối thiểu (minOrderValue) phải là số không âm." });
          return;
        }
        updateData.minOrderValue = parsedMinOrder;
      }

      if (usageLimit !== undefined && usageLimit !== null && usageLimit !== "") {
        const parsedUsageLimit = Number(usageLimit);
        if (!Number.isInteger(parsedUsageLimit) || parsedUsageLimit <= 0) {
          res.status(400).json({ success: false, message: "Số lượt sử dụng tối đa (usageLimit) phải là số nguyên dương." });
          return;
        }
        updateData.usageLimit = parsedUsageLimit;
      }

      if (expiresAt !== undefined) {
        const expiryDate = new Date(expiresAt);
        if (isNaN(expiryDate.getTime())) {
          res.status(400).json({ success: false, message: "Thời hạn voucher (expiresAt) không đúng định dạng ngày tháng." });
          return;
        }
        if (expiryDate.getTime() <= Date.now()) {
          res.status(400).json({
            success: false,
            message: "Thời hạn voucher (expiresAt) phải là ngày trong tương lai (lớn hơn thời điểm hiện tại).",
          });
          return;
        }
        updateData.expiresAt = expiryDate;
      }

      if (isActive !== undefined) {
        updateData.isActive = Boolean(isActive);
      }

      const voucher = await prisma.voucher.update({
        where: { id },
        data: updateData,
      });

      res.status(200).json({
        success: true,
        message: "Cập nhật voucher thành công!",
        data: { voucher },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Vô hiệu hóa voucher (ADMIN)
   */
  static async deleteVoucher(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const voucher = await prisma.voucher.update({
        where: { id },
        data: { isActive: false },
      });

      res.status(200).json({
        success: true,
        message: "Đã vô hiệu hóa voucher thành công!",
        data: { voucher },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Thống kê Dashboard (ADMIN)
   */
  static async getDashboardStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const [totalUsers, totalOrders, paidOrders, totalProducts] = await Promise.all([
        prisma.user.count({ where: { role: "CUSTOMER" } }),
        prisma.order.count(),
        prisma.order.findMany({
          where: { status: "PAID" },
          select: { finalAmount: true },
        }),
        prisma.product.count({ where: { isActive: true } }),
      ]);

      const totalRevenue = paidOrders.reduce((acc, curr) => acc + Number(curr.finalAmount), 0);

      res.status(200).json({
        success: true,
        data: {
          stats: {
            totalUsers,
            totalOrders,
            paidOrdersCount: paidOrders.length,
            totalRevenue,
            totalProducts,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Quản lý danh sách tài khoản Người dùng & Nhân viên (ADMIN)
   */
  static async getUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { role, q, page = "1", limit = "20" } = req.query;
      const pageNum = parseInt(page as string, 10) || 1;
      const limitNum = parseInt(limit as string, 10) || 20;

      const where: any = {};
      if (role && ["CUSTOMER", "STAFF", "ADMIN"].includes(role as string)) {
        where.role = role;
      }

      const keyword = (typeof q === "string" ? q : "").trim();
      if (keyword) {
        where.OR = [
          { fullName: { contains: keyword, mode: "insensitive" } },
          { email: { contains: keyword, mode: "insensitive" } },
          { phone: { contains: keyword, mode: "insensitive" } },
        ];
      }

      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where,
          select: {
            id: true,
            email: true,
            fullName: true,
            phone: true,
            role: true,
            createdAt: true,
            _count: {
              select: { orders: true },
            },
          },
          skip: (pageNum - 1) * limitNum,
          take: limitNum,
          orderBy: { createdAt: "desc" },
        }),
        prisma.user.count({ where }),
      ]);

      res.status(200).json({
        success: true,
        data: {
          users,
          pagination: {
            page: pageNum,
            limit: limitNum,
            total,
            totalPages: Math.ceil(total / limitNum),
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Tạo tài khoản mới từ Admin (ADMIN)
   */
  static async createUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password, fullName, phone, role = "STAFF" } = req.body;

      if (!email || typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        res.status(400).json({ success: false, message: "Email không đúng định dạng." });
        return;
      }

      if (!password || typeof password !== "string" || password.length < 6) {
        res.status(400).json({ success: false, message: "Mật khẩu tối thiểu 6 ký tự." });
        return;
      }

      if (!fullName || typeof fullName !== "string" || fullName.trim().length < 2) {
        res.status(400).json({ success: false, message: "Họ và tên tối thiểu 2 ký tự." });
        return;
      }

      if (phone) {
        const phoneRegex = /^0[35789][0-9]{8}$/;
        if (!phoneRegex.test(phone.trim())) {
          res.status(400).json({
            success: false,
            message: "Số điện thoại phải có 10 chữ số và bắt đầu bằng 03, 05, 07, 08, 09.",
          });
          return;
        }
      }

      if (!["CUSTOMER", "STAFF", "ADMIN"].includes(role)) {
        res.status(400).json({ success: false, message: "Vai trò không hợp lệ (CUSTOMER, STAFF, ADMIN)." });
        return;
      }

      const existingUser = await prisma.user.findUnique({
        where: { email: email.trim().toLowerCase() },
      });

      if (existingUser) {
        res.status(409).json({ success: false, message: "Email này đã được sử dụng trong hệ thống." });
        return;
      }

      const passwordHash = await bcrypt.hash(password, 10);

      const user = await prisma.user.create({
        data: {
          email: email.trim().toLowerCase(),
          passwordHash,
          fullName: fullName.trim(),
          phone: phone ? phone.trim() : null,
          role,
        },
        select: {
          id: true,
          email: true,
          fullName: true,
          phone: true,
          role: true,
          createdAt: true,
        },
      });

      res.status(201).json({
        success: true,
        message: "Tạo tài khoản thành công!",
        data: { user },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Cập nhật tài khoản người dùng/nhân viên (ADMIN)
   */
  static async updateUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { fullName, phone, role, password } = req.body;

      const existingUser = await prisma.user.findUnique({ where: { id } });
      if (!existingUser) {
        res.status(404).json({ success: false, message: "Không tìm thấy người dùng." });
        return;
      }

      const updateData: any = {};

      if (fullName !== undefined) {
        if (!fullName || typeof fullName !== "string" || fullName.trim().length < 2) {
          res.status(400).json({ success: false, message: "Họ và tên tối thiểu 2 ký tự." });
          return;
        }
        updateData.fullName = fullName.trim();
      }

      if (phone !== undefined) {
        if (phone) {
          const phoneRegex = /^0[35789][0-9]{8}$/;
          if (!phoneRegex.test(phone.trim())) {
            res.status(400).json({
              success: false,
              message: "Số điện thoại phải có 10 chữ số và bắt đầu bằng 03, 05, 07, 08, 09.",
            });
            return;
          }
          updateData.phone = phone.trim();
        } else {
          updateData.phone = null;
        }
      }

      if (role !== undefined) {
        if (!["CUSTOMER", "STAFF", "ADMIN"].includes(role)) {
          res.status(400).json({ success: false, message: "Vai trò không hợp lệ (CUSTOMER, STAFF, ADMIN)." });
          return;
        }
        updateData.role = role;
      }

      if (password !== undefined && password !== "") {
        if (typeof password !== "string" || password.length < 6) {
          res.status(400).json({ success: false, message: "Mật khẩu mới tối thiểu 6 ký tự." });
          return;
        }
        updateData.passwordHash = await bcrypt.hash(password, 10);
      }

      const user = await prisma.user.update({
        where: { id },
        data: updateData,
        select: {
          id: true,
          email: true,
          fullName: true,
          phone: true,
          role: true,
          createdAt: true,
        },
      });

      res.status(200).json({
        success: true,
        message: "Cập nhật thông tin tài khoản thành công!",
        data: { user },
      });
    } catch (error) {
      next(error);
    }
  }


  /**
   * 6. Quản lý Combo thời trang / Outfits (Chỉ ADMIN)
   */
  static async getOutfits(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const outfits = await prisma.outfit.findMany({
        include: {
          items: {
            include: {
              variant: {
                include: { product: true },
              },
            },
          },
        },
        orderBy: { id: "desc" },
      });

      const CLOTHING_SLOTS = ["TOP", "BOTTOM", "OUTERWEAR"];

      const formatted = outfits.map((outfit) => {
        let clothingOriginalPrice = 0;
        let totalOriginalPrice = 0;

        const items = outfit.items.map((item) => {
          const unitPrice =
            Number(item.variant.product.basePrice) + Number(item.variant.priceAdjustment);
          totalOriginalPrice += unitPrice;
          if (CLOTHING_SLOTS.includes(item.slotType)) {
            clothingOriginalPrice += unitPrice;
          }
          return {
            id: item.id,
            slotType: item.slotType,
            variantId: item.variantId,
            productId: item.variant.productId,
            productName: item.variant.product.name,
            sku: item.variant.sku,
            color: item.variant.color,
            size: item.variant.size,
            imageUrl: item.variant.imageUrl || "",
            price: unitPrice,
          };
        });

        const baseComboPrice = clothingOriginalPrice > 0 ? clothingOriginalPrice : totalOriginalPrice;
        const discountRate = outfit.discountRate || 0.15;
        const comboPrice = Math.round(baseComboPrice * (1 - discountRate));
        const savedAmount = baseComboPrice - comboPrice;

        return {
          id: outfit.id,
          title: outfit.title,
          description: outfit.description,
          bannerUrl: outfit.bannerUrl,
          discountRate,
          discountPercent: Math.round(discountRate * 100),
          isActive: outfit.isActive,
          originalPrice: baseComboPrice,
          comboPrice,
          savedAmount,
          clothingOriginalPrice,
          totalOriginalPrice,
          items,
        };
      });

      res.status(200).json({
        success: true,
        data: { outfits: formatted },
      });
    } catch (error) {
      next(error);
    }
  }

  static async createOutfit(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { title, description, bannerUrl, discountRate, isActive, items } = req.body;

      if (!title || typeof title !== "string" || !title.trim()) {
        res.status(400).json({ success: false, message: "Tên Combo không được để trống." });
        return;
      }

      if (!Array.isArray(items) || items.length < 2) {
        res.status(400).json({
          success: false,
          message: "Combo cần tối thiểu 2 món đồ (ví dụ: Áo và Quần).",
        });
        return;
      }

      const rate = Number(discountRate);
      if (isNaN(rate) || rate < 0 || rate > 0.8) {
        res.status(400).json({
          success: false,
          message: "Tỷ lệ giảm giá phải nằm trong khoảng từ 0% đến 80% (0 đến 0.8).",
        });
        return;
      }

      const variantIds = items.map((it: any) => it.variantId).filter(Boolean);
      const existingVariants = await prisma.productVariant.findMany({
        where: { id: { in: variantIds } },
        select: { id: true },
      });

      if (existingVariants.length !== variantIds.length) {
        res.status(400).json({
          success: false,
          message: "Một số biến thể sản phẩm được chọn không tồn tại trong hệ thống.",
        });
        return;
      }

      const outfit = await prisma.outfit.create({
        data: {
          title: title.trim(),
          description: description ? String(description).trim() : null,
          bannerUrl: bannerUrl ? String(bannerUrl).trim() : null,
          discountRate: rate,
          isActive: isActive !== undefined ? Boolean(isActive) : true,
          items: {
            create: items.map((it: any) => ({
              variantId: it.variantId,
              slotType: it.slotType || "TOP",
            })),
          },
        },
        include: {
          items: {
            include: {
              variant: {
                include: { product: true },
              },
            },
          },
        },
      });

      res.status(201).json({
        success: true,
        message: `Đã tạo Combo thời trang "${outfit.title}" thành công!`,
        data: { outfit },
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateOutfit(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { title, description, bannerUrl, discountRate, isActive, items } = req.body;

      const existingOutfit = await prisma.outfit.findUnique({ where: { id } });
      if (!existingOutfit) {
        res.status(404).json({ success: false, message: "Không tìm thấy Combo yêu cầu." });
        return;
      }

      const updateData: any = {};
      if (title !== undefined) {
        if (!title.trim()) {
          res.status(400).json({ success: false, message: "Tên Combo không được để trống." });
          return;
        }
        updateData.title = title.trim();
      }

      if (description !== undefined) {
        updateData.description = description ? String(description).trim() : null;
      }

      if (bannerUrl !== undefined) {
        updateData.bannerUrl = bannerUrl ? String(bannerUrl).trim() : null;
      }

      if (discountRate !== undefined) {
        const rate = Number(discountRate);
        if (isNaN(rate) || rate < 0 || rate > 0.8) {
          res.status(400).json({
            success: false,
            message: "Tỷ lệ giảm giá phải nằm trong khoảng từ 0% đến 80% (0 đến 0.8).",
          });
          return;
        }
        updateData.discountRate = rate;
      }

      if (isActive !== undefined) {
        updateData.isActive = Boolean(isActive);
      }

      if (Array.isArray(items) && items.length > 0) {
        if (items.length < 2) {
          res.status(400).json({
            success: false,
            message: "Combo cần tối thiểu 2 món đồ.",
          });
          return;
        }

        const variantIds = items.map((it: any) => it.variantId).filter(Boolean);
        const existingVariants = await prisma.productVariant.findMany({
          where: { id: { in: variantIds } },
          select: { id: true },
        });

        if (existingVariants.length !== variantIds.length) {
          res.status(400).json({
            success: false,
            message: "Một số biến thể sản phẩm được chọn không tồn tại.",
          });
          return;
        }

        const updated = await prisma.$transaction(async (tx) => {
          await tx.outfitItem.deleteMany({ where: { outfitId: id } });
          return tx.outfit.update({
            where: { id },
            data: {
              ...updateData,
              items: {
                create: items.map((it: any) => ({
                  variantId: it.variantId,
                  slotType: it.slotType || "TOP",
                })),
              },
            },
            include: {
              items: {
                include: {
                  variant: {
                    include: { product: true },
                  },
                },
              },
            },
          });
        });

        res.status(200).json({
          success: true,
          message: "Cập nhật Combo thời trang thành công!",
          data: { outfit: updated },
        });
        return;
      }

      const updated = await prisma.outfit.update({
        where: { id },
        data: updateData,
        include: {
          items: {
            include: {
              variant: {
                include: { product: true },
              },
            },
          },
        },
      });

      res.status(200).json({
        success: true,
        message: "Cập nhật Combo thời trang thành công!",
        data: { outfit: updated },
      });
    } catch (error) {
      next(error);
    }
  }

  static async deleteOutfit(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const existingOutfit = await prisma.outfit.findUnique({ where: { id } });
      if (!existingOutfit) {
        res.status(404).json({ success: false, message: "Không tìm thấy Combo." });
        return;
      }

      await prisma.$transaction([
        prisma.outfitItem.deleteMany({ where: { outfitId: id } }),
        prisma.outfit.delete({ where: { id } }),
      ]);

      res.status(200).json({
        success: true,
        message: `Đã xóa Combo "${existingOutfit.title}" thành công!`,
      });
    } catch (error) {
      next(error);
    }
  }
}
