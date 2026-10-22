import { baseAPI } from "@/api/axios.api";
import {
  CheckoutLockPayload,
  CheckoutLockResponse,
  ApplyVoucherPayload,
  ApplyVoucherResponse,
} from "../validation/checkout.validation";

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

