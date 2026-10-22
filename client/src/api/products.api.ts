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

// ==========================================
// 1. DÀNH CHO TÌM KIẾM THEO TỪ KHÓA (SEARCH)
// ==========================================
export interface SearchProductsParams {
  q?: string;
  page?: number | string;
  limit?: number | string;
}

export interface SearchProductsResponse {
  success: boolean;
  data: {
    keyword: string;
    products: Product[];
    pagination: Pagination;
  };
}

// ==========================================
// 2. DÀNH CHO BỘ LỌC TỔNG HỢP (FILTER)
// ==========================================
export interface FilterProductsParams {
  category?: string;
  categoryId?: string;
  minPrice?: number | string;
  maxPrice?: number | string;
  color?: string;
  size?: string;
  inStock?: boolean | string;
  sortBy?: "price_asc" | "price_desc" | "name_asc" | "newest";
  page?: number | string;
  limit?: number | string;
}

export interface FilterProductsResponse {
  success: boolean;
  data: {
    filtersApplied: {
      category: string | null;
      minPrice: number | null;
      maxPrice: number | null;
      color: string | null;
      size: string | null;
      inStock: boolean;
      sortBy: string;
    };
    products: Product[];
    pagination: Pagination;
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
 * Lấy danh sách sản phẩm chung (Hỗ trợ cả search & filter qua params)
 * GET /api/products
 */
export const getProductsApi = async (
  params?: GetProductsParams
): Promise<ProductsResponse> => {
  const queryParams: Record<string, string | number> = {};
  if (params) {
    if (params.q) queryParams.q = params.q;
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
 * Endpoint chuyên biệt cho Tìm kiếm sản phẩm theo từ khóa (Keyword Search)
 * GET /api/products/search (hoặc /api/search)
 */
export const searchProductsApi = async (
  params?: SearchProductsParams
): Promise<SearchProductsResponse> => {
  const response = await baseAPI.get<SearchProductsResponse>("/products/search", {
    params,
  });
  return response.data;
};

/**
 * Endpoint chuyên biệt cho Bộ lọc sản phẩm tổng hợp (Filter)
 * GET /api/products/filter (hoặc /api/filter)
 */
export const filterProductsApi = async (
  params?: FilterProductsParams
): Promise<FilterProductsResponse> => {
  const response = await baseAPI.get<FilterProductsResponse>("/products/filter", {
    params,
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
