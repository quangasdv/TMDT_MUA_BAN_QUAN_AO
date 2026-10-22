/**
 * Định nghĩa kiểu dữ liệu cho Quản lý Đơn hàng (Orders)
 * Phù hợp với Schema và API GET /api/orders & GET /api/orders/:code
 */

export type OrderStatus =
  | "PENDING_PAYMENT"
  | "PAID"
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED"
  | "PAYMENT_EXPIRED_PENDING_REFUND"
  | "EXPIRED_REFUND_PENDING";

export type PaymentStatus = "UNPAID" | "PAID" | "REFUNDED" | "PAID_EXPIRED";

export interface OrderProductVariant {
  id: string;
  productId: string;
  size: string;
  color: string;
  colorCode: string;
  sku: string;
  stockQuantity: number;
  priceAdjustment: number;
  imageUrl?: string;
  product?: {
    id: string;
    name: string;
    slug: string;
    basePrice: number;
    images?: string[];
    featuredImage?: string | null;
  };
}

export interface OrderItem {
  id: string;
  orderId: string;
  variantId: string;
  quantity: number;
  unitPrice: number;
  variant?: OrderProductVariant;
}

export interface PaymentTransaction {
  id?: string;
  orderId?: string;
  amount: number;
  provider: string;
  status: string;
  transactionRef?: string;
  createdAt?: string;
}

export interface OrderVoucher {
  id: string;
  code: string;
  discountType: "PERCENT" | "FIXED";
  discountValue: number;
}

export interface Order {
  id: string;
  orderCode: number;
  userId: string;
  recipientName: string;
  recipientPhone: string;
  shippingAddress: string;
  voucherId?: string | null;
  totalAmount: number;
  discountAmount: number;
  finalAmount: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
  locks?: Array<{
    id: string;
    status: string;
    lockedUntil: string;
  }>;
  payment?: PaymentTransaction | null;
  voucher?: OrderVoucher | null;
}

export interface OrdersListResponse {
  success: boolean;
  data: {
    orders: Order[];
  };
}

export interface OrderDetailResponse {
  success: boolean;
  data: {
    order: Order;
  };
}

/**
 * Trạng thái hiển thị và màu sắc trực quan tương ứng với OrderStatus
 */
export interface StatusDisplayMeta {
  label: string;
  variant: "default" | "secondary" | "destructive" | "outline";
  className: string;
}

export const ORDER_STATUS_MAP: Record<string, StatusDisplayMeta> = {
  PENDING_PAYMENT: {
    label: "Chờ thanh toán",
    variant: "outline",
    className: "border-amber-500/50 bg-amber-500/10 text-amber-700 dark:text-amber-300 font-bold",
  },
  PAID: {
    label: "Đã thanh toán",
    variant: "default",
    className: "bg-emerald-600 hover:bg-emerald-600 text-white font-bold",
  },
  PROCESSING: {
    label: "Đang xử lý",
    variant: "secondary",
    className: "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30 font-bold",
  },
  SHIPPED: {
    label: "Đang giao hàng",
    variant: "secondary",
    className: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/30 font-bold",
  },
  DELIVERED: {
    label: "Đã giao thành công",
    variant: "default",
    className: "bg-emerald-700 text-white font-bold",
  },
  CANCELLED: {
    label: "Đã hủy đơn",
    variant: "destructive",
    className: "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30 font-bold",
  },
  PAYMENT_EXPIRED_PENDING_REFUND: {
    label: "Quá hạn (Chờ hoàn tiền)",
    variant: "destructive",
    className: "bg-orange-500/10 text-orange-700 dark:text-orange-300 border-orange-500/30 font-bold",
  },
};

export const PAYMENT_STATUS_MAP: Record<string, StatusDisplayMeta> = {
  UNPAID: {
    label: "Chưa thanh toán",
    variant: "outline",
    className: "border-zinc-300 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-semibold",
  },
  PAID: {
    label: "Đã thanh toán",
    variant: "default",
    className: "bg-emerald-600 hover:bg-emerald-600 text-white font-semibold",
  },
  REFUNDED: {
    label: "Đã hoàn tiền",
    variant: "secondary",
    className: "bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30 font-semibold",
  },
  PAID_EXPIRED: {
    label: "Thanh toán quá hạn",
    variant: "destructive",
    className: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30 font-semibold",
  },
};


