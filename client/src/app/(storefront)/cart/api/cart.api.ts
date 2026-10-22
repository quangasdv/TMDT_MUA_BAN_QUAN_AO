import { baseAPI } from "@/api/axios.api";
import {
  CartResponse,
  AddToCartPayload,
  UpdateCartItemPayload,
} from "../validation/cart.validation";

/**
 * Lấy giỏ hàng hiện tại (hỗ trợ cả tài khoản đăng nhập qua Bearer token và khách vãng lai qua x-session-id)
 * GET /api/cart
 */
export async function getCartApi(): Promise<CartResponse> {
  const response = await baseAPI.get<CartResponse>("/cart");
  return response.data;
}

/**
 * Thêm sản phẩm biến thể vào giỏ hàng
 * POST /api/cart/items
 */
export async function addToCartApi(payload: AddToCartPayload): Promise<CartResponse> {
  const response = await baseAPI.post<CartResponse>("/cart/items", payload);
  return response.data;
}

/**
 * Cập nhật số lượng của một món trong giỏ hàng (nếu quantity = 0, backend tự xóa)
 * PATCH /api/cart/items/:id
 */
export async function updateCartItemQuantityApi(
  id: string,
  payload: UpdateCartItemPayload
): Promise<CartResponse> {
  const response = await baseAPI.patch<CartResponse>(`/cart/items/${id}`, payload);
  return response.data;
}

/**
 * Xóa hẳn một món khỏi giỏ hàng
 * DELETE /api/cart/items/:id
 */
export async function removeCartItemApi(id: string): Promise<CartResponse> {
  const response = await baseAPI.delete<CartResponse>(`/cart/items/${id}`);
  return response.data;
}

