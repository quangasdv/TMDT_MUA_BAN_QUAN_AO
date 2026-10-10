import cron from "node-cron";
import prisma from "../config/db";

export class CronService {
  /**
   * Khởi động Cron Job định kỳ 1 phút quét một lần:
   * Tìm kiếm các đơn hàng quá hạn 10 phút chưa thanh toán.
   * Dùng bảng Order làm CỔNG DUY NHẤT để loại trừ triệt để race condition với Webhook!
   */
  static init(): void {
    cron.schedule("* * * * *", async () => {
      try {
        await this.releaseExpiredLocks();
      } catch (error) {
        console.error("[Cron Error] Lỗi khi quét giải phóng đơn quá hạn:", error);
      }
    });
    console.log("[Cron Service] Đã kích hoạt tiến trình quét đơn quá hạn (chu kỳ 1 phút).");
  }

  static async releaseExpiredLocks(): Promise<void> {
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);

    // Tìm các đơn hàng PENDING_PAYMENT tạo trước 10 phút
    const expiredOrders = await prisma.order.findMany({
      where: {
        status: "PENDING_PAYMENT",
        createdAt: { lte: tenMinutesAgo },
      },
      include: {
        locks: {
          where: { status: "LOCKED" },
        },
      },
    });

    for (const order of expiredOrders) {
      await prisma.$transaction(async (tx) => {
        // CỔNG DUY NHẤT: Thử chuyển Order sang CANCELLED
        const updatedOrderRows = await tx.$executeRaw`
          UPDATE "Order"
          SET "status" = 'CANCELLED'
          WHERE "id" = ${order.id} AND "status" = 'PENDING_PAYMENT'
        `;

        // Nếu trả về 0 dòng nghĩa là Webhook đã vừa cập nhật PAID trước -> bỏ qua ngay!
        if (updatedOrderRows === 0) {
          return;
        }

        // Nếu hủy thành công, chuyển các lock sang EXPIRED và hoàn trả lại số lượng kho
        for (const lock of order.locks) {
          await tx.$executeRaw`
            UPDATE "InventoryLock"
            SET "status" = 'EXPIRED'
            WHERE "id" = ${lock.id} AND "status" = 'LOCKED'
          `;

          await tx.$executeRaw`
            UPDATE "ProductVariant"
            SET "stockQuantity" = "stockQuantity" + ${lock.quantity}
            WHERE "id" = ${lock.variantId}
          `;
        }

        console.log(
          `[Cron] Đã hủy đơn #${order.orderCode} do quá hạn 10 phút và hoàn lại kho thành công.`
        );
      });
    }
  }
}
