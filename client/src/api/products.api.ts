import { baseAPI } from "./axios.api";

export interface Category {
  id: string;
  name: string;
  slug: string;
  parentId?: string | null;
  children?: Category[];
}

export interface ProductVariant {
  id: string;
  productId: string;
  sku: string;
  color: string;
  size: string;
  priceAdjustment: string | number;
  stockQuantity: number;
  imageUrl: string;
}

export interface SizeChart {
  id: string;
  productId: string;
  size: string;
  minHeightCm: number;
  maxHeightCm: number;
  minWeightKg: number;
  maxWeightKg: number;
  chestCm?: number | null;
  waistCm?: number | null;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  basePrice: string | number;
  categoryId: string;
  category: {
    id?: string;
    name: string;
    slug?: string;
  };
  variants: ProductVariant[];
  images?: string[];
  sizeCharts?: SizeChart[];
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface GetProductsParams {
  q?: string;
  category?: string;
  categoryId?: string;
  minPrice?: number | string;
  maxPrice?: number | string;
  color?: string;
  size?: string;
  page?: number | string;
  limit?: number | string;
}

export interface ProductsResponse {
  success: boolean;
  data: {
    products: Product[];
    pagination: Pagination;
  };
}

export interface ProductDetailResponse {
  success: boolean;
  data: {
    product: Product;
  };
}

export interface CategoriesResponse {
  success: boolean;
  data: {
    categories: Category[];
  };
}

/**
 * Lấy danh sách danh mục sản phẩm phân cấp
 * GET /api/categories
 */
export const getCategoriesApi = async (): Promise<CategoriesResponse> => {
  const response = await baseAPI.get<CategoriesResponse>("/categories");
  return response.data;
};

/**
 * Lấy danh sách sản phẩm có tìm kiếm, lọc và phân trang
 * GET /api/products
 */
export const getProductsApi = async (
  params?: GetProductsParams
): Promise<ProductsResponse> => {
  // Đồng bộ tham số category/categoryId
  const queryParams: Record<string, string | number> = {};
  if (params) {
    if (params.q) queryParams.q = params.q;
    // Backend ưu tiên 'category' (slug) nhưng chấp nhận cả 2
    if (params.category) queryParams.category = params.category;
    else if (params.categoryId) queryParams.category = params.categoryId;
    if (params.minPrice !== undefined && params.minPrice !== "")
      queryParams.minPrice = params.minPrice;
    if (params.maxPrice !== undefined && params.maxPrice !== "")
      queryParams.maxPrice = params.maxPrice;
    if (params.color) queryParams.color = params.color;
    if (params.size) queryParams.size = params.size;
    if (params.page) queryParams.page = params.page;
    if (params.limit) queryParams.limit = params.limit;
  }

  const response = await baseAPI.get<ProductsResponse>("/products", {
    params: queryParams,
  });
  return response.data;
};

/**
 * Lấy chi tiết sản phẩm theo Slug kèm biến thể và Size Chart
 * GET /api/products/:slug
 */
export const getProductBySlugApi = async (
  slug: string
): Promise<ProductDetailResponse> => {
  const response = await baseAPI.get<ProductDetailResponse>(
    `/products/${encodeURIComponent(slug)}`
  );
  return response.data;
};

