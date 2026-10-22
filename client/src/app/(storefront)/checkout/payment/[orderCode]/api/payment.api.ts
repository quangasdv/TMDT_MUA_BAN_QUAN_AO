import { baseAPI } from "@/api/axios.api";
import { OrderDetailResponse } from "@/app/(storefront)/orders/validation/orders.validation";

export interface CreatePaymentResponse {
  success: boolean;
  message: string;
  data: {
    orderCode: number;
    amount: number;
    vietQrUrl: string;
    isMockMode: boolean;
  };
}

export interface MockSimulateResponse {
  success: boolean;
  message: string;
  data?: {
    success: boolean;
    message: string;
  };
}

/**
 * Gọi API POST /api/payments/create-qr
 * Tạo thông tin và liên kết ảnh VietQR chuẩn Napas
 */
export async function createPaymentQrApi(orderCode: number): Promise<CreatePaymentResponse> {
  const response = await baseAPI.post<CreatePaymentResponse>("/payments/create-qr", {
    orderCode,
  });
  return response.data;
}

/**
 * Gọi API POST /api/payments/mock-simulate
 * Giả lập thanh toán tức thời qua Mock Payment Engine (DEV/DEMO)
 */
export async function simulateMockPaymentApi(orderCode: number): Promise<MockSimulateResponse> {
  const response = await baseAPI.post<MockSimulateResponse>("/payments/mock-simulate", {
    orderCode,
  });
  return response.data;
}

/**
 * Lấy chi tiết đơn hàng phục vụ màn hình thanh toán
 */
export async function getPaymentOrderByCodeApi(orderCode: number | string): Promise<OrderDetailResponse> {
  const response = await baseAPI.get<OrderDetailResponse>(`/orders/${orderCode}`);
  return response.data;
}

