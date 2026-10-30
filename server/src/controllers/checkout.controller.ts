import { Response, NextFunction } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import prisma from "../config/db";
import { InventoryService } from "../services/inventory.service";
import { OrderStatus } from "@prisma/client";
import { z } from "zod";

const checkoutSchema = z.object({
  recipientName: z.string().min(2, "Họ tên người nhận tối thiểu 2 ký tự"),
  recipientPhone: z
    .string()
    .regex(
      /^0[35789][0-9]{8}$/,
      "Số điện thoại nhận hàng không hợp lệ (cần 10 chữ số, bắt đầu bằng 03, 05, 07, 08, 09)"
    ),
  shippingAddress: z.string().min(5, "Địa chỉ giao hàng tối thiểu 5 ký tự"),
  voucherCode: z.string().optional(),
  outfitId: z.string().optional(),
  paymentMethod: z.enum(["QR", "COD", "BANK_TRANSFER_MOCK"]).default("QR"),
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
   * Tạo đơn hàng và xử lý khóa kho:
   * - Nếu thanh toán QR / Online: Tạo PENDING_PAYMENT, khóa giữ kho tạm thời 10 phút.
   * - Nếu thanh toán COD: Tạo PROCESSING, khóa kho chính thức (COMMITTED), không bị hủy bởi Cron 10 phút.
   */
  static async lockAndCheckout(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({
          success: false,
          errorCode: "AUTH_UNAUTHORIZED",
          message: "Vui lòng đăng nhập để tiến hành đặt hàng.",
        });
        return;
      }

      // Xác thực dữ liệu đầu vào bằng Zod
      const validatedData = checkoutSchema.parse(req.body);
      const { recipientName, recipientPhone, shippingAddress, voucherCode, outfitId, paymentMethod, items } = validatedData;
      const isCod = paymentMethod === "COD";

      // Nếu là thanh toán online: Kiểm tra giới hạn tối đa 2 đơn PENDING_PAYMENT để chống spam giữ kho
      if (!isCod) {
        const pendingCount = await prisma.order.count({
          where: { userId, status: OrderStatus.PENDING_PAYMENT },
        });

        if (pendingCount >= 2) {
          res.status(429).json({
            success: false,
            errorCode: "ORDER_PENDING_LIMIT_REACHED",
            message: "Bạn đang có 2 đơn hàng chờ thanh toán. Vui lòng thanh toán hoặc chờ hết hạn trước khi tạo đơn mới.",
          });
          return;
        }
      }

      // Lấy thông tin biến thể từ DB để tính giá chính xác
      const variantIds = items.map((i: any) => i.variantId);
      const variants = await prisma.productVariant.findMany({
        where: { id: { in: variantIds } },
        include: { product: true },
      });

      if (variants.length !== items.length) {
        res.status(400).json({
          success: false,
          errorCode: "PRODUCT_NOT_FOUND",
          message: "Một số sản phẩm không tồn tại trong hệ thống.",
        });
        return;
      }

      // Chặn đặt hàng các sản phẩm đã bị ẩn (isActive = false)
      if (variants.some((v) => !v.product.isActive)) {
        res.status(400).json({
          success: false,
          errorCode: "PRODUCT_INACTIVE",
          message: "Một số sản phẩm không còn mở bán hoặc đã ngừng kinh doanh.",
        });
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

        if (
          voucher &&
          new Date() <= voucher.expiresAt &&
          voucher.usedCount < voucher.usageLimit &&
          totalAmount >= Number(voucher.minOrderValue)
        ) {
          voucherId = voucher.id;
          if (voucher.discountType === "PERCENT") {
            discountAmount = totalAmount * (Number(voucher.discountValue) / 100);
          } else {
            discountAmount = Number(voucher.discountValue);
          }
          discountAmount = Math.min(discountAmount, totalAmount);
        }
      }

      // Tính phí vận chuyển theo chính sách phân vùng địa lý của TrendyFit:
      // - Đơn hàng >= 499.000 đ: Miễn phí vận chuyển (Freeship 0 đ)
      // - Đơn hàng < 499.000 đ:
      //   + Nội thành TP.HCM (Kho shop): 20.000 đ
      //   + Miền Nam lân cận (Bình Dương, Đồng Nai, Cần Thơ...): 25.000 đ
      //   + Miền Trung & Miền Bắc: 35.000 đ

      // Tinh uu dai Combo thoi trang neu co outfitId hop le (Dynamic Bundle Matching)
      let comboDiscount = 0;
      if (outfitId) {
        const outfit = await prisma.outfit.findUnique({
          where: { id: outfitId, isActive: true },
          include: { items: true },
        });

        if (outfit && outfit.items.length > 0) {
          const requiredClothingItems = outfit.items.filter((it) =>
            ["TOP", "BOTTOM", "OUTERWEAR"].includes(it.slotType)
          );

          if (requiredClothingItems.length > 0) {
            const quantities = requiredClothingItems.map((reqItem) => {
              const orderedItem = items.find((it) => it.variantId === reqItem.variantId);
              return orderedItem ? orderedItem.quantity : 0;
            });

            const eligibleComboCount = Math.min(...quantities);

            if (eligibleComboCount > 0) {
              let singleSetPrice = 0;
              for (const reqItem of requiredClothingItems) {
                const v = variants.find((vr) => vr.id === reqItem.variantId);
                if (v) {
                  singleSetPrice += Number(v.product.basePrice) + Number(v.priceAdjustment);
                }
              }

              const discountRate = Number(outfit.discountRate) || 0.15;
              comboDiscount = Math.round(eligibleComboCount * singleSetPrice * discountRate);
              discountAmount += comboDiscount;
              discountAmount = Math.min(discountAmount, totalAmount);
            }
          }
        }
      }

      let shippingFee = 0;
      if (totalAmount < 499000) {
        const addr = shippingAddress.toLowerCase();
        if (
          addr.includes("hồ chí minh") ||
          addr.includes("ho chi minh") ||
          addr.includes("hcm") ||
          addr.includes("sài gòn")
        ) {
          shippingFee = 20000;
        } else if (
          addr.includes("bình dương") ||
          addr.includes("đồng nai") ||
          addr.includes("bà rịa") ||
          addr.includes("vũng tàu") ||
          addr.includes("cần thơ") ||
          addr.includes("long an") ||
          addr.includes("tiền giang") ||
          addr.includes("tây ninh") ||
          addr.includes("bến tre") ||
          addr.includes("vĩnh long") ||
          addr.includes("hậu giang") ||
          addr.includes("sóc trăng") ||
          addr.includes("đồng tháp") ||
          addr.includes("an giang") ||
          addr.includes("kiên giang") ||
          addr.includes("bạc liêu") ||
          addr.includes("cà mau")
        ) {
          shippingFee = 25000;
        } else {
          shippingFee = 35000;
        }
      }

      const finalAmount = totalAmount - discountAmount + shippingFee;
      const orderCode = Math.floor(100000 + Math.random() * 900000); // 6 số ngẫu nhiên

      // Thực thi Transaction nguyên tử
      const createdOrder = await prisma.$transaction(async (tx) => {
        // Khóa dòng User để ngăn chặn Race Condition khi gửi đồng thời nhiều request checkout
        await tx.$queryRaw`SELECT "id" FROM "User" WHERE "id" = ${userId} FOR UPDATE`;

        if (!isCod) {
          const currentPendingCount = await tx.order.count({
            where: { userId, status: OrderStatus.PENDING_PAYMENT },
          });

          if (currentPendingCount >= 2) {
            const err: any = new Error(
              "Bạn đang có 2 đơn hàng chờ thanh toán. Vui lòng thanh toán hoặc chờ hết hạn trước khi tạo đơn mới."
            );
            err.statusCode = 429;
            throw err;
          }
        }

        // 1. Tạo Order (COD -> PROCESSING luôn; QR -> PENDING_PAYMENT)
        const initialStatus = isCod ? OrderStatus.PROCESSING : OrderStatus.PENDING_PAYMENT;

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
            status: initialStatus,
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

        // 4. Nếu là đơn COD: Cam kết khóa kho chính thức ngay (COMMITTED) & tạo Transaction COD
        if (isCod) {
          await tx.inventoryLock.updateMany({
            where: { orderId: order.id },
            data: { status: "COMMITTED" },
          });

          await tx.paymentTransaction.create({
            data: {
              orderId: order.id,
              amount: finalAmount,
              provider: "COD",
              status: "PENDING",
            },
          });

          if (voucherId) {
            await tx.voucher.update({
              where: { id: voucherId },
              data: { usedCount: { increment: 1 } },
            });
          }
        }

        // 5. Xóa món đã đặt khỏi giỏ hàng
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

      if (isCod) {
        res.status(201).json({
          success: true,
          message: "Đặt hàng thành công với hình thức Thanh toán khi nhận hàng (COD)! Đơn hàng đang được đóng gói chuẩn bị giao.",
          data: {
            order: createdOrder,
            paymentMethod: "COD",
            isCod: true,
          },
        });
      } else {
        res.status(201).json({
          success: true,
          message: "Đặt hàng thành công! Đơn hàng được giữ trong 10 phút để thanh toán.",
          data: {
            order: createdOrder,
            paymentMethod: "QR",
            isCod: false,
            lockDurationSeconds: 600,
          },
        });
      }
    } catch (error: any) {
      if (error.statusCode === 429) {
        res.status(429).json({ success: false, errorCode: "ORDER_PENDING_LIMIT_REACHED", message: error.message });
        return;
      }
      if (error.message?.includes("hết hàng")) {
        res.status(409).json({ success: false, errorCode: "INSUFFICIENT_STOCK", message: error.message });
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

      // Phân tách minh bạch chiết khấu Voucher và ưu đãi Combo thời trang
      let voucherDiscount = 0;
      if (order.voucher) {
        if (order.voucher.discountType === "PERCENT") {
          voucherDiscount = Math.round(Number(order.totalAmount) * (Number(order.voucher.discountValue) / 100));
        } else {
          voucherDiscount = Number(order.voucher.discountValue);
        }
        voucherDiscount = Math.min(voucherDiscount, Number(order.discountAmount));
      }
      const comboDiscount = Math.max(0, Number(order.discountAmount) - voucherDiscount);

      const orderData = {
        ...order,
        voucherDiscount,
        comboDiscount,
      };

      res.status(200).json({ success: true, data: { order: orderData } });
    } catch (error) {
      next(error);
    }
  }
}
