import prisma from "../config/db";
import { Prisma } from "@prisma/client";

export interface LockItemRequest {
  variantId: string;
  quantity: number;
}

export class InventoryService {
  /**
   * Khóa giữ kho tạm thời 10 phút cho đơn hàng:
   * 1. Sắp xếp variantId tăng dần để chống Deadlock khi nhiều request đồng thời mua cùng danh sách món.
   * 2. Atomic conditional update: Chỉ trừ kho khi stockQuantity >= quantity yêu cầu.
   * 3. Tạo bản ghi InventoryLock thời hạn 10 phút.
   */
  static async lockInventory(
    orderId: string,
    items: LockItemRequest[],
    tx: Prisma.TransactionClient
  ): Promise<void> {
    // Sắp xếp variantId tăng dần chống deadlock
    const sortedItems = [...items].sort((a, b) => a.variantId.localeCompare(b.variantId));

    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 phút

    for (const item of sortedItems) {
      if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
        throw new Error(`Số lượng đặt mua cho sản phẩm (${item.variantId}) phải là số nguyên dương lớn hơn 0.`);
      }

      // Atomic Conditional Update qua $executeRaw để đảm bảo tính nguyên tử ở tầng cơ sở dữ liệu
      const updatedRows = await tx.$executeRaw`
        UPDATE "ProductVariant"
        SET "stockQuantity" = "stockQuantity" - ${item.quantity}
        WHERE "id" = ${item.variantId} AND "stockQuantity" >= ${item.quantity}
      `;

      if (updatedRows === 0) {
        throw new Error(
          `Sản phẩm biến thể (${item.variantId}) đã hết hàng hoặc không đủ số lượng tồn kho để đáp ứng.`
        );
      }

      // Tạo bản ghi InventoryLock
      await tx.inventoryLock.create({
        data: {
          orderId,
          variantId: item.variantId,
          quantity: item.quantity,
          expiresAt,
          status: "LOCKED",
        },
      });
    }
  }
}
