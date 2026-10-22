import { z } from "zod";

/**
 * Thông tin sản phẩm gắn kèm biến thể trong giỏ hàng
 */
export interface CartProduct {
  id: string;
  name: string;
  slug: string;
  basePrice: string | number;
  description?: string;
  isActive: boolean;
  images?: string[];
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Thông tin biến thể sản phẩm trong giỏ hàng
 */
export interface CartVariant {
  id: string;
  productId: string;
  sku: string;
  color: string;
  size: string;
  priceAdjustment: string | number;
  stockQuantity: number;
  imageUrl?: string;
  product: CartProduct;
}

/**
 * Mỗi món hàng trong giỏ (CartItem)
 */
export interface CartItem {
  id: string;
  cartId: string;
  variantId: string;
  quantity: number;
  createdAt?: string;
  updatedAt?: string;
  variant: CartVariant;
}

/**
 * Đối tượng giỏ hàng hoàn chỉnh
 */
export interface Cart {
  id: string;
  userId?: string | null;
  sessionId?: string | null;
  items: CartItem[];
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Response của GET /api/cart, POST /api/cart/items, PATCH /api/cart/items/:id, DELETE /api/cart/items/:id
 */
export interface CartResponse {
  success: boolean;
  message?: string;
  data: {
    cart: Cart;
  };
  errorCode?: string;
}

/**
 * Payload thêm sản phẩm vào giỏ POST /api/cart/items
 */
export const addToCartSchema = z.object({
  variantId: z.string().min(1, "Mã biến thể không được để trống"),
  quantity: z
    .number()
    .int("Số lượng phải là số nguyên")
    .min(1, "Số lượng thêm vào giỏ phải tối thiểu là 1"),
});

export type AddToCartPayload = z.infer<typeof addToCartSchema>;

/**
 * Payload cập nhật số lượng PATCH /api/cart/items/:id
 */
export const updateCartItemSchema = z.object({
  quantity: z
    .number()
    .int("Số lượng phải là số nguyên")
    .min(0, "Số lượng không được âm"),
});

export type UpdateCartItemPayload = z.infer<typeof updateCartItemSchema>;

