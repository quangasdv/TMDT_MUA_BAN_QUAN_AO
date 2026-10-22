import { z } from "zod";

/**
 * Validation schema cho form thông tin đặt hàng tại /checkout
 * Phù hợp với Zod schema trong server checkout.controller.ts:
 * - recipientName: min 2 ký tự
 * - recipientPhone: min 8 ký tự
 * - shippingAddress: min 5 ký tự
 */
export const checkoutFormSchema = z.object({
  recipientName: z
    .string()
    .trim()
    .min(2, "Họ và tên người nhận phải có ít nhất 2 ký tự")
    .max(100, "Họ và tên không được vượt quá 100 ký tự"),
  recipientPhone: z
    .string()
    .trim()
    .min(8, "Số điện thoại người nhận không hợp lệ (tối thiểu 8 chữ số)")
    .max(15, "Số điện thoại không hợp lệ")
    .regex(/^[0-9+() -]+$/, "Số điện thoại chỉ được chứa chữ số và ký tự hợp lệ"),
  shippingAddress: z
    .string()
    .trim()
    .min(5, "Địa chỉ nhận hàng chi tiết phải có ít nhất 5 ký tự")
    .max(255, "Địa chỉ không được vượt quá 255 ký tự"),
  orderNote: z
    .string()
    .max(500, "Ghi chú không được vượt quá 500 ký tự")
    .optional(),
  voucherCode: z.string().trim().optional(),
});

export type CheckoutFormValues = z.infer<typeof checkoutFormSchema>;

/**
 * Payload gửi lên endpoint POST /api/checkout/lock
 */
export interface CheckoutItemPayload {
  variantId: string;
  quantity: number;
}

export interface CheckoutLockPayload {
  recipientName: string;
  recipientPhone: string;
  shippingAddress: string;
  voucherCode?: string;
  items: CheckoutItemPayload[];
}

/**
 * Response từ endpoint POST /api/checkout/lock
 */
export interface CheckoutLockOrder {
  id: string;
  orderCode: number;
  userId: string;
  recipientName: string;
  recipientPhone: string;
  shippingAddress: string;
  voucherId?: string | null;
  totalAmount: number;
  discountAmount: number;
  finalAmount: number;
  status: string;
  paymentStatus: string;
  createdAt: string;
  updatedAt: string;
}

export interface CheckoutLockResponse {
  success: boolean;
  message: string;
  data: {
    order: CheckoutLockOrder;
    lockDurationSeconds: number;
  };
}

/**
 * Payload & Response cho POST /api/vouchers/apply
 */
export interface ApplyVoucherPayload {
  voucherCode: string;
  totalAmount: number;
  // Trường tương thích ngược
  code?: string;
  orderTotal?: number;
}

export interface ApplyVoucherData {
  voucherId: string;
  code: string;
  discountAmount: number;
  finalAmount: number;
}

export interface ApplyVoucherResponse {
  success: boolean;
  message: string;
  data: ApplyVoucherData;
}

