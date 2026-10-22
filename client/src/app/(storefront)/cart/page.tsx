"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "./hooks/use-cart";
import { CartItem } from "./validation/cart.validation";
import { useAuthStore } from "@/stores/auth.store";
import { formatPrice } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { toast } from "react-toastify";
import {
  ShoppingBag,
  Trash2,
  Minus,
  Plus,
  ArrowLeft,
  ArrowRight,
  RefreshCw,
  Truck,
  RotateCcw,
  ShieldCheck,
  AlertTriangle,
  PackageOpen,
  Sparkles,
  ChevronRight,
  X,
} from "lucide-react";
import "./style/cart.css";

export default function CartPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [itemToDelete, setItemToDelete] = useState<CartItem | null>(null);

  const {
    items,
    totalItemCount,
    subtotalPrice,
    shippingFee,
    finalTotal,
    isFreeShipping,
    amountNeededForFreeShipping,
    freeShippingProgress,
    hasOutOfStockItems,
    hasExceededStockItems,
    isLoading,
    isError,
    updatingItemIds,
    refetch,
    changeItemQuantity,
    removeItem,
  } = useCart();

  const handleCheckoutClick = () => {
    if (items.length === 0) {
      toast.warning("Giỏ hàng của bạn đang trống.");
      return;
    }

    if (hasOutOfStockItems || hasExceededStockItems) {
      toast.error(
        "Giỏ hàng có sản phẩm đã hết hàng hoặc vượt quá tồn kho. Vui lòng điều chỉnh trước khi thanh toán."
      );
      return;
    }

    if (!isAuthenticated) {
      toast.info("Vui lòng đăng nhập để tiếp tục thanh toán đơn hàng.");
      router.push("/login?returnUrl=" + encodeURIComponent("/checkout"));
      return;
    }

    router.push("/checkout");
  };

  const confirmDelete = () => {
    if (itemToDelete) {
      removeItem(itemToDelete.id);
      setItemToDelete(null);
    }
  };

  // 1. Loading Skeleton State
  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
        <div className="space-y-4 mb-8">
          <Skeleton className="h-4 w-36 rounded" />
          <Skeleton className="h-8 w-64 rounded" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-8 space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="flex gap-4 p-4 rounded-2xl border border-border bg-card"
              >
                <Skeleton className="h-28 w-24 rounded-xl shrink-0" />
                <div className="flex-1 space-y-3 py-1">
                  <Skeleton className="h-5 w-3/4 rounded" />
                  <Skeleton className="h-4 w-1/3 rounded" />
                  <Skeleton className="h-6 w-28 rounded" />
                </div>
              </div>
            ))}
          </div>

          <div className="lg:col-span-4">
            <Skeleton className="h-80 w-full rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  // 2. Error State
  if (isError) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 text-destructive mb-4">
          <AlertTriangle size={32} />
        </div>
        <h1 className="text-xl font-bold text-foreground">Không thể tải giỏ hàng</h1>
        <p className="text-sm text-muted-foreground mt-2 mb-6">
          Đã xảy ra lỗi khi kết nối với máy chủ. Vui lòng kiểm tra kết nối mạng và thử lại.
        </p>
        <div className="flex justify-center gap-3">
          <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2 cursor-pointer">
            <RefreshCw size={14} />
            Thử lại
          </Button>
          <Link
            href="/products"
            className={cn(buttonVariants({ size: "sm" }), "gap-2")}
          >
            <ArrowLeft size={14} />
            Khám phá sản phẩm
          </Link>
        </div>
      </div>
    );
  }

  // 3. Empty State
  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-24 text-center">
        <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full border-2 border-dashed border-border bg-muted/20 mb-6">
          <ShoppingBag size={40} className="text-muted-foreground/60" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
          Giỏ hàng của bạn đang trống
        </h1>
        <p className="text-sm text-muted-foreground max-w-md mx-auto mt-2 mb-8 leading-relaxed">
          Chưa có sản phẩm nào được chọn. Hãy khám phá bộ sưu tập thời trang TrendyFit mới nhất và tìm cho mình những set đồ ấn tượng nhé!
        </p>
        <Link
          href="/products"
          className={cn(buttonVariants({ size: "lg" }), "gap-2 font-bold px-8 rounded-xl shadow-sm")}
        >
          <Sparkles size={16} />
          Khám phá sản phẩm ngay
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* 1. Breadcrumbs */}
      <nav className="flex items-center gap-2 text-xs text-muted-foreground mb-6">
        <Link href="/" className="hover:text-foreground transition-colors">
          Trang chủ
        </Link>
        <ChevronRight size={12} />
        <span className="text-foreground font-semibold">Giỏ hàng ({totalItemCount})</span>
      </nav>

      {/* 2. Page Title & Free Shipping Bar */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
            Giỏ hàng của bạn
          </h1>
          <span className="text-xs text-muted-foreground font-medium">
            ({totalItemCount} sản phẩm sẵn sàng đặt mua)
          </span>
        </div>

        {/* Free Shipping Progress Indicator */}
        <div className="mt-4 p-4 rounded-2xl border border-border bg-muted/20">
          <div className="flex items-center justify-between text-xs font-semibold mb-2">
            <span className="flex items-center gap-1.5 text-foreground">
              <Truck size={15} className="text-primary" />
              {isFreeShipping ? (
                <strong className="text-emerald-600">
                  🎉 Bạn được MIỄN PHÍ VẬN CHUYỂN cho đơn hàng này!
                </strong>
              ) : (
                <span>
                  Mua thêm{" "}
                  <strong className="text-foreground">
                    {formatPrice(amountNeededForFreeShipping)}
                  </strong>{" "}
                  để được <strong>MIỄN PHÍ VẬN CHUYỂN</strong>
                </span>
              )}
            </span>
            <span className="text-muted-foreground text-[11px]">
              {freeShippingProgress}%
            </span>
          </div>

          <div className="cart-progress-bar">
            <div
              className="cart-progress-fill"
              style={{ width: `${freeShippingProgress}%` }}
            />
          </div>
        </div>
      </div>

      {/* 3. Main Grid (Items List + Summary) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
        {/* LEFT COLUMN: Items List */}
        <div className="lg:col-span-8 space-y-4">
          {items.map((item) => {
            const variant = item.variant;
            const product = variant?.product;
            const unitPrice =
              (Number(product?.basePrice) || 0) + (Number(variant?.priceAdjustment) || 0);
            const itemTotal = unitPrice * item.quantity;
            const isUpdating = updatingItemIds.has(item.id);
            const isOutOfStock = variant.stockQuantity <= 0;
            const isExceededStock = item.quantity > variant.stockQuantity;

            const imageUrl =
              variant?.imageUrl ||
              (product?.images && product.images.length > 0 ? product.images[0] : "");

            return (
              <div
                key={item.id}
                className={cn(
                  "cart-item-card relative flex flex-col sm:flex-row gap-4 p-4 sm:p-5 rounded-2xl border bg-card shadow-sm",
                  isOutOfStock
                    ? "border-destructive/40 bg-destructive/5"
                    : isExceededStock
                    ? "border-amber-500/40 bg-amber-500/5"
                    : "border-border"
                )}
              >
                {/* Product Thumbnail */}
                <Link
                  href={product?.slug ? `/products/${product.slug}` : "#"}
                  className="relative h-28 w-24 sm:h-32 sm:w-28 rounded-xl overflow-hidden bg-muted/30 border border-border/60 shrink-0 self-center sm:self-start group"
                >
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt={product?.name || "Sản phẩm"}
                      className="h-full w-full object-cover object-center transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                      <PackageOpen size={24} className="opacity-40" />
                    </div>
                  )}
                </Link>

                {/* Details */}
                <div className="flex-1 flex flex-col justify-between min-w-0">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <Link
                        href={product?.slug ? `/products/${product.slug}` : "#"}
                        className="font-bold text-sm sm:text-base text-foreground hover:text-primary transition-colors line-clamp-2"
                      >
                        {product?.name || "Sản phẩm TrendyFit"}
                      </Link>

                      {/* Remove Button (Triggers Dialog) */}
                      <button
                        type="button"
                        onClick={() => setItemToDelete(item)}
                        disabled={isUpdating}
                        className="text-muted-foreground hover:text-destructive p-1.5 rounded-lg hover:bg-destructive/10 transition-colors shrink-0 cursor-pointer disabled:opacity-40"
                        title="Xóa sản phẩm khỏi giỏ"
                        aria-label="Xóa sản phẩm"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    {/* Variant tags */}
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      {variant?.color && (
                        <Badge
                          variant="secondary"
                          className="text-[11px] font-semibold bg-muted px-2 py-0.5"
                        >
                          Màu: {variant.color}
                        </Badge>
                      )}
                      {variant?.size && (
                        <Badge
                          variant="secondary"
                          className="text-[11px] font-semibold bg-muted px-2 py-0.5"
                        >
                          Size: {variant.size}
                        </Badge>
                      )}
                      {variant?.sku && (
                        <span className="text-[10px] text-muted-foreground font-mono">
                          SKU: {variant.sku}
                        </span>
                      )}
                    </div>

                    {/* Stock Alert Warnings */}
                    {isOutOfStock ? (
                      <div className="flex items-center gap-1.5 text-xs font-bold text-destructive mt-2">
                        <AlertTriangle size={13} />
                        <span>Sản phẩm này hiện đã hết hàng</span>
                      </div>
                    ) : isExceededStock ? (
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400 mt-2">
                        <AlertTriangle size={13} />
                        <span>
                          Số lượng đặt ({item.quantity}) vượt quá tồn kho khả dụng ({variant.stockQuantity})
                        </span>
                      </div>
                    ) : variant.stockQuantity <= 5 ? (
                      <p className="text-[11px] font-medium text-amber-600 dark:text-amber-400 mt-1.5">
                        Chỉ còn {variant.stockQuantity} sản phẩm trong kho
                      </p>
                    ) : null}
                  </div>

                  {/* Pricing & Quantity Controls */}
                  <div className="flex items-end justify-between gap-4 mt-4 pt-3 border-t border-border/50">
                    {/* Unit Price */}
                    <div>
                      <span className="text-xs text-muted-foreground block">Đơn giá</span>
                      <span className="text-sm font-bold text-foreground">
                        {formatPrice(unitPrice)}
                      </span>
                    </div>

                    {/* Quantity Stepper */}
                    <div className="flex items-center gap-3">
                      <div className="flex items-center border border-border rounded-xl h-9 bg-muted/20">
                        <button
                          type="button"
                          onClick={() => changeItemQuantity(item, item.quantity - 1)}
                          disabled={isUpdating}
                          className="h-full px-2.5 text-muted-foreground hover:text-foreground disabled:opacity-30 cursor-pointer"
                          aria-label="Giảm số lượng"
                        >
                          <Minus size={13} />
                        </button>
                        <span className="w-8 text-center font-bold text-xs">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => changeItemQuantity(item, item.quantity + 1)}
                          disabled={isUpdating || item.quantity >= variant.stockQuantity}
                          className="h-full px-2.5 text-muted-foreground hover:text-foreground disabled:opacity-30 cursor-pointer"
                          aria-label="Tăng số lượng"
                        >
                          <Plus size={13} />
                        </button>
                      </div>

                      {/* Subtotal of item */}
                      <div className="text-right min-w-[90px]">
                        <span className="text-xs text-muted-foreground block">Thành tiền</span>
                        <span className="text-base font-black text-foreground">
                          {formatPrice(itemTotal)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Continue shopping link */}
          <div className="pt-2">
            <Link
              href="/products"
              className="inline-flex items-center gap-2 text-xs font-bold text-foreground/80 hover:text-foreground transition-colors"
            >
              <ArrowLeft size={14} />
              Tiếp tục tìm kiếm thời trang
            </Link>
          </div>
        </div>

        {/* RIGHT COLUMN: Order Summary (Sticky) */}
        <div className="lg:col-span-4">
          <div className="cart-summary-sticky p-6 rounded-2xl border border-border bg-card shadow-sm space-y-6">
            <h2 className="text-base font-black text-foreground uppercase tracking-wider pb-4 border-b border-border">
              Tóm tắt đơn hàng
            </h2>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between text-muted-foreground">
                <span>Tổng số lượng</span>
                <span className="font-bold text-foreground">{totalItemCount} sản phẩm</span>
              </div>

              <div className="flex justify-between text-muted-foreground">
                <span>Tạm tính</span>
                <span className="font-bold text-foreground">{formatPrice(subtotalPrice)}</span>
              </div>

              <div className="flex justify-between text-muted-foreground">
                <span>Phí vận chuyển</span>
                <span className="font-bold text-foreground">
                  {isFreeShipping ? (
                    <span className="text-emerald-600">Miễn phí</span>
                  ) : (
                    formatPrice(shippingFee)
                  )}
                </span>
              </div>
            </div>

            <div className="pt-4 border-t border-border flex justify-between items-baseline">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                  Tổng thanh toán
                </span>
                <span className="text-[10px] text-muted-foreground">Đã bao gồm thuế GTGT</span>
              </div>
              <span className="text-2xl font-black text-foreground tracking-tight">
                {formatPrice(finalTotal)}
              </span>
            </div>

            {/* Checkout CTA Button */}
            <Button
              size="lg"
              className="w-full h-12 text-sm font-bold gap-2 rounded-xl shadow-md cursor-pointer"
              disabled={items.length === 0 || hasOutOfStockItems || hasExceededStockItems}
              onClick={handleCheckoutClick}
            >
              Tiến hành đặt hàng
              <ArrowRight size={16} />
            </Button>

            {/* Security and Trust Badges */}
            <div className="space-y-2.5 pt-4 border-t border-border/70 text-[11px] text-muted-foreground">
              <div className="flex items-center gap-2">
                <Truck size={14} className="text-foreground shrink-0" />
                <span>Giao hàng toàn quốc từ 2 đến 4 ngày làm việc</span>
              </div>
              <div className="flex items-center gap-2">
                <RotateCcw size={14} className="text-foreground shrink-0" />
                <span>Đổi trả miễn phí trong 7 ngày nếu không vừa ý</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck size={14} className="text-foreground shrink-0" />
                <span>Bảo mật thanh toán 100% chuẩn mã hóa</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Confirmation Dialog for Item Deletion */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/25 dark:bg-black/40 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-card text-card-foreground rounded-2xl border border-border p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2 text-destructive">
                <Trash2 size={20} />
                <h3 className="font-bold text-base text-foreground">Xóa sản phẩm</h3>
              </div>
              <button
                type="button"
                onClick={() => setItemToDelete(null)}
                className="text-muted-foreground hover:text-foreground p-1 rounded-lg"
              >
                <X size={16} />
              </button>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              Bạn có chắc chắn muốn xóa &quot;
              <strong className="text-foreground">
                {itemToDelete.variant?.product?.name}
              </strong>
              &quot; ({itemToDelete.variant?.color} - Size {itemToDelete.variant?.size}) khỏi giỏ hàng?
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setItemToDelete(null)}
                className="cursor-pointer"
              >
                Hủy bỏ
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={confirmDelete}
                className="cursor-pointer"
              >
                Xác nhận xóa
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

