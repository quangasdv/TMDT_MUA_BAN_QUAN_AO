import { baseAPI } from "@/api/axios.api";
import {
  CheckoutLockPayload,
  CheckoutLockResponse,
  ApplyVoucherPayload,
  ApplyVoucherResponse,
} from "../validation/checkout.validation";

export interface ActiveVoucher {
  id: string;
  code: string;
  discountType: "PERCENT" | "FIXED";
  discountValue: number | string;
  minOrderValue: number | string;
  expiresAt: string;
}

export interface ActiveVouchersResponse {
  success: boolean;
  data: {
    vouchers: ActiveVoucher[];
  };
}

/**
 * Gọi API GET /api/vouchers/active
 * Lấy danh sách voucher đang hoạt động từ DB để gợi ý cho khách hàng
 */
export async function getActiveVouchersApi(): Promise<ActiveVouchersResponse> {
  const response = await baseAPI.get<ActiveVouchersResponse>("/vouchers/active");
  return response.data;
}

/**
 * Gọi API POST /api/vouchers/apply
 * Áp dụng mã giảm giá để tính toán giá trị chiết khấu hợp lệ
 */
export async function applyVoucherApi(payload: ApplyVoucherPayload): Promise<ApplyVoucherResponse> {
  const requestBody = {
    voucherCode: payload.voucherCode || payload.code || "",
    totalAmount: payload.totalAmount ?? payload.orderTotal ?? 0,
    code: payload.voucherCode || payload.code || "",
    orderTotal: payload.totalAmount ?? payload.orderTotal ?? 0,
  };
  const response = await baseAPI.post<ApplyVoucherResponse>("/vouchers/apply", requestBody);
  return response.data;
}

/**
 * Gọi API POST /api/checkout/lock
 * Khóa kho nguyên tử trong 10 phút và tạo đơn hàng
 */
export async function lockAndCheckoutApi(
  payload: CheckoutLockPayload
): Promise<CheckoutLockResponse> {
  const response = await baseAPI.post<CheckoutLockResponse>("/checkout/lock", payload);
  return response.data;
}
