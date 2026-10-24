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
    colorClass: "text-amber-900",
    bgClass: "bg-amber-50 border-amber-300",
  },
  PAID: {
    label: "Chờ xử lý",
    colorClass: "text-emerald-900",
    bgClass: "bg-emerald-50 border-emerald-300",
  },
  PROCESSING: {
    label: "Đang xử lý",
    colorClass: "text-sky-900",
    bgClass: "bg-sky-50 border-sky-300",
  },
  SHIPPING: {
    label: "Đang giao hàng",
    colorClass: "text-purple-900",
    bgClass: "bg-purple-50 border-purple-300",
  },
  DELIVERED: {
    label: "Giao thành công",
    colorClass: "text-teal-900",
    bgClass: "bg-teal-50 border-teal-300",
  },
  CANCELLED: {
    label: "Đã hủy đơn",
    colorClass: "text-rose-900",
    bgClass: "bg-rose-50 border-rose-300",
  },
  PAYMENT_EXPIRED_PENDING_REFUND: {
    label: "Quá hạn (Chờ hoàn)",
    colorClass: "text-orange-900",
    bgClass: "bg-orange-50 border-orange-300",
  },
};

export const PAYMENT_STATUS_LABELS: Record<string, { label: string; colorClass: string; bgClass: string }> = {
  UNPAID: {
    label: "Chưa thanh toán",
    colorClass: "text-slate-800",
    bgClass: "bg-slate-100 border-slate-300",
  },
  PAID: {
    label: "Đã thanh toán",
    colorClass: "text-emerald-900",
    bgClass: "bg-emerald-50 border-emerald-300",
  },
  PENDING_REFUND: {
    label: "Chờ hoàn tiền",
    colorClass: "text-amber-900",
    bgClass: "bg-amber-50 border-amber-300",
  },
  REFUNDED: {
    label: "Đã hoàn tiền",
    colorClass: "text-cyan-900",
    bgClass: "bg-cyan-50 border-cyan-300",
  },
  PAID_EXPIRED: {
    label: "Thanh toán muộn",
    colorClass: "text-orange-900",
    bgClass: "bg-orange-50 border-orange-300",
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
  imageUrl?: string;
  images?: string[];
  variants?: {
    id?: string;
    sku?: string;
    color?: string;
    size?: string;
    priceAdjustment?: number;
    stockQuantity?: number;
    imageUrl?: string;
  }[];
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
  isActive?: boolean;
  createdAt?: string;
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

export interface UpdateVoucherPayload {
  code?: string;
  discountType?: "PERCENT" | "FIXED";
  discountValue?: number;
  minOrderValue?: number;
  usageLimit?: number;
  expiresAt?: string;
  isActive?: boolean;
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

export const updateVoucherSchema = z.object({
  code: z
    .string()
    .trim()
    .min(3, "Mã voucher tối thiểu 3 ký tự")
    .transform((val) => val.toUpperCase())
    .optional(),
  discountType: z.enum(["PERCENT", "FIXED"]).optional(),
  discountValue: z.coerce.number().positive("Mức giảm giá phải lớn hơn 0").optional(),
  minOrderValue: z.coerce.number().min(0, "Giá trị đơn tối thiểu không được âm").optional(),
  usageLimit: z.coerce.number().int().positive("Lượt dùng tối đa phải là số nguyên dương").optional(),
  expiresAt: z.string().optional(),
  isActive: z.boolean().optional(),
});

/**
 * 2.9.4 Kiểu dữ liệu Quản lý Tài khoản (GET /api/admin/users)
 */
export interface AdminUser {
  id: string;
  email: string;
  fullName: string;
  phone?: string | null;
  role: "CUSTOMER" | "STAFF" | "ADMIN";
  createdAt: string;
  _count?: {
    orders: number;
  };
}

export interface AdminUsersResponse {
  success: boolean;
  data: {
    users: AdminUser[];
    pagination: AdminOrdersPagination;
  };
}

export interface CreateUserPayload {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
  role?: "CUSTOMER" | "STAFF" | "ADMIN";
}

export interface UpdateUserPayload {
  fullName?: string;
  phone?: string | null;
  role?: "CUSTOMER" | "STAFF" | "ADMIN";
  password?: string;
}

export const createUserSchema = z.object({
  email: z.string().trim().email("Email không đúng định dạng"),
  password: z.string().min(6, "Mật khẩu tối thiểu 6 ký tự"),
  fullName: z.string().trim().min(2, "Họ và tên tối thiểu 2 ký tự"),
  phone: z
    .string()
    .trim()
    .regex(/^0[35789][0-9]{8}$/, "Số điện thoại phải có 10 chữ số và bắt đầu bằng 03, 05, 07, 08, 09")
    .optional()
    .or(z.literal("")),
  role: z.enum(["CUSTOMER", "STAFF", "ADMIN"]).default("STAFF"),
});

export const updateUserSchema = z.object({
  fullName: z.string().trim().min(2, "Họ và tên tối thiểu 2 ký tự").optional(),
  phone: z
    .string()
    .trim()
    .regex(/^0[35789][0-9]{8}$/, "Số điện thoại phải có 10 chữ số và bắt đầu bằng 03, 05, 07, 08, 09")
    .optional()
    .or(z.literal("")),
  role: z.enum(["CUSTOMER", "STAFF", "ADMIN"]).optional(),
  password: z.string().min(6, "Mật khẩu mới tối thiểu 6 ký tự").optional().or(z.literal("")),
});

export const USER_ROLE_LABELS: Record<
  string,
  { label: string; colorClass: string; bgClass: string }
> = {
  ADMIN: {
    label: "Quản trị viên",
    colorClass: "text-purple-900",
    bgClass: "bg-purple-50 border-purple-300",
  },
  STAFF: {
    label: "Nhân viên",
    colorClass: "text-blue-900",
    bgClass: "bg-blue-50 border-blue-300",
  },
  CUSTOMER: {
    label: "Khách hàng",
    colorClass: "text-slate-800",
    bgClass: "bg-slate-100 border-slate-300",
  },
};

/**
 * 2.9.5 Kiểu dữ liệu Quản lý Combo Thời trang / Outfits (GET /api/admin/outfits)
 */
export interface AdminOutfitItem {
  id: string;
  slotType: "TOP" | "BOTTOM" | "OUTERWEAR" | "SHOES" | "ACCESSORY" | string;
  variantId: string;
  productId: string;
  productName: string;
  sku: string;
  color: string;
  size: string;
  imageUrl?: string;
  price: number;
}

export interface AdminOutfit {
  id: string;
  title: string;
  description?: string | null;
  bannerUrl?: string | null;
  discountRate: number;
  discountPercent: number;
  isActive: boolean;
  originalPrice: number;
  comboPrice: number;
  savedAmount: number;
  clothingOriginalPrice: number;
  totalOriginalPrice: number;
  items: AdminOutfitItem[];
}

export interface AdminOutfitsResponse {
  success: boolean;
  data: {
    outfits: AdminOutfit[];
  };
}

export interface CreateOutfitPayload {
  title: string;
  description?: string;
  bannerUrl?: string;
  discountRate: number;
  isActive?: boolean;
  items: Array<{
    variantId: string;
    slotType: string;
  }>;
}

export interface UpdateOutfitPayload {
  title?: string;
  description?: string;
  bannerUrl?: string;
  discountRate?: number;
  isActive?: boolean;
  items?: Array<{
    variantId: string;
    slotType: string;
  }>;
}

export const OUTFIT_SLOT_LABELS: Record<
  string,
  { label: string; badgeClass: string }
> = {
  TOP: {
    label: "Áo (Top)",
    badgeClass: "bg-sky-50 text-sky-800 border-sky-300",
  },
  BOTTOM: {
    label: "Quần (Bottom)",
    badgeClass: "bg-indigo-50 text-indigo-800 border-indigo-300",
  },
  OUTERWEAR: {
    label: "Áo khoác (Outerwear)",
    badgeClass: "bg-amber-50 text-amber-800 border-amber-300",
  },
  SHOES: {
    label: "Giày dép (Shoes)",
    badgeClass: "bg-emerald-50 text-emerald-800 border-emerald-300",
  },
  ACCESSORY: {
    label: "Phụ kiện (Accessory)",
    badgeClass: "bg-purple-50 text-purple-800 border-purple-300",
  },
};
