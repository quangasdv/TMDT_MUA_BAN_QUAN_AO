import { baseAPI } from "@/api/axios.api";
import {
  OrdersListResponse,
  OrderDetailResponse,
} from "../validation/orders.validation";

/**
 * Gọi API GET /api/orders
 * Lấy danh sách lịch sử đơn hàng của người dùng hiện tại
 */
export async function getUserOrdersApi(): Promise<OrdersListResponse> {
  const response = await baseAPI.get<OrdersListResponse>("/orders");
  return response.data;
}

/**
 * Gọi API GET /api/orders/:code
 * Lấy chi tiết đơn hàng theo mã đơn 6 chữ số
 */
export async function getOrderByCodeApi(orderCode: number | string): Promise<OrderDetailResponse> {
  const response = await baseAPI.get<OrderDetailResponse>(`/orders/${orderCode}`);
  return response.data;
}

