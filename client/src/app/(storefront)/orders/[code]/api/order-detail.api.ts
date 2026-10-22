import { baseAPI } from "@/api/axios.api";
import { OrderDetailResponse } from "@/app/(storefront)/orders/validation/orders.validation";

/**
 * Gọi API GET /api/orders/:code
 * Lấy chi tiết đơn hàng theo orderCode 6 chữ số
 */
export async function getOrderDetailApi(
  orderCode: number | string
): Promise<OrderDetailResponse> {
  const response = await baseAPI.get<OrderDetailResponse>(`/orders/${orderCode}`);
  return response.data;
}
