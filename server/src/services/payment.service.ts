import crypto from "crypto";
import prisma from "../config/db";
import { ENV } from "../config/env";

export interface WebhookData {
  orderCode: number;
  amount: number;
  description: string;
  accountNumber?: string;
  reference?: string;
  transactionDateTime?: string;
  currency?: string;
  paymentLinkId?: string;
  code?: string;
  desc?: string;
}

export interface WebhookPayload {
  code: string;
  desc: string;
  data: WebhookData;
  signature: string;
}

export class PaymentService {
  /**
   * Tạo chữ ký số HMAC-SHA256 chuẩn theo định dạng PayOS:
   * Sắp xếp các trường của object `data` theo thứ tự alphabet rồi nối thành chuỗi `k1=v1&k2=v2...`
   */
  static generateSignature(data: Record<string, any>, checksumKey: string): string {
    const sortedKeys = Object.keys(data).sort();
    const queryParts: string[] = [];

    for (const key of sortedKeys) {
      const val = data[key];
      if (val !== undefined && val !== null) {
        queryParts.push(`${key}=${val}`);
      }
    }

    const dataString = queryParts.join("&");
    return crypto.createHmac("sha256", checksumKey).update(dataString).digest("hex");
  }

  /**
   * Xác thực chữ ký Webhook nhận được từ PayOS hoặc Mock Engine
   */
  static verifySignature(payload: WebhookPayload): boolean {
    if (!payload.signature || !payload.data) return false;
    const computedSignature = this.generateSignature(payload.data, ENV.PAYOS_CHECKSUM_KEY);
    return crypto.timingSafeEqual(
      Buffer.from(computedSignature),
      Buffer.from(payload.signature)
    );
  }

  /**
   * Xử lý Webhook thanh toán:
   * 1. Kiểm tra chữ ký HMAC-SHA256
   * 2. Tìm đơn hàng theo orderCode và so sánh chính xác số tiền amount == finalAmount
   * 3. Chuyển Order sang PAID trong transaction, chốt lock sang COMMITTED
   * 4. Nếu đơn đã CANCELLED (quá hạn) mà tiền vẫn tới -> Chuyển sang PAYMENT_EXPIRED_PENDING_REFUND
   */
  static async processWebhook(payload: WebhookPayload): Promise<{ success: boolean; message: string }> {
    const isValid = this.verifySignature(payload);
    if (!isValid) {
      throw new Error("Chữ ký Webhook không hợp lệ! Từ chối xử lý.");
    }

    // Kiểm tra mã kết quả từ PayOS (00 là thành công)
    if (payload.code !== "00") {
      throw new Error(`Webhook không xác nhận giao dịch thành công (Mã kết quả: ${payload.code ?? "KHÔNG_XÁC_ĐỊNH"}).`);
    }

    const { orderCode, amount, reference } = payload.data;

    const order = await prisma.order.findUnique({
      where: { orderCode },
      include: { locks: true, voucher: true },
    });

    if (!order) {
      throw new Error(`Không tìm thấy đơn hàng với mã #${orderCode}`);
    }

    // Kiểm tra khớp số tiền (chống sửa giá)
    if (Number(order.finalAmount) !== Number(amount)) {
      throw new Error(
        `Số tiền thanh toán (${amount}) không khớp với giá trị đơn hàng (${order.finalAmount}).`
      );
    }

    // KIỂM TRA IDEMPOTENCY: Nếu đơn hàng đã được ghi nhận thanh toán, hoàn tiền muộn hoặc đã chuyển sang các bước sau
    if (
      order.paymentStatus === "PAID" ||
      order.status === "PAYMENT_EXPIRED_PENDING_REFUND" ||
      ["PAID", "PROCESSING", "SHIPPING", "DELIVERED"].includes(order.status)
    ) {
      return { success: true, message: "Đơn hàng đã được ghi nhận trước đó (Idempotent)." };
    }

    // Trường hợp đơn đã bị hủy (hết hạn 10p) mà khách vẫn chuyển tiền thành công
    if (order.status === "CANCELLED") {
      await prisma.$transaction(async (tx) => {
        await tx.order.update({
          where: { id: order.id },
          data: {
            status: "PAYMENT_EXPIRED_PENDING_REFUND",
            paymentStatus: "PAID_EXPIRED",
          },
        });

        await tx.paymentTransaction.upsert({
          where: { orderId: order.id },
          create: {
            orderId: order.id,
            amount: order.finalAmount,
            provider: "PAYOS",
            status: "EXPIRED_REFUND_PENDING",
            transactionRef: reference || null,
            webhookPayload: payload as any,
          },
          update: {
            status: "EXPIRED_REFUND_PENDING",
            transactionRef: reference || null,
            webhookPayload: payload as any,
          },
        });
      });

      return {
        success: true,
        message: "Đơn hàng quá hạn đã hủy, ghi nhận tiền vào trạng thái chờ hoàn tiền.",
      };
    }

    // CẬP NHẬT CHÍNH THỨC SANG PAID
    let isLateRefund = false;
    await prisma.$transaction(async (tx) => {
      // Dùng điều kiện nguyên tử WHERE status = 'PENDING_PAYMENT'
      const updatedOrders = await tx.$executeRaw`
        UPDATE "Order"
        SET "status" = 'PAID', "paymentStatus" = 'PAID'
        WHERE "id" = ${order.id} AND "status" = 'PENDING_PAYMENT'
      `;

      if (updatedOrders === 0) {
        // Kiểm tra lại trạng thái hiện tại trong DB để xử lý Idempotent hoặc Race Condition với Cron/Admin
        const currentOrder = await tx.order.findUnique({ where: { id: order.id } });
        if (
          currentOrder?.status === "PAID" ||
          currentOrder?.paymentStatus === "PAID" ||
          currentOrder?.status === "PAYMENT_EXPIRED_PENDING_REFUND"
        ) {
          // Idempotent: Webhook đã được ghi nhận trước đó
          return;
        }

        if (currentOrder?.status === "CANCELLED") {
          // Race condition: Đơn vừa bị Cron/Admin hủy ngay trước lệnh UPDATE -> Chuyển sang chờ hoàn tiền
          isLateRefund = true;
          await tx.order.update({
            where: { id: order.id },
            data: {
              status: "PAYMENT_EXPIRED_PENDING_REFUND",
              paymentStatus: "PAID_EXPIRED",
            },
          });

          await tx.paymentTransaction.upsert({
            where: { orderId: order.id },
            create: {
              orderId: order.id,
              amount: order.finalAmount,
              provider: "PAYOS",
              status: "EXPIRED_REFUND_PENDING",
              transactionRef: reference || null,
              webhookPayload: payload as any,
            },
            update: {
              status: "EXPIRED_REFUND_PENDING",
              transactionRef: reference || null,
              webhookPayload: payload as any,
            },
          });
          return;
        }

        throw new Error("Trạng thái đơn hàng không ở chế độ PENDING_PAYMENT, không thể chuyển sang PAID.");
      }

      // Chuyển toàn bộ InventoryLock sang COMMITTED
      await tx.$executeRaw`
        UPDATE "InventoryLock"
        SET "status" = 'COMMITTED'
        WHERE "orderId" = ${order.id} AND "status" = 'LOCKED'
      `;

      // Nếu có dùng voucher, tăng usedCount có điều kiện (usedCount < usageLimit)
      if (order.voucherId) {
        const voucherUpdated = await tx.$executeRaw`
          UPDATE "Voucher"
          SET "usedCount" = "usedCount" + 1
          WHERE "id" = ${order.voucherId} AND "usedCount" < "usageLimit"
        `;

        if (voucherUpdated === 0) {
          console.warn(
            `[PAYMENT WEBHOOK] Cảnh báo: Voucher "${order.voucherId}" của đơn #${order.orderCode} không thể tăng usedCount (có thể đã đạt usageLimit).`
          );
        }
      }

      // Ghi nhận PaymentTransaction
      await tx.paymentTransaction.upsert({
        where: { orderId: order.id },
        create: {
          orderId: order.id,
          amount: order.finalAmount,
          provider: "PAYOS",
          status: "SUCCESS",
          transactionRef: reference || `REF_${Date.now()}`,
          webhookPayload: payload as any,
        },
        update: {
          status: "SUCCESS",
          transactionRef: reference || `REF_${Date.now()}`,
          webhookPayload: payload as any,
        },
      });
    });

    if (isLateRefund) {
      return {
        success: true,
        message: "Đơn hàng quá hạn đã hủy, ghi nhận tiền vào trạng thái chờ hoàn tiền.",
      };
    }

    return { success: true, message: `Thanh toán thành công đơn hàng #${orderCode}.` };
  }
}
