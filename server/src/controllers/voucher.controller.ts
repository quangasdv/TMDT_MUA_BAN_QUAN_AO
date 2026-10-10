import { Request, Response, NextFunction } from "express";
import prisma from "../config/db";

export class VoucherController {
  static async applyVoucher(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { voucherCode, totalAmount } = req.body;

      if (!voucherCode || totalAmount === undefined) {
        res.status(400).json({
          success: false,
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
          message: "Mã giảm giá không tồn tại hoặc đã bị khóa.",
        });
        return;
      }

      if (new Date() > voucher.expiresAt) {
        res.status(400).json({
          success: false,
          message: "Mã giảm giá đã hết hạn sử dụng.",
        });
        return;
      }

      if (voucher.usedCount >= voucher.usageLimit) {
        res.status(400).json({
          success: false,
          message: "Mã giảm giá đã hết lượt sử dụng.",
        });
        return;
      }

      const orderTotal = Number(totalAmount);
      if (orderTotal < Number(voucher.minOrderValue)) {
        res.status(400).json({
          success: false,
          message: `Đơn hàng tối thiểu phải từ ${voucher.minOrderValue.toLocaleString()}đ để áp dụng mã này.`,
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
