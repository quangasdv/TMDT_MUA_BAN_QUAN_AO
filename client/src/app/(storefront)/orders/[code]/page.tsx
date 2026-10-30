"use client";

import React, { use } from "react";
import Link from "next/link";
import { useOrderDetail } from "./hooks/use-order-detail";
import { ORDER_STATUS_MAP, PAYMENT_STATUS_MAP, OrderItem } from "../validation/orders.validation";
import { formatPrice } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  ShoppingBag,
  QrCode,
  AlertCircle,
  RefreshCw,
  CreditCard,
  MapPin,
  User,
  Phone,
  ShieldCheck,
  RotateCcw,
  Truck,
  PackageOpen,
  Tag,
} from "lucide-react";
import "./style/order-detail.css";

interface OrderDetailPageProps {
  params: Promise<{
    code: string;
  }>;
}

export default function OrderDetailPage({ params }: OrderDetailPageProps) {
  const resolvedParams = use(params);
  const orderCode = resolvedParams.code;

  const {
    order,
    isLoading,
    isError,
    refetch,
    isAuthenticated,
    isInitialized,
  } = useOrderDetail(orderCode);

  // 1. Loading Skeleton
  if (!isInitialized || isLoading) {
    return (
      <div className="order-detail-container mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
        <div className="space-y-4 mb-8">
          <Skeleton className="h-4 w-40 rounded" />
          <Skeleton className="h-8 w-64 rounded" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-8 space-y-6">
            <Skeleton className="h-48 w-full rounded-2xl" />
            <Skeleton className="h-64 w-full rounded-2xl" />
          </div>
          <div className="lg:col-span-4">
            <Skeleton className="h-80 w-full rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  // 2. Chưa đăng nhập
  if (!isAuthenticated) {
    return (
      <div className="order-detail-container mx-auto max-w-md px-4 py-24 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/10 text-amber-600 mb-4">
          <ShoppingBag size={32} />
        </div>
        <h1 className="text-xl font-bold text-foreground">Yêu cầu đăng nhập</h1>
        <p className="text-sm text-muted-foreground mt-2 mb-6">
          Vui lòng đăng nhập tài khoản để xem chi tiết và theo dõi đơn hàng này.
        </p>
        <Link
          href={`/login?returnUrl=${encodeURIComponent(`/orders/${orderCode}`)}`}
          className={cn(buttonVariants(), "w-full gap-2")}
        >
          Đăng nhập ngay
          <ArrowLeft size={16} className="rotate-180" />
        </Link>
      </div>
    );
  }

  // 3. Đơn hàng không tồn tại hoặc lỗi (404/403)
  if (isError || !order) {
    return (
      <div className="order-detail-container mx-auto max-w-md px-4 py-24 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 text-destructive mb-4">
          <AlertCircle size={32} />
        </div>
        <h1 className="text-xl font-bold text-foreground">Không tìm thấy đơn hàng</h1>
        <p className="text-sm text-muted-foreground mt-2 mb-6">
          Đơn hàng #{orderCode} không tồn tại trong hệ thống hoặc bạn không có quyền xem thông tin đơn hàng này.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button variant="outline" onClick={() => refetch()} className="gap-2">
            <RefreshCw size={14} />
            Thử lại
          </Button>
          <Link href="/orders" className={cn(buttonVariants(), "gap-2")}>
            <ArrowLeft size={14} />
            Quay lại danh sách
          </Link>
        </div>
      </div>
    );
  }

  const statusMeta = ORDER_STATUS_MAP[order.status] || {
    label: order.status,
    variant: "outline" as const,
    className: "",
  };

  const paymentMeta = PAYMENT_STATUS_MAP[order.paymentStatus] || {
    label: order.paymentStatus,
    variant: "outline" as const,
    className: "border-zinc-300 text-zinc-600",
  };

  const isCod = Boolean(
    (order.payment?.provider === "COD" || (order as any).paymentTransactions?.some((t: any) => t.provider === "COD")) ||
    (order.status === "PROCESSING" && order.paymentStatus === "UNPAID")
  );
  const isPending = order.status === "PENDING_PAYMENT" && !isCod;
  const dateFormatted = new Date(order.createdAt).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="order-detail-container mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Breadcrumb & Navigation */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          <Link href="/orders" className="hover:text-primary transition-colors flex items-center gap-1">
            <ArrowLeft size={13} />
            Danh sách đơn hàng
          </Link>
          <span>/</span>
          <span className="text-foreground">Đơn hàng #{order.orderCode}</span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
                Đơn hàng #{order.orderCode}
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              Đặt lúc: <strong className="text-foreground">{dateFormatted}</strong>
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Badge className={cn("text-xs px-3 py-1 font-bold", statusMeta.className)}>
              {statusMeta.label}
            </Badge>
            <Badge className={cn("text-xs px-3 py-1 font-semibold", paymentMeta.className)}>
              {paymentMeta.label}
            </Badge>
          </div>
        </div>
      </div>

      {/* Banner thông báo nếu đơn hàng đang PENDING_PAYMENT */}
      {isPending && (
        <div className="mb-8 p-5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/5 border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-700 dark:text-amber-300 shrink-0 mt-0.5">
              <QrCode size={20} />
            </div>
            <div>
              <p className="font-bold text-sm text-foreground">
                Đơn hàng đang chờ thanh toán qua VietQR
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Vui lòng hoàn tất chuyển khoản để hệ thống xác nhận và xử lý đóng gói vận chuyển.
              </p>
            </div>
          </div>
          <Link
            href={`/checkout/payment/${order.orderCode}`}
            className={cn(
              buttonVariants({ size: "default" }),
              "gap-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-bold rounded-xl shadow-md shrink-0 cursor-pointer"
            )}
          >
            <QrCode size={16} />
            Tiếp tục thanh toán VietQR
          </Link>
        </div>
      )}

      {/* Banner thông báo đơn hàng COD */}
      {isCod && (
        <div className="mb-8 p-5 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-emerald-500/5 border border-emerald-500/30 flex items-start gap-3.5 shadow-sm">
          <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 shrink-0 mt-0.5">
            <Truck size={22} />
          </div>
          <div>
            <p className="font-bold text-sm text-foreground flex items-center gap-2">
              <span>Đơn hàng Thanh toán khi nhận hàng (COD)</span>
              <Badge variant="outline" className="text-[10px] bg-emerald-100 text-emerald-800 border-emerald-300 font-bold">
                Đã xác nhận
              </Badge>
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Đơn hàng của quý khách đã được ghi nhận thành công và đang được chuẩn bị đóng gói. Quý khách vui lòng chuẩn bị số tiền <strong>{formatPrice(order.finalAmount)}</strong> tiền mặt khi shipper giao tới.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* CỘT TRÁI (8 CỘT): CHI TIẾT SẢN PHẨM & ĐỊA CHỈ NHẬN HÀNG */}
        <div className="lg:col-span-8 space-y-6">
          {/* 1. THÔNG TIN GIAO NHẬN */}
          <div className="p-6 rounded-2xl border border-border bg-card shadow-sm space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-foreground flex items-center gap-2 pb-3 border-b border-border">
              <MapPin size={16} className="text-primary" />
              Thông tin nhận hàng
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="flex items-start gap-2.5 text-muted-foreground">
                <User size={15} className="text-foreground shrink-0 mt-0.5" />
                <div>
                  <span className="block text-[11px] text-muted-foreground">Người nhận:</span>
                  <strong className="text-foreground text-sm">{order.recipientName}</strong>
                </div>
              </div>

              <div className="flex items-start gap-2.5 text-muted-foreground">
                <Phone size={15} className="text-foreground shrink-0 mt-0.5" />
                <div>
                  <span className="block text-[11px] text-muted-foreground">Số điện thoại:</span>
                  <strong className="text-foreground text-sm">{order.recipientPhone}</strong>
                </div>
              </div>

              <div className="sm:col-span-2 flex items-start gap-2.5 text-muted-foreground pt-2 border-t border-border/70">
                <MapPin size={15} className="text-foreground shrink-0 mt-0.5" />
                <div>
                  <span className="block text-[11px] text-muted-foreground">Địa chỉ nhận hàng:</span>
                  <span className="text-foreground text-xs leading-relaxed">{order.shippingAddress}</span>
                </div>
              </div>
            </div>
          </div>

          {/* 2. DANH SÁCH SẢN PHẨM */}
          <div className="p-6 rounded-2xl border border-border bg-card shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h2 className="text-sm font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
                <ShoppingBag size={16} className="text-primary" />
                Sản phẩm trong đơn ({order.items.length})
              </h2>
            </div>

            <div className="divide-y divide-border/60">
              {order.items.map((item: OrderItem) => {
                const product = item.variant?.product;
                const imageUrl =
                  item.variant?.imageUrl ||
                  (product?.images && product.images.length > 0 ? product.images[0] : "");
                const itemTotal = Number(item.unitPrice) * item.quantity;

                return (
                  <div key={item.id} className="py-4 first:pt-0 last:pb-0 flex gap-4 items-center">
                    {/* Thumbnail Image */}
                    <div className="relative h-16 w-14 rounded-xl overflow-hidden bg-muted border border-border/80 shrink-0 flex items-center justify-center">
                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt={product?.name || "Sản phẩm thời trang"}
                          className="h-full w-full object-cover object-center"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = "none";
                          }}
                        />
                      ) : (
                        <PackageOpen size={20} className="text-muted-foreground/60" />
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0 space-y-1">
                      {product?.slug ? (
                        <Link
                          href={`/products/${product.slug}`}
                          className="text-xs sm:text-sm font-bold text-foreground hover:text-primary transition-colors line-clamp-1"
                        >
                          {product.name}
                        </Link>
                      ) : (
                        <p className="text-xs sm:text-sm font-bold text-foreground line-clamp-1">
                          {product?.name || "Sản phẩm thời trang"}
                        </p>
                      )}

                      <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                        <span>
                          Phân loại: <strong className="text-foreground">{item.variant?.color}</strong> /{" "}
                          <strong className="text-foreground">{item.variant?.size}</strong>
                        </span>
                        {item.variant?.sku && (
                          <>
                            <span>•</span>
                            <span className="font-mono text-[10px]">{item.variant.sku}</span>
                          </>
                        )}
                      </div>

                      <div className="text-xs text-muted-foreground">
                        {formatPrice(Number(item.unitPrice))} × {item.quantity}
                      </div>
                    </div>

                    {/* Total for this line */}
                    <div className="text-right shrink-0">
                      <span className="text-sm font-bold text-foreground">
                        {formatPrice(itemTotal)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 3. LỊCH SỬ GIAO DỊCH THANH TOÁN (NẾU CÓ) */}
          {order.payment && (
            <div className="p-6 rounded-2xl border border-border bg-card shadow-sm space-y-4">
              <h2 className="text-sm font-bold uppercase tracking-wider text-foreground flex items-center gap-2 pb-3 border-b border-border">
                <CreditCard size={16} className="text-primary" />
                Thông tin giao dịch thanh toán
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-muted-foreground block text-[11px]">Cổng thanh toán:</span>
                  <span className="font-bold text-foreground">
                    {order.payment.provider || "PayOS (VietQR Napas)"}
                  </span>
                </div>

                {order.payment.transactionRef && (
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Mã tham chiếu:</span>
                    <span className="font-mono font-bold text-foreground">
                      {order.payment.transactionRef}
                    </span>
                  </div>
                )}

                <div>
                  <span className="text-muted-foreground block text-[11px]">Số tiền giao dịch:</span>
                  <span className="font-black text-emerald-600 dark:text-emerald-400 text-sm">
                    {formatPrice(order.payment.amount)}
                  </span>
                </div>

                <div>
                  <span className="text-muted-foreground block text-[11px]">Trạng thái:</span>
                  <Badge variant="default" className="bg-emerald-600 text-white font-bold text-[10px] mt-0.5">
                    {order.payment.status}
                  </Badge>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* CỘT PHẢI (4 CỘT): TÓM TẮT ĐƠN HÀNG */}
        <div className="lg:col-span-4">
          <div className="order-summary-sticky p-6 rounded-2xl border border-border bg-card shadow-sm space-y-5">
            <h2 className="text-sm font-bold uppercase tracking-wider text-foreground pb-3 border-b border-border">
              Tổng quan thanh toán
            </h2>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between text-muted-foreground">
                <span>Tạm tính</span>
                <span className="font-bold text-foreground">{formatPrice(order.totalAmount)}</span>
              </div>

              {Number(order.discountAmount) > 0 && (
                <div className="flex justify-between text-emerald-600 font-semibold">
                  <span className="flex items-center gap-1">
                    <Tag size={12} />
                    Mã giảm giá {order.voucher?.code && `(${order.voucher.code})`}
                  </span>
                  <span>-{formatPrice(order.discountAmount)}</span>
                </div>
              )}

              <div className="flex justify-between text-muted-foreground items-center">
                <span>Phí vận chuyển</span>
                <span className="font-bold text-foreground">
                  {Math.max(0, Number(order.finalAmount) - (Number(order.totalAmount) - Number(order.discountAmount))) === 0 ? (
                    <span className="text-emerald-600 font-bold">Miễn phí</span>
                  ) : (
                    formatPrice(Math.max(0, Number(order.finalAmount) - (Number(order.totalAmount) - Number(order.discountAmount))))
                  )}
                </span>
              </div>
            </div>

            <div className="pt-3 border-t border-border flex justify-between items-baseline">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                  Tổng thanh toán
                </span>
                <span className="text-[10px] text-muted-foreground">Đã bao gồm thuế GTGT</span>
              </div>
              <span className="text-2xl font-black text-primary">
                {formatPrice(order.finalAmount)}
              </span>
            </div>

            {/* Nếu đang chờ thanh toán: Nút thanh toán nổi bật */}
            {isPending && (
              <Link
                href={`/checkout/payment/${order.orderCode}`}
                className={cn(
                  buttonVariants({ size: "lg" }),
                  "w-full h-11 text-xs font-bold gap-2 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white shadow-md cursor-pointer"
                )}
              >
                <QrCode size={16} />
                Thanh toán ngay qua VietQR
              </Link>
            )}

            {/* Back button */}
            <Link
              href="/orders"
              className={cn(buttonVariants({ variant: "outline", size: "sm" }), "w-full gap-2 rounded-xl text-xs font-semibold cursor-pointer")}
            >
              <ArrowLeft size={14} />
              Quay lại danh sách đơn hàng
            </Link>

            {/* Trust Perks */}
            <div className="pt-4 border-t border-border/70 space-y-2 text-[11px] text-muted-foreground">
              <div className="flex items-center gap-2">
                <ShieldCheck size={13} className="text-emerald-600 shrink-0" />
                <span>Bảo mật dữ liệu chuẩn mã hóa</span>
              </div>
              <div className="flex items-center gap-2">
                <RotateCcw size={13} className="text-foreground shrink-0" />
                <span>Đổi trả miễn phí trong 7 ngày</span>
              </div>
              <div className="flex items-center gap-2">
                <Truck size={13} className="text-foreground shrink-0" />
                <span>Giao hàng toàn quốc 2-4 ngày</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
