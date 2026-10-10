import { Request, Response, NextFunction } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import prisma from "../config/db";
import { ENV } from "../config/env";
import { PaymentService, WebhookPayload } from "../services/payment.service";

export class PaymentController {
  /**
   * Tạo liên kết / mã VietQR thanh toán
   */
  static async createPaymentLink(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { orderCode } = req.body;
      const order = await prisma.order.findUnique({
        where: { orderCode: parseInt(orderCode, 10) },
      });

      if (!order) {
        res.status(404).json({ success: false, message: "Không tìm thấy đơn hàng." });
        return;
      }

      // CHỐNG IDOR: Khách hàng chỉ được phép tạo link thanh toán cho đơn hàng của chính mình
      if (req.user?.role === "CUSTOMER" && order.userId !== req.user.id) {
        res.status(403).json({
          success: false,
          message: "Bạn không có quyền thực hiện thanh toán cho đơn hàng của người khác.",
        });
        return;
      }

      if (order.status !== "PENDING_PAYMENT") {
        res.status(400).json({
          success: false,
          message: `Đơn hàng không ở trạng thái chờ thanh toán (Hiện tại: ${order.status}).`,
        });
        return;
      }

      // Giả lập URL VietQR chuẩn Napas (có thể quét qua app ngân hàng)
      const amount = Number(order.finalAmount);
      const memo = `TRENDYFIT ${order.orderCode}`;
      const vietQrUrl = `https://img.vietqr.io/image/970422-0987654321-compact2.png?amount=${amount}&addInfo=${encodeURIComponent(
        memo
      )}&accountName=CONG%20TY%20CP%20TRENDYFIT`;

      res.status(200).json({
        success: true,
        message: "Tạo thông tin thanh toán thành công.",
        data: {
          orderCode: order.orderCode,
          amount,
          vietQrUrl,
          isMockMode: ENV.PAYMENT_MOCK_MODE,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Nhận Webhook xác thực từ PayOS
   */
  static async handleWebhook(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const payload: WebhookPayload = req.body;
      const result = await PaymentService.processWebhook(payload);
      res.status(200).json(result);
    } catch (error: any) {
      console.error("[Webhook Error]:", error.message);
      res.status(400).json({ success: false, message: error.message });
    }
  }

  /**
   * Kích hoạt Giả lập Thanh toán (Mock Payment Simulator):
   * BẢO MẬT: Chỉ chạy khi DEV/DEMO và phải đúng chính chủ đơn hàng (Chống IDOR & TH-04).
   */
  static async simulateMockPayment(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      // 1. Kiểm tra môi trường
      if (!ENV.PAYMENT_MOCK_MODE || ENV.NODE_ENV === "production") {
        res.status(403).json({
          success: false,
          message: "Tính năng giả lập thanh toán đã bị khóa trong môi trường production vì lý do bảo mật.",
        });
        return;
      }

      const { orderCode } = req.body;
      const userId = req.user?.id;

      const order = await prisma.order.findUnique({
        where: { orderCode: parseInt(orderCode, 10) },
      });

      if (!order) {
        res.status(404).json({ success: false, message: "Không tìm thấy đơn hàng." });
        return;
      }

      // 2. Kiểm tra quyền sở hữu đơn hàng (Chống IDOR)
      if (order.userId !== userId && req.user?.role === "CUSTOMER") {
        res.status(403).json({
          success: false,
          message: "Bạn không có quyền kích hoạt thanh toán cho đơn hàng của người khác.",
        });
        return;
      }

      // 3. Tự động sinh Webhook Payload có kèm chữ ký số HMAC-SHA256 hợp lệ
      const webhookData = {
        orderCode: order.orderCode,
        amount: Number(order.finalAmount),
        description: `MOCK PAYMENT FOR ORDER ${order.orderCode}`,
        reference: `MOCK_REF_${Date.now()}`,
      };

      const signature = PaymentService.generateSignature(webhookData, ENV.PAYOS_CHECKSUM_KEY);

      const mockPayload: WebhookPayload = {
        code: "00",
        desc: "Success",
        data: webhookData,
        signature,
      };

      // 4. Đẩy payload qua pipeline Webhook chuẩn để kiểm tra toàn vẹn
      const result = await PaymentService.processWebhook(mockPayload);

      res.status(200).json({
        success: true,
        message: "Giả lập thanh toán thành công qua Mock Payment Engine (HMAC-SHA256 verified)!",
        data: result,
      });
    } catch (error: any) {
      next(error);
    }
  }
}
