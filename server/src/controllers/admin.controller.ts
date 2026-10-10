import { Request, Response, NextFunction } from "express";
import prisma from "../config/db";

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
            const affected = await tx.$executeRaw`
              UPDATE "Order"
              SET "status" = 'CANCELLED'
              WHERE "id" = ${id} AND "status" = 'PENDING_PAYMENT'
            `;

            if (affected === 0) {
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

              await tx.$executeRaw`
                UPDATE "ProductVariant"
                SET "stockQuantity" = "stockQuantity" + ${lock.quantity}
                WHERE "id" = ${lock.variantId}
              `;
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

      // Đổi trạng thái thông thường có kiểm tra điều kiện nguyên tử
      const affected = await prisma.$executeRaw`
        UPDATE "Order"
        SET "status" = ${status}
        WHERE "id" = ${id} AND "status" = ${order.status}
      `;

      if (affected === 0) {
        res.status(409).json({
          success: false,
          message: "Trạng thái đơn hàng đã bị thay đổi bởi thao tác khác. Vui lòng tải lại trang.",
        });
        return;
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
      const { name, description, basePrice, categoryId, isActive } = req.body;

      if (basePrice !== undefined) {
        const base = Number(basePrice);
        if (!Number.isFinite(base) || base < 0) {
          res.status(400).json({ success: false, message: "Giá gốc sản phẩm không được là số âm." });
          return;
        }
      }

      const product = await prisma.product.update({
        where: { id },
        data: {
          ...(name && { name }),
          ...(description && { description }),
          ...(basePrice !== undefined && { basePrice }),
          ...(categoryId && { categoryId }),
          ...(isActive !== undefined && { isActive }),
        },
      });

      res.status(200).json({
        success: true,
        message: "Cập nhật sản phẩm thành công!",
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

      const voucher = await prisma.voucher.create({
        data: {
          code: code.toUpperCase(),
          discountType,
          discountValue: val,
          minOrderValue: minOrderValue ? Math.max(0, Number(minOrderValue)) : 0,
          usageLimit: usageLimit ? Math.max(1, parseInt(usageLimit, 10)) : 100,
          expiresAt: new Date(expiresAt),
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
}
