import { z } from "zod";

/**
 * Interface cho biến thể sản phẩm (Variant)
 */
export interface ProductVariant {
  id: string;
  productId: string;
  sku: string;
  color: string;
  size: string;
  priceAdjustment: string | number;
  stockQuantity: number;
  imageUrl?: string;
}

/**
 * Interface cho bảng quy đổi kích thước (Size Chart)
 */
export interface SizeChartItem {
  id?: string;
  productId?: string;
  size: string;
  minHeightCm: number;
  maxHeightCm: number;
  minWeightKg: number;
  maxWeightKg: number;
  chestCm?: number | null;
  waistCm?: number | null;
}

/**
 * Interface cho danh mục của sản phẩm
 */
export interface ProductCategory {
  id?: string;
  name: string;
  slug?: string;
  parentId?: string | null;
}

/**
 * Interface cho dữ liệu chi tiết sản phẩm từ backend
 */
export interface ProductDetail {
  id: string;
  name: string;
  slug: string;
  description: string;
  basePrice: string | number;
  categoryId: string;
  isActive: boolean;
  category?: ProductCategory;
  variants: ProductVariant[];
  images?: string[];
  sizeCharts?: SizeChartItem[];
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Interface phản hồi từ API GET /api/products/:slug
 */
export interface ProductDetailResponse {
  success: boolean;
  data: {
    product: ProductDetail;
  };
  errorCode?: string;
  message?: string;
}

/**
 * Schema xác thực khi chọn biến thể và số lượng
 */
export const variantSelectionSchema = z.object({
  color: z.string().min(1, "Vui lòng chọn màu sắc"),
  size: z.string().min(1, "Vui lòng chọn kích cỡ"),
  quantity: z
    .number()
    .int("Số lượng phải là số nguyên")
    .min(1, "Số lượng tối thiểu là 1"),
});

export type VariantSelectionForm = z.infer<typeof variantSelectionSchema>;

/**
 * Schema cho công cụ tư vấn kích cỡ (Smart Fit Advisor)
 */
export const smartFitSchema = z.object({
  height: z.coerce
    .number()
    .min(100, "Chiều cao tối thiểu là 100 cm")
    .max(250, "Chiều cao tối đa là 250 cm"),
  weight: z.coerce
    .number()
    .min(30, "Cân nặng tối thiểu là 30 kg")
    .max(200, "Cân nặng tối đa là 200 kg"),
  chest: z.coerce
    .number()
    .min(50, "Vòng ngực không hợp lệ")
    .max(160, "Vòng ngực tối đa 160 cm")
    .optional()
    .or(z.literal("")),
  waist: z.coerce
    .number()
    .min(40, "Vòng eo không hợp lệ")
    .max(160, "Vòng eo tối đa 160 cm")
    .optional()
    .or(z.literal("")),
  hips: z.coerce
    .number()
    .min(50, "Vòng mông không hợp lệ")
    .max(180, "Vòng mông tối đa 180 cm")
    .optional()
    .or(z.literal("")),
  fitPreference: z.enum(["TIGHT", "REGULAR", "LOOSE"]).default("REGULAR"),
});

export type SmartFitForm = z.infer<typeof smartFitSchema>;

