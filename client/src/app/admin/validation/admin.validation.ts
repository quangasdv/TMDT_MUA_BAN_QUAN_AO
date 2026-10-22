import { z } from "zod";

/**
 * Kiểu dữ liệu Thống kê Dashboard (GET /api/admin/stats)
 */
export interface DashboardStats {
  totalUsers: number;
  totalOrders: number;
  paidOrdersCount: number;
  totalRevenue: number;
  totalProducts: number;
}

export interface DashboardStatsResponse {
  success: boolean;
  data: {
    stats: DashboardStats;
  };
}

/**
 * Kiểu dữ liệu Đơn hàng Admin (GET /api/admin/orders)
 */
export interface AdminOrderUser {
  id: string;
  fullName: string;
  email: string;
}

export interface AdminOrderVariantProduct {
  id: string;
  name: string;
  slug: string;
  basePrice: number | string;
  images?: string[];
}

export interface AdminOrderVariant {
  id: string;
  sku: string;
  color: string;
  size: string;
  stockQuantity: number;
  priceAdjustment: number | string;
  imageUrl?: string;
  product?: AdminOrderVariantProduct;
}

export interface AdminOrderItem {
  id: string;
  orderId: string;
  variantId: string;
  quantity: number;
  unitPrice: number | string;
  variant?: AdminOrderVariant;
}

export interface AdminOrderPayment {
  id: string;
  orderId: string;
  amount: number | string;
  provider: string;
  status: string;
  transactionRef?: string;
  createdAt: string;
}

export interface AdminOrderVoucher {
  id: string;
  code: string;
  discountType: "PERCENT" | "FIXED";
  discountValue: number | string;
}

export interface AdminOrder {
  id: string;
  orderCode: number;
  userId: string;
  recipientName: string;
  recipientPhone: string;
  shippingAddress: string;
  voucherId?: string | null;
  totalAmount: number | string;
  discountAmount: number | string;
  finalAmount: number | string;
  status: string;
  paymentStatus: string;
  createdAt: string;
  user?: AdminOrderUser;
  items: AdminOrderItem[];
  payment?: AdminOrderPayment | null;
  voucher?: AdminOrderVoucher | null;
}

export interface AdminOrdersPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface AdminOrdersResponse {
  success: boolean;
  data: {
    orders: AdminOrder[];
    pagination: AdminOrdersPagination;
  };
}

export interface UpdateOrderStatusResponse {
  success: boolean;
  message: string;
  data?: {
    order: AdminOrder;
  };
}

/**
 * State machine chuẩn từ server/src/controllers/admin.controller.ts
 */
export const ALLOWED_STATUS_TRANSITIONS: Record<string, string[]> = {
  PENDING_PAYMENT: ["CANCELLED"],
  PAID: ["PROCESSING", "CANCELLED"],
  PROCESSING: ["SHIPPING", "CANCELLED"],
  SHIPPING: ["DELIVERED", "CANCELLED"],
  DELIVERED: [],
  CANCELLED: [],
  PAYMENT_EXPIRED_PENDING_REFUND: ["CANCELLED"],
};

export const ORDER_STATUS_LABELS: Record<string, { label: string; colorClass: string; bgClass: string }> = {
  PENDING_PAYMENT: {
    label: "Chờ thanh toán",
    colorClass: "text-amber-700 dark:text-amber-300",
    bgClass: "bg-amber-50 border-amber-200 dark:bg-amber-950/40 dark:border-amber-800",
  },
  PAID: {
    label: "Đã thanh toán",
    colorClass: "text-blue-700 dark:text-blue-300",
    bgClass: "bg-blue-50 border-blue-200 dark:bg-blue-950/40 dark:border-blue-800",
  },
  PROCESSING: {
    label: "Đang xử lý",
    colorClass: "text-indigo-700 dark:text-indigo-300",
    bgClass: "bg-indigo-50 border-indigo-200 dark:bg-indigo-950/40 dark:border-indigo-800",
  },
  SHIPPING: {
    label: "Đang giao hàng",
    colorClass: "text-purple-700 dark:text-purple-300",
    bgClass: "bg-purple-50 border-purple-200 dark:bg-purple-950/40 dark:border-purple-800",
  },
  DELIVERED: {
    label: "Giao thành công",
    colorClass: "text-emerald-700 dark:text-emerald-300",
    bgClass: "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800",
  },
  CANCELLED: {
    label: "Đã hủy đơn",
    colorClass: "text-rose-700 dark:text-rose-300",
    bgClass: "bg-rose-50 border-rose-200 dark:bg-rose-950/40 dark:border-rose-800",
  },
  PAYMENT_EXPIRED_PENDING_REFUND: {
    label: "Quá hạn (Chờ hoàn)",
    colorClass: "text-orange-700 dark:text-orange-300",
    bgClass: "bg-orange-50 border-orange-200 dark:bg-orange-950/40 dark:border-orange-800",
  },
};

export const PAYMENT_STATUS_LABELS: Record<string, { label: string; colorClass: string; bgClass: string }> = {
  UNPAID: {
    label: "Chưa thanh toán",
    colorClass: "text-slate-700 dark:text-slate-300",
    bgClass: "bg-slate-100 border-slate-200 dark:bg-slate-800 dark:border-slate-700",
  },
  PAID: {
    label: "Đã thanh toán",
    colorClass: "text-emerald-700 dark:text-emerald-300",
    bgClass: "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800",
  },
  REFUNDED: {
    label: "Đã hoàn tiền",
    colorClass: "text-cyan-700 dark:text-cyan-300",
    bgClass: "bg-cyan-50 border-cyan-200 dark:bg-cyan-950/40 dark:border-cyan-800",
  },
  PAID_EXPIRED: {
    label: "Thanh toán muộn",
    colorClass: "text-orange-700 dark:text-orange-300",
    bgClass: "bg-orange-50 border-orange-200 dark:bg-orange-950/40 dark:border-orange-800",
  },
};

/**
 * Kiểu dữ liệu Sản phẩm Admin (GET /api/admin/products)
 */
export interface AdminProductVariant {
  id?: string;
  sku: string;
  color: string;
  size: string;
  priceAdjustment: number | string;
  stockQuantity: number;
  imageUrl?: string;
}

export interface AdminProductSizeChart {
  id?: string;
  size: string;
  minHeightCm?: number;
  maxHeightCm?: number;
  minWeightKg?: number;
  maxWeightKg?: number;
  chestCm?: number;
  waistCm?: number;
}

export interface AdminProductCategory {
  id: string;
  name: string;
  slug: string;
}

export interface AdminProduct {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  basePrice: number | string;
  categoryId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  category?: AdminProductCategory;
  variants: AdminProductVariant[];
  sizeCharts?: AdminProductSizeChart[];
}

export interface AdminProductsResponse {
  success: boolean;
  data: {
    products: AdminProduct[];
  };
}

export interface CreateProductPayload {
  name: string;
  slug: string;
  description?: string;
  basePrice: number;
  categoryId: string;
  variants: {
    sku: string;
    color: string;
    size: string;
    priceAdjustment?: number;
    stockQuantity?: number;
    imageUrl?: string;
  }[];
  sizeCharts?: {
    size: string;
    minHeightCm?: number;
    maxHeightCm?: number;
    minWeightKg?: number;
    maxWeightKg?: number;
    chestCm?: number;
    waistCm?: number;
  }[];
}

export interface UpdateProductPayload {
  name?: string;
  description?: string;
  basePrice?: number;
  categoryId?: string;
  isActive?: boolean;
}

/**
 * Zod schemas cho tạo sản phẩm
 */
export const createProductVariantSchema = z.object({
  sku: z.string().trim().min(1, "SKU không được để trống"),
  color: z.string().trim().min(1, "Màu sắc không được để trống"),
  size: z.string().trim().min(1, "Size không được để trống"),
  priceAdjustment: z.coerce.number().default(0),
  stockQuantity: z.coerce.number().int().min(0, "Tồn kho không được âm"),
  imageUrl: z.string().trim().optional(),
});

export const createProductSizeChartSchema = z.object({
  size: z.string().trim().min(1, "Size không được để trống"),
  minHeightCm: z.coerce.number().min(0).optional(),
  maxHeightCm: z.coerce.number().min(0).optional(),
  minWeightKg: z.coerce.number().min(0).optional(),
  maxWeightKg: z.coerce.number().min(0).optional(),
  chestCm: z.coerce.number().min(0).optional(),
  waistCm: z.coerce.number().min(0).optional(),
});

export const createProductSchema = z.object({
  name: z.string().trim().min(2, "Tên sản phẩm tối thiểu 2 ký tự"),
  slug: z.string().trim().min(2, "Slug tối thiểu 2 ký tự"),
  description: z.string().trim().optional(),
  basePrice: z.coerce.number().min(0, "Giá gốc không được là số âm"),
  categoryId: z.string().min(1, "Vui lòng chọn danh mục"),
  variants: z.array(createProductVariantSchema).min(1, "Cần có ít nhất 1 biến thể"),
  sizeCharts: z.array(createProductSizeChartSchema).optional(),
});

export const updateProductSchema = z.object({
  name: z.string().trim().min(2, "Tên sản phẩm tối thiểu 2 ký tự").optional(),
  description: z.string().trim().optional(),
  basePrice: z.coerce.number().min(0, "Giá gốc không được âm").optional(),
  categoryId: z.string().min(1, "Vui lòng chọn danh mục").optional(),
  isActive: z.boolean().optional(),
});

/**
 * Kiểu dữ liệu Voucher Admin (GET /api/admin/vouchers)
 */
export interface AdminVoucher {
  id: string;
  code: string;
  discountType: "PERCENT" | "FIXED";
  discountValue: number | string;
  minOrderValue: number | string;
  usageLimit: number;
  usedCount: number;
  expiresAt: string;
  createdAt: string;
}

export interface AdminVouchersResponse {
  success: boolean;
  data: {
    vouchers: AdminVoucher[];
  };
}

export interface CreateVoucherPayload {
  code: string;
  discountType: "PERCENT" | "FIXED";
  discountValue: number;
  minOrderValue?: number;
  usageLimit?: number;
  expiresAt: string;
}

export const createVoucherSchema = z.object({
  code: z
    .string()
    .trim()
    .min(3, "Mã voucher tối thiểu 3 ký tự")
    .transform((val) => val.toUpperCase()),
  discountType: z.enum(["PERCENT", "FIXED"], {
    message: "Loại giảm giá phải là PERCENT hoặc FIXED",
  }),
  discountValue: z.coerce.number().positive("Mức giảm giá phải lớn hơn 0"),
  minOrderValue: z.coerce.number().min(0, "Giá trị đơn tối thiểu không được âm").default(0),
  usageLimit: z.coerce.number().int().positive("Lượt dùng tối đa phải là số nguyên dương").default(100),
  expiresAt: z.string().min(1, "Vui lòng chọn ngày hết hạn"),
}).refine(
  (data) => {
    if (data.discountType === "PERCENT" && data.discountValue > 100) {
      return false;
    }
    return true;
  },
  {
    message: "Giảm giá theo phần trăm không được vượt quá 100%",
    path: ["discountValue"],
  }
);
