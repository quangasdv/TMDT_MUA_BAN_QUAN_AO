"use client";

import React from "react";
import Link from "next/link";
import { useOrders, OrderFilterTab } from "./hooks/use-orders";
import { ORDER_STATUS_MAP, PAYMENT_STATUS_MAP } from "./validation/orders.validation";
import { formatPrice } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  ShoppingBag,
  Search,
  ArrowRight,
  RefreshCw,
  QrCode,
  PackageOpen,
  AlertCircle,
} from "lucide-react";
import "./style/orders.css";

const TABS: Array<{ key: OrderFilterTab; label: string }> = [
  { key: "ALL", label: "Tất cả" },
  { key: "PENDING_PAYMENT", label: "Chờ thanh toán" },
  { key: "PAID", label: "Đã thanh toán" },
  { key: "PROCESSING", label: "Đang xử lý" },
  { key: "SHIPPED", label: "Đang giao" },
  { key: "DELIVERED", label: "Hoàn tất" },
  { key: "CANCELLED", label: "Đã hủy" },
];

export default function OrdersPage() {
  const {
    orders,
    rawOrdersCount,
    counts,
    activeTab,
    setActiveTab,
    searchQuery,
    setSearchQuery,
    isLoading,
    isError,
    refetch,
    isAuthenticated,
    isInitialized,
  } = useOrders();

  // 1. Loading Skeleton khi khởi tạo hoặc tải danh sách
  if (!isInitialized || (isLoading && rawOrdersCount === 0)) {
    return (
      <div className="orders-page-container mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
        <div className="space-y-4 mb-8">
          <Skeleton className="h-8 w-56 rounded" />
          <Skeleton className="h-4 w-72 rounded" />
          <div className="flex gap-2 pt-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-9 w-24 rounded-xl" />
            ))}
          </div>
        </div>
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-44 w-full rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  // 2. Chưa đăng nhập
  if (!isAuthenticated) {
    return (
      <div className="orders-page-container mx-auto max-w-md px-4 py-24 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/10 text-amber-600 mb-4">
          <ShoppingBag size={32} />
        </div>
        <h1 className="text-xl font-bold text-foreground">Đăng nhập để xem đơn hàng</h1>
        <p className="text-sm text-muted-foreground mt-2 mb-6">
          Vui lòng đăng nhập tài khoản TrendyFit để kiểm tra trạng thái và lịch sử các đơn hàng đã đặt.
        </p>
        <Link
          href={`/login?returnUrl=${encodeURIComponent("/orders")}`}
          className={cn(buttonVariants(), "w-full gap-2")}
        >
          Đăng nhập ngay
          <ArrowRight size={16} />
        </Link>
      </div>
    );
  }

  // 3. Lỗi tải dữ liệu
  if (isError) {
    return (
      <div className="orders-page-container mx-auto max-w-md px-4 py-24 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 text-destructive mb-4">
          <AlertCircle size={32} />
        </div>
        <h1 className="text-xl font-bold text-foreground">Không thể tải danh sách đơn hàng</h1>
        <p className="text-sm text-muted-foreground mt-2 mb-6">
          Đã có lỗi xảy ra trong quá trình kết nối với máy chủ. Vui lòng thử lại.
        </p>
        <Button onClick={() => refetch()} className="gap-2">
          <RefreshCw size={14} />
          Thử lại
        </Button>
      </div>
    );
  }

  return (
    <div className="orders-page-container mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Tiêu đề & Giới thiệu */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
          Đơn hàng của tôi
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
          Theo dõi hành trình xử lý, thanh toán và lịch sử giao nhận của tất cả các đơn hàng.
        </p>
      </div>

      {/* Bộ lọc Tab & Ô tìm kiếm */}
      <div className="space-y-4 mb-8">
        {/* Status Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-border text-xs font-semibold no-scrollbar">
          {TABS.map((tab) => {
            const count = counts[tab.key] || 0;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  "px-3.5 py-2 rounded-xl whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5",
                  isActive
                    ? "bg-primary text-primary-foreground font-bold shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                <span>{tab.label}</span>
                {count > 0 && (
                  <span
                    className={cn(
                      "px-1.5 py-0.2 rounded-full text-[10px]",
                      isActive
                        ? "bg-primary-foreground/20 text-primary-foreground"
                        : "bg-muted-foreground/15 text-muted-foreground font-bold"
                    )}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Search bar */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo mã đơn hoặc sản phẩm..."
            className="pl-9 h-10 rounded-xl text-xs"
          />
        </div>
      </div>

      {/* Danh sách đơn hàng */}
      {orders.length === 0 ? (
        <div className="p-12 sm:p-16 rounded-3xl border border-dashed border-border text-center space-y-4 bg-card/40">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <PackageOpen size={32} />
          </div>
          <div>
            <h3 className="text-base font-bold text-foreground">
              {rawOrdersCount === 0
                ? "Bạn chưa có đơn hàng nào"
                : "Không tìm thấy đơn hàng phù hợp"}
            </h3>
            <p className="text-xs text-muted-foreground max-w-xs mx-auto mt-1">
              {rawOrdersCount === 0
                ? "Khám phá ngay hàng trăm thiết kế thời trang trendy mới nhất tại cửa hàng!"
                : "Thử thay đổi tab bộ lọc hoặc từ khóa tìm kiếm để xem các đơn hàng khác."}
            </p>
          </div>
          {rawOrdersCount === 0 && (
            <Link href="/products" className={cn(buttonVariants({ size: "sm" }), "gap-1.5 rounded-xl")}>
              <ShoppingBag size={14} />
              Bắt đầu mua sắm
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
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
            const isPending = order.status === "PENDING_PAYMENT";
            const dateFormatted = new Date(order.createdAt).toLocaleDateString("vi-VN", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            });

            return (
              <div
                key={order.id}
                className="order-card p-5 sm:p-6 rounded-2xl border border-border bg-card shadow-sm space-y-4"
              >
                {/* Header đơn hàng: Mã đơn, Thời gian, Badge trạng thái đơn & thanh toán */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-border">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xs font-mono font-bold text-muted-foreground">
                      Mã đơn:
                    </span>
                    <span className="text-sm font-black text-foreground">
                      #{order.orderCode}
                    </span>
                    <span className="text-muted-foreground">•</span>
                    <span className="text-xs text-muted-foreground">{dateFormatted}</span>
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    <Badge className={cn("text-xs px-2.5 py-0.5", statusMeta.className)}>
                      {statusMeta.label}
                    </Badge>
                    <Badge className={cn("text-xs px-2.5 py-0.5", paymentMeta.className)}>
                      {paymentMeta.label}
                    </Badge>
                  </div>
                </div>

                {/* Danh sách sản phẩm trong đơn */}
                <div className="space-y-3">
                  {order.items.map((item) => {
                    const product = item.variant?.product;
                    const imageUrl =
                      item.variant?.imageUrl ||
                      (product?.images && product.images.length > 0 ? product.images[0] : "");

                    return (
                      <div key={item.id} className="flex gap-3 items-center">
                        <div className="relative h-14 w-12 rounded-lg overflow-hidden bg-muted border border-border/80 shrink-0 flex items-center justify-center">
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
                            <PackageOpen size={18} className="text-muted-foreground/60" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-foreground truncate">
                            {product?.name || "Sản phẩm thời trang"}
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            Phân loại: {item.variant?.color} / {item.variant?.size} • SL:{" "}
                            {item.quantity}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-xs font-bold text-foreground">
                            {formatPrice(Number(item.unitPrice) * item.quantity)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Footer đơn hàng: Tổng tiền & CTA Action */}
                <div className="pt-3 border-t border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="text-xs">
                    <span className="text-muted-foreground mr-2">Tổng thanh toán:</span>
                    <span className="text-base font-black text-primary">
                      {formatPrice(order.finalAmount)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    {/* Nếu đang PENDING_PAYMENT: Nút tiếp tục quét mã thanh toán */}
                    {isPending && (
                      <Link
                        href={`/checkout/payment/${order.orderCode}`}
                        className={cn(
                          buttonVariants({ size: "sm" }),
                          "w-full sm:w-auto gap-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-bold rounded-xl"
                        )}
                      >
                        <QrCode size={14} />
                        Tiếp tục thanh toán VietQR
                      </Link>
                    )}

                    {/* Nút xem chi tiết đơn */}
                    <Link
                      href={`/orders/${order.orderCode}`}
                      className={cn(
                        buttonVariants({ variant: "outline", size: "sm" }),
                        "w-full sm:w-auto rounded-xl text-xs font-semibold cursor-pointer"
                      )}
                    >
                      Chi tiết đơn
                      <ArrowRight size={13} className="ml-1" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
