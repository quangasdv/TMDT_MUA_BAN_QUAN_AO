import { Request, Response, NextFunction } from "express";
import prisma from "../config/db";

export class VoucherController {
  /**
   * Lấy danh sách Voucher khả dụng cho khách hàng (Storefront Checkout)
   * GET /api/vouchers/active
   */
  static async getActiveVouchers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const now = new Date();
      const vouchers = await prisma.voucher.findMany({
        where: {
          isActive: true,
          expiresAt: { gt: now },
        },
        select: {
          id: true,
          code: true,
          discountType: true,
          discountValue: true,
          minOrderValue: true,
          expiresAt: true,
          usedCount: true,
          usageLimit: true,
        },
        orderBy: { discountValue: "desc" },
        take: 12,
      });

      // Lọc các voucher còn lượt sử dụng
      const availableVouchers = vouchers.filter((v) => v.usedCount < v.usageLimit);

      res.status(200).json({
        success: true,
        data: { vouchers: availableVouchers },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Kiểm tra và áp dụng mã giảm giá
   * POST /api/vouchers/apply
   */
  static async applyVoucher(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { voucherCode, totalAmount } = req.body;

      if (!voucherCode || totalAmount === undefined) {
        res.status(400).json({
          success: false,
          errorCode: "VALIDATION_ERROR",
          message: "Vui lòng cung cấp mã voucher và tổng giá trị đơn hàng.",
        });
        return;
      }

      const voucher = await prisma.voucher.findUnique({
        where: { code: voucherCode },
      });

      if (!voucher || !voucher.isActive) {
        res.status(404).json({
          success: false,
          errorCode: "VOUCHER_NOT_FOUND",
          message: "Mã giảm giá không tồn tại hoặc đã bị khóa.",
        });
        return;
      }

      if (new Date() > voucher.expiresAt) {
        res.status(400).json({
          success: false,
          errorCode: "VOUCHER_EXPIRED",
          message: "Mã giảm giá đã hết hạn sử dụng.",
        });
        return;
      }

      if (voucher.usedCount >= voucher.usageLimit) {
        res.status(400).json({
          success: false,
          errorCode: "VOUCHER_USAGE_LIMIT",
          message: "Mã giảm giá đã hết lượt sử dụng.",
        });
        return;
      }

      const orderTotal = Number(totalAmount);
      if (orderTotal < Number(voucher.minOrderValue)) {
        res.status(400).json({
          success: false,
          errorCode: "VOUCHER_MIN_ORDER_VALUE",
          message: `Đơn hàng tối thiểu phải từ ${Number(voucher.minOrderValue).toLocaleString()}đ để áp dụng mã này.`,
        });
        return;
      }

      let discountAmount = 0;
      if (voucher.discountType === "PERCENT") {
        discountAmount = orderTotal * (Number(voucher.discountValue) / 100);
      } else {
        discountAmount = Number(voucher.discountValue);
      }

      // Không giảm vượt quá tổng giá trị đơn
      discountAmount = Math.min(discountAmount, orderTotal);
      const finalAmount = orderTotal - discountAmount;

      res.status(200).json({
        success: true,
        message: "Áp dụng mã giảm giá thành công!",
        data: {
          voucherId: voucher.id,
          code: voucher.code,
          discountAmount,
          finalAmount,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}
