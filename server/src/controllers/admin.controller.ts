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

      // Nếu đơn bị hủy khi đang PROCESSING hoặc PAID, hoàn trả số lượng tồn kho
      if (status === "CANCELLED" && (order.status === "PROCESSING" || order.status === "PAID")) {
        const orderItems = await prisma.orderItem.findMany({ where: { orderId: id } });
        for (const item of orderItems) {
          await prisma.productVariant.update({
            where: { id: item.variantId },
            data: { stockQuantity: { increment: item.quantity } },
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

      // 2. Cập nhật từng biến thể SKU nếu có (màu sắc, size, giá phụ thu, tồn kho, link ảnh biến thể)
      if (Array.isArray(variants) && variants.length > 0) {
        for (const v of variants) {
          if (v.id) {
            await prisma.productVariant.update({
              where: { id: v.id },
              data: {
                ...(v.color && { color: v.color }),
                ...(v.size && { size: v.size }),
                ...(v.priceAdjustment !== undefined && { priceAdjustment: Number(v.priceAdjustment) }),
                ...(v.stockQuantity !== undefined && { stockQuantity: Number(v.stockQuantity) }),
                ...(v.imageUrl !== undefined && { imageUrl: v.imageUrl }),
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

}
