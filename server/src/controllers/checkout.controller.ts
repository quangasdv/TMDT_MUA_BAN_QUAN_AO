import { Response, NextFunction } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import prisma from "../config/db";
import { InventoryService } from "../services/inventory.service";
import { z } from "zod";

const checkoutSchema = z.object({
  recipientName: z.string().min(2, "Họ tên người nhận tối thiểu 2 ký tự"),
  recipientPhone: z.string().min(8, "Số điện thoại người nhận không hợp lệ"),
  shippingAddress: z.string().min(5, "Địa chỉ giao hàng tối thiểu 5 ký tự"),
  voucherCode: z.string().optional(),
  items: z
    .array(
      z.object({
        variantId: z.string().min(1, "variantId không được để trống"),
        quantity: z
          .number({ invalid_type_error: "Số lượng phải là số" })
          .int("Số lượng phải là số nguyên")
          .min(1, "Số lượng đặt mua tối thiểu phải là 1"),
      })
    )
    .min(1, "Đơn hàng phải có ít nhất 1 sản phẩm"),
});

export class CheckoutController {
  /**
   * Tạo đơn hàng và khóa giữ kho tạm thời 10 phút:
   * 1. Kiểm tra giới hạn tối đa 2 đơn PENDING_PAYMENT để chống spam giữ kho (Mục 8.5 & TH-11).
   * 2. Lấy đơn giá thực tế từ Database để tính tổng tiền (chống client thao túng giá).
   * 3. Thực thi $transaction: tạo Order, OrderItem, khóa kho nguyên tử bằng InventoryService, dọn giỏ hàng.
   */
  static async lockAndCheckout(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, message: "Vui lòng đăng nhập để tiến hành đặt hàng." });
        return;
      }

      // Xác thực dữ liệu đầu vào bằng Zod (chặn triệt để hack số âm / số thập phân)
      const validatedData = checkoutSchema.parse(req.body);
      const { recipientName, recipientPhone, shippingAddress, voucherCode, items } = validatedData;

      // TH-11: Giới hạn tối đa 2 đơn PENDING_PAYMENT
      const pendingCount = await prisma.order.count({
        where: { userId, status: "PENDING_PAYMENT" },
      });

      if (pendingCount >= 2) {
        res.status(429).json({
          success: false,
          message: "Bạn đang có 2 đơn hàng chờ thanh toán. Vui lòng thanh toán hoặc chờ hết hạn trước khi tạo đơn mới.",
        });
        return;
      }

      // Lấy thông tin biến thể từ DB để tính giá chính xác
      const variantIds = items.map((i: any) => i.variantId);
      const variants = await prisma.productVariant.findMany({
        where: { id: { in: variantIds } },
        include: { product: true },
      });

      if (variants.length !== items.length) {
        res.status(400).json({ success: false, message: "Một số sản phẩm không tồn tại trong hệ thống." });
        return;
      }

      // Chặn đặt hàng các sản phẩm đã bị ẩn (isActive = false)
      if (variants.some((v) => !v.product.isActive)) {
        res.status(400).json({ success: false, message: "Một số sản phẩm không còn mở bán hoặc đã ngừng kinh doanh." });
        return;
      }

      let totalAmount = 0;
      const orderItemsData: Array<{ variantId: string; quantity: number; unitPrice: number }> = [];

      for (const item of items) {
        const v = variants.find((variant) => variant.id === item.variantId);
        if (!v) continue;
        const unitPrice = Number(v.product.basePrice) + Number(v.priceAdjustment);
        totalAmount += unitPrice * item.quantity;
        orderItemsData.push({
          variantId: v.id,
          quantity: item.quantity,
          unitPrice,
        });
      }

      // Tính voucher nếu có
      let voucherId: string | null = null;
      let discountAmount = 0;
      if (voucherCode) {
        const voucher = await prisma.voucher.findUnique({
          where: { code: voucherCode, isActive: true },
        });

        if (voucher && new Date() <= voucher.expiresAt && voucher.usedCount < voucher.usageLimit && totalAmount >= Number(voucher.minOrderValue)) {
          voucherId = voucher.id;
          if (voucher.discountType === "PERCENT") {
            discountAmount = totalAmount * (Number(voucher.discountValue) / 100);
          } else {
            discountAmount = Number(voucher.discountValue);
          }
          discountAmount = Math.min(discountAmount, totalAmount);
        }
      }

      const finalAmount = totalAmount - discountAmount;
      const orderCode = Math.floor(100000 + Math.random() * 900000); // 6 số ngẫu nhiên

      // Thực thi Transaction nguyên tử
      const createdOrder = await prisma.$transaction(async (tx) => {
        // Khóa dòng User để ngăn chặn Race Condition khi gửi đồng thời nhiều request checkout
        await tx.$queryRaw`SELECT "id" FROM "User" WHERE "id" = ${userId} FOR UPDATE`;

        // Kiểm tra lại pendingCount trong transaction đã khóa dòng
        const currentPendingCount = await tx.order.count({
          where: { userId, status: "PENDING_PAYMENT" },
        });

        if (currentPendingCount >= 2) {
          const err: any = new Error(
            "Bạn đang có 2 đơn hàng chờ thanh toán. Vui lòng thanh toán hoặc chờ hết hạn trước khi tạo đơn mới."
          );
          err.statusCode = 429;
          throw err;
        }

        // 1. Tạo Order
        const order = await tx.order.create({
          data: {
            orderCode,
            userId,
            recipientName,
            recipientPhone,
            shippingAddress,
            voucherId,
            totalAmount,
            discountAmount,
            finalAmount,
            status: "PENDING_PAYMENT",
            paymentStatus: "UNPAID",
          },
        });

        // 2. Tạo OrderItems
        for (const item of orderItemsData) {
          await tx.orderItem.create({
            data: {
              orderId: order.id,
              variantId: item.variantId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
            },
          });
        }

        // 3. Khóa kho nguyên tử (Atomic Conditional Update)
        await InventoryService.lockInventory(
          order.id,
          items.map((i: any) => ({ variantId: i.variantId, quantity: i.quantity })),
          tx
        );

        // 4. Xóa món trong giỏ hàng
        const userCart = await tx.cart.findUnique({ where: { userId } });
        if (userCart) {
          await tx.cartItem.deleteMany({
            where: {
              cartId: userCart.id,
              variantId: { in: variantIds },
            },
          });
        }

        return order;
      });

      res.status(201).json({
        success: true,
        message: "Đặt hàng thành công! Đơn hàng được giữ trong 10 phút để thanh toán.",
        data: {
          order: createdOrder,
          lockDurationSeconds: 600,
        },
      });
    } catch (error: any) {
      if (error.statusCode === 429) {
        res.status(429).json({ success: false, message: error.message });
        return;
      }
      if (error.message?.includes("hết hàng")) {
        res.status(409).json({ success: false, message: error.message });
        return;
      }
      next(error);
    }
  }

  static async getUserOrders(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      const orders = await prisma.order.findMany({
        where: { userId },
        include: {
          items: {
            include: {
              variant: {
                include: { product: true },
              },
            },
          },
          payment: true,
        },
        orderBy: { createdAt: "desc" },
      });

      res.status(200).json({ success: true, data: { orders } });
    } catch (error) {
      next(error);
    }
  }

  static async getOrderByCode(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const code = parseInt(req.params.code, 10);
      const order = await prisma.order.findUnique({
        where: { orderCode: code },
        include: {
          items: {
            include: {
              variant: {
                include: { product: true },
              },
            },
          },
          locks: true,
          payment: true,
          voucher: true,
        },
      });

      if (!order) {
        res.status(404).json({ success: false, message: "Không tìm thấy đơn hàng." });
        return;
      }

      // Kiểm tra quyền: chỉ chính chủ hoặc Admin/Staff được xem chi tiết
      if (req.user?.role === "CUSTOMER" && order.userId !== req.user.id) {
        res.status(403).json({ success: false, message: "Bạn không có quyền xem đơn hàng này." });
        return;
      }

      res.status(200).json({ success: true, data: { order } });
    } catch (error) {
      next(error);
    }
  }
}
