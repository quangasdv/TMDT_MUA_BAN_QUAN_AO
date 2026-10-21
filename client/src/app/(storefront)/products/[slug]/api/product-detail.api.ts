import { baseAPI } from "@/api/axios.api";
import { ProductDetailResponse } from "../validation/product-detail.validation";

/**
 * Lấy thông tin chi tiết một sản phẩm theo slug
 * GET /api/products/:slug
 */
export async function getProductDetailApi(slug: string): Promise<ProductDetailResponse> {
  const response = await baseAPI.get<ProductDetailResponse>(
    `/products/${encodeURIComponent(slug)}`
  );
  return response.data;
}

