"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useProductDetail } from "./hooks/use-product-detail";
import { useCart } from "@/app/(storefront)/cart/hooks/use-cart";
import { formatPrice } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { toast } from "react-toastify";
import {
  ShoppingBag,
  Ruler,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  RefreshCw,
  Minus,
  Plus,
  X,
  Layers,
  ChevronRight,
  Truck,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Shirt,
} from "lucide-react";
import "./style/product-detail.css";

export default function ProductDetailPage() {
  const params = useParams();
  const slug = (params?.slug as string) || "";

  const {
    product,
    colors,
    sizes,
    selectedColor,
    selectedSize,
    activeVariant,
    activeImage,
    allImages,
    quantity,
    currentPrice,
    isSizeChartOpen,
    isLoading,
    isError,
    advisorHeight,
    advisorWeight,
    advisorChest,
    advisorWaist,
    advisorHips,
    advisorPreference,
    advisorResult,
    isAdvisorLoading,
    advisorError,
    refetch,
    setSelectedColor,
    setSelectedSize,
    setActiveImage,
    setIsSizeChartOpen,
    setAdvisorHeight,
    setAdvisorWeight,
    setAdvisorChest,
    setAdvisorWaist,
    setAdvisorHips,
    setAdvisorPreference,
    requestRecommendation,
    applyRecommendedSize,
    increaseQuantity,
    decreaseQuantity,
    isSizeAvailableForColor,
    getSizeStock,
  } = useProductDetail(slug);

  const { addItem, isAddingItem } = useCart();
  const [imageError, setImageError] = useState(false);

  // Kiểm tra xem bảng kích thước có thông số vòng ngực / vòng eo không (quần thường không có ngực)
  const hasChestMeasurement = useMemo(
    () =>
      product?.sizeCharts?.some(
        (sc) => sc.chestCm !== null && sc.chestCm !== undefined
      ) || false,
    [product?.sizeCharts]
  );

  const hasWaistMeasurement = useMemo(
    () =>
      product?.sizeCharts?.some(
        (sc) => sc.waistCm !== null && sc.waistCm !== undefined
      ) || false,
    [product?.sizeCharts]
  );

  const handleAddToCart = async () => {
    if (!activeVariant) {
      toast.warning("Vui lòng chọn đầy đủ màu sắc và kích cỡ sản phẩm.");
      return;
    }
    if (activeVariant.stockQuantity <= 0) {
      toast.error("Biến thể sản phẩm này hiện đã hết hàng.");
      return;
    }

    try {
      await addItem({ variantId: activeVariant.id, quantity });
      toast.success(
        `Đã thêm ${quantity}x "${product?.name}" (${activeVariant.color} - Size ${activeVariant.size}) vào giỏ hàng thành công!`
      );
    } catch {
      // Lỗi đã được xử lý bởi onError trong useCart
    }
  };

  // 1. Loading Skeleton State
  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-7 space-y-4">
            <Skeleton className="aspect-[3/4] w-full rounded-3xl" />
            <div className="flex gap-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-20 rounded-xl" />
              ))}
            </div>
          </div>
          <div className="lg:col-span-5 space-y-6">
            <Skeleton className="h-6 w-32 rounded" />
            <Skeleton className="h-10 w-full rounded" />
            <Skeleton className="h-8 w-44 rounded" />
            <Skeleton className="h-24 w-full rounded" />
            <Skeleton className="h-12 w-full rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  // 2. Error / Not Found State
  if (isError || !product) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 text-destructive mb-4">
          <XCircle size={32} />
        </div>
        <h1 className="text-xl font-bold text-foreground">Không tìm thấy sản phẩm</h1>
        <p className="text-sm text-muted-foreground mt-2 mb-6">
          Sản phẩm có thể đã ngừng kinh doanh hoặc đường dẫn không chính xác.
        </p>
        <div className="flex justify-center gap-3">
          <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2">
            <RefreshCw size={14} />
            Thử lại
          </Button>
          <Link
            href="/products"
            className={cn(buttonVariants({ size: "sm" }), "gap-2")}
          >
            <ArrowLeft size={14} />
            Về danh mục
          </Link>
        </div>
      </div>
    );
  }

  const isCurrentOutOfStock = !activeVariant || activeVariant.stockQuantity <= 0;
  const currentStock = activeVariant?.stockQuantity || 0;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* 1. Breadcrumbs Navigation */}
      <nav className="flex items-center gap-2 text-xs text-muted-foreground mb-8 overflow-x-auto whitespace-nowrap">
        <Link href="/" className="hover:text-foreground transition-colors">
          Trang chủ
        </Link>
        <ChevronRight size={12} />
        <Link href="/products" className="hover:text-foreground transition-colors">
          Sản phẩm
        </Link>
        {product.category?.name && (
          <>
            <ChevronRight size={12} />
            <Link
              href={`/products?category=${product.category.slug || ""}`}
              className="hover:text-foreground transition-colors font-medium"
            >
              {product.category.name}
            </Link>
          </>
        )}
        <ChevronRight size={12} />
        <span className="text-foreground font-semibold truncate max-w-[200px] sm:max-w-xs">
          {product.name}
        </span>
      </nav>

      {/* 2. Main Product Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
        {/* LEFT COLUMN: Gallery */}
        <div className="lg:col-span-7 flex flex-col-reverse sm:flex-row gap-4">
          {/* Thumbnails list (hiển thị khi có nhiều hơn 1 ảnh) */}
          {allImages.length > 1 && (
            <div className="flex sm:flex-col gap-2.5 overflow-x-auto sm:overflow-y-auto max-h-[600px] pb-2 sm:pb-0 shrink-0">
              {allImages.map((img, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setActiveImage(img);
                    setImageError(false);
                  }}
                  className={cn(
                    "relative h-16 w-16 sm:h-20 sm:w-20 rounded-xl overflow-hidden border-2 bg-muted/30 shrink-0 transition-all cursor-pointer",
                    activeImage === img
                      ? "thumbnail-active ring-2 ring-foreground"
                      : "border-transparent opacity-70 hover:opacity-100"
                  )}
                  aria-label={`Xem ảnh ${idx + 1}`}
                >
                  <img
                    src={img}
                    alt={`${product.name} thumbnail ${idx + 1}`}
                    className="max-h-full max-w-full object-contain object-center p-1"
                    loading="lazy"
                  />
                </button>
              ))}
            </div>
          )}

          {/* Main Large Image Box */}
          <div className="product-image-container relative aspect-[3/4] max-h-[640px] w-full overflow-hidden rounded-3xl border border-border/80 bg-zinc-50 dark:bg-zinc-900/40 shadow-sm flex items-center justify-center">
            {activeImage && !imageError ? (
              <img
                src={activeImage}
                alt={product.name}
                onError={() => setImageError(true)}
                className="max-h-full max-w-full object-contain object-center transition-all duration-500 p-4"
              />
            ) : (
              <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground space-y-3">
                <Shirt size={48} className="opacity-30" />
                <p className="text-xs font-medium">Hình ảnh đang được cập nhật</p>
              </div>
            )}

            {/* Overlaid Badges */}
            <div className="absolute top-4 left-4 flex flex-col gap-2 pointer-events-none">
              {product.category?.name && (
                <Badge
                  variant="secondary"
                  className="backdrop-blur-md bg-white/90 dark:bg-zinc-900/90 font-semibold text-xs shadow-sm border border-border/60"
                >
                  {product.category.name}
                </Badge>
              )}
              {isCurrentOutOfStock ? (
                <Badge variant="destructive" className="font-semibold text-xs shadow-sm">
                  Tạm hết hàng
                </Badge>
              ) : currentStock <= 5 ? (
                <Badge variant="warning" className="font-semibold text-xs shadow-sm">
                  Chỉ còn {currentStock} sản phẩm
                </Badge>
              ) : null}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Product Information & Controls */}
        <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-24">
          <div>
            {/* Category tag */}
            {product.category?.name && (
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                {product.category.name}
              </p>
            )}

            {/* Title */}
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground leading-tight">
              {product.name}
            </h1>

            {/* Pricing Section */}
            <div className="mt-3 flex items-baseline gap-3">
              <span className="text-3xl font-black text-foreground tracking-tight">
                {formatPrice(currentPrice)}
              </span>
              {activeVariant && Number(activeVariant.priceAdjustment) !== 0 && (
                <span className="text-xs font-semibold text-muted-foreground">
                  (Điều chỉnh: {Number(activeVariant.priceAdjustment) > 0 ? "+" : ""}
                  {formatPrice(activeVariant.priceAdjustment)})
                </span>
              )}
            </div>

            {/* Stock indicator */}
            <div className="mt-3 flex items-center gap-2 text-xs font-medium">
              {activeVariant ? (
                activeVariant.stockQuantity > 0 ? (
                  <span className="flex items-center gap-1.5 text-emerald-600 font-semibold">
                    <CheckCircle2 size={14} />
                    Còn hàng ({activeVariant.stockQuantity} sản phẩm sẵn sàng giao)
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-destructive font-semibold">
                    <XCircle size={14} />
                    Tạm thời hết hàng cho màu và kích cỡ này
                  </span>
                )
              ) : (
                <span className="text-muted-foreground">Vui lòng chọn màu sắc và kích cỡ</span>
              )}
            </div>
          </div>

          <div className="border-t border-border/80 pt-6 space-y-6">
            {/* COLOR SELECTOR */}
            {colors.length > 0 && (
              <div className="space-y-2.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold uppercase tracking-wider text-muted-foreground">
                    Màu sắc:{" "}
                    <strong className="text-foreground font-semibold">{selectedColor}</strong>
                  </span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {colors.map((color) => {
                    const isSelected = selectedColor === color;
                    return (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setSelectedColor(color)}
                        className={cn(
                          "h-9 px-4 rounded-xl text-xs font-semibold border transition-all cursor-pointer flex items-center gap-2",
                          isSelected
                            ? "border-foreground bg-foreground text-background shadow-md"
                            : "border-border text-foreground hover:bg-muted/60"
                        )}
                      >
                        <span
                          className={cn(
                            "h-2.5 w-2.5 rounded-full border border-black/10",
                            color.toLowerCase().includes("wash")
                              ? "bg-sky-700"
                              : color.toLowerCase().includes("đen")
                              ? "bg-zinc-900"
                              : color.toLowerCase().includes("trắng")
                              ? "bg-white"
                              : "bg-primary"
                          )}
                        />
                        {color}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* SIZE SELECTOR & SIZE CHART TRIGGER */}
            {sizes.length > 0 && (
              <div className="space-y-2.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold uppercase tracking-wider text-muted-foreground">
                    Kích cỡ:{" "}
                    <strong className="text-foreground font-semibold">Size {selectedSize}</strong>
                  </span>

                  {product.sizeCharts && product.sizeCharts.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setIsSizeChartOpen(true)}
                      className="flex items-center gap-1.5 text-xs font-semibold text-foreground/80 hover:text-foreground underline underline-offset-4 cursor-pointer"
                    >
                      <Ruler size={13} className="text-primary" />
                      Bảng quy đổi kích cỡ
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  {sizes.map((size) => {
                    const isSelected = selectedSize === size;
                    const available = isSizeAvailableForColor(size);
                    const stock = getSizeStock(size);

                    return (
                      <button
                        key={size}
                        type="button"
                        onClick={() => setSelectedSize(size)}
                        className={cn(
                          "relative h-11 min-w-[52px] px-3.5 rounded-xl text-xs font-bold border transition-all cursor-pointer flex flex-col items-center justify-center",
                          isSelected
                            ? "border-foreground bg-foreground text-background shadow-md"
                            : available
                            ? "border-border text-foreground hover:bg-muted/60"
                            : "border-border/40 text-muted-foreground/40 line-through bg-muted/20"
                        )}
                        title={
                          available
                            ? `Size ${size} - Còn ${stock} sản phẩm`
                            : `Size ${size} hiện đã hết hàng`
                        }
                      >
                        <span>{size}</span>
                        {available && (
                          <span
                            className={cn(
                              "text-[9px] font-normal leading-none mt-0.5",
                              isSelected ? "text-background/80" : "text-muted-foreground"
                            )}
                          >
                            {stock} còn
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* QUANTITY & ACTIONS */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-3">
                {/* Quantity input */}
                <div className="flex items-center border border-border rounded-xl h-12 bg-muted/20 px-1">
                  <button
                    type="button"
                    onClick={decreaseQuantity}
                    disabled={quantity <= 1 || isCurrentOutOfStock}
                    className="h-10 w-9 flex items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-30 cursor-pointer"
                    aria-label="Giảm số lượng"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="w-10 text-center font-bold text-sm">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={increaseQuantity}
                    disabled={
                      isCurrentOutOfStock ||
                      quantity >= (activeVariant?.stockQuantity || 1)
                    }
                    className="h-10 w-9 flex items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-30 cursor-pointer"
                    aria-label="Tăng số lượng"
                  >
                    <Plus size={14} />
                  </button>
                </div>

                {/* Main Add to Cart Button */}
                <Button
                  size="lg"
                  className="flex-1 h-12 text-sm font-bold gap-2 rounded-xl shadow-sm cursor-pointer"
                  disabled={isCurrentOutOfStock || isAddingItem}
                  onClick={handleAddToCart}
                >
                  <ShoppingBag size={17} />
                  {isAddingItem
                    ? "Đang thêm vào giỏ..."
                    : isCurrentOutOfStock
                    ? "Tạm thời hết hàng"
                    : "Thêm vào giỏ hàng"}
                </Button>
              </div>

              {/* 2D Outfit Canvas Shortcut */}
              <Link
                href="/outfits"
                className={cn(
                  buttonVariants({ variant: "outline", size: "sm" }),
                  "w-full text-xs gap-2 h-10 font-semibold rounded-xl border-dashed"
                )}
              >
                <Layers size={14} />
                Thử phối đồ tại phòng phối 2D (Outfit Canvas)
              </Link>
            </div>

            {/* Shipping & Authentic Guarantee Perks */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 border-t border-border/70 pt-6">
              <div className="flex items-center gap-2.5 text-xs text-muted-foreground">
                <Truck size={16} className="text-foreground shrink-0" />
                <span>Giao hàng nhanh 2-4 ngày</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-muted-foreground">
                <RotateCcw size={16} className="text-foreground shrink-0" />
                <span>Đổi trả 7 ngày miễn phí</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-muted-foreground">
                <ShieldCheck size={16} className="text-foreground shrink-0" />
                <span>Chính hãng TrendyFit</span>
              </div>
            </div>

            {/* Product Description */}
            {product.description && (
              <div className="border-t border-border/80 pt-6 space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Mô tả & Chi tiết sản phẩm
                </h3>
                <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-line">
                  {product.description}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3. SIZE CHART SECTION & SMART FIT ADVISOR */}
      {product.sizeCharts && product.sizeCharts.length > 0 && (
        <section className="mt-16 sm:mt-24 border-t border-border/80 pt-10">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Ruler size={20} className="text-primary" />
                <h2 className="text-xl sm:text-2xl font-black text-foreground">
                  Bảng thông số kích thước & Tư vấn kích cỡ
                </h2>
              </div>
              <p className="text-xs text-muted-foreground">
                Được chuẩn hóa riêng cho sản phẩm &quot;{product.name}&quot; nhằm đảm bảo vừa vặn tối ưu.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Size Chart Table */}
            <div className="lg:col-span-8 overflow-x-auto rounded-2xl border border-border bg-card shadow-sm">
              <table className="w-full table-size-chart">
                <thead>
                  <tr>
                    <th>Kích cỡ (Size)</th>
                    <th>Chiều cao chuẩn</th>
                    <th>Cân nặng chuẩn</th>
                    {hasChestMeasurement && <th>Vòng ngực</th>}
                    {hasWaistMeasurement && <th>Vòng eo</th>}
                  </tr>
                </thead>
                <tbody>
                  {product.sizeCharts.map((sc) => {
                    const isSelectedRow = selectedSize === sc.size;
                    return (
                      <tr
                        key={sc.id || sc.size}
                        className={cn(
                          "transition-colors",
                          isSelectedRow
                            ? "bg-primary/10 font-medium"
                            : "hover:bg-muted/20"
                        )}
                      >
                        <td className="font-extrabold text-foreground">
                          {sc.size}
                          {isSelectedRow && (
                            <Badge variant="outline" className="ml-2 text-[10px]">
                              Đang chọn
                            </Badge>
                          )}
                        </td>
                        <td>
                          {sc.minHeightCm} - {sc.maxHeightCm} cm
                        </td>
                        <td>
                          {sc.minWeightKg} - {sc.maxWeightKg} kg
                        </td>
                        {hasChestMeasurement && (
                          <td>{sc.chestCm ? `${sc.chestCm} cm` : "-"}</td>
                        )}
                        {hasWaistMeasurement && (
                          <td>{sc.waistCm ? `${sc.waistCm} cm` : "-"}</td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Smart Fit Advisor Interactive Box (Powered by POST /api/fit-advisor/recommend) */}
            <div className="lg:col-span-4 smart-fit-card rounded-2xl p-6 space-y-4 shadow-sm border border-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles size={16} className="text-primary" />
                  <h3 className="font-bold text-sm text-foreground">
                    Smart Fit Advisor AI
                  </h3>
                </div>
                <Badge variant="outline" className="text-[10px] uppercase font-bold text-primary">
                  AI Size Recommendation
                </Badge>
              </div>

              <p className="text-xs text-muted-foreground">
                Nhập số đo nhân trắc học để thuật toán AI phân tích và đề xuất size tối ưu từ dữ liệu size chart thật:
              </p>

              {/* Bắt buộc: Chiều cao & Cân nặng */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-muted-foreground flex items-center justify-between">
                    <span>Chiều cao *</span>
                    <span className="text-[10px] text-muted-foreground font-normal">cm</span>
                  </label>
                  <Input
                    type="number"
                    placeholder="VD: 170"
                    value={advisorHeight}
                    onChange={(e) => setAdvisorHeight(e.target.value)}
                    className="h-9 text-xs"
                    min={100}
                    max={250}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-muted-foreground flex items-center justify-between">
                    <span>Cân nặng *</span>
                    <span className="text-[10px] text-muted-foreground font-normal">kg</span>
                  </label>
                  <Input
                    type="number"
                    placeholder="VD: 60"
                    value={advisorWeight}
                    onChange={(e) => setAdvisorWeight(e.target.value)}
                    className="h-9 text-xs"
                    min={30}
                    max={200}
                  />
                </div>
              </div>

              {/* Tùy chọn: Vòng ngực, eo, mông */}
              <div className="grid grid-cols-3 gap-2 pt-1">
                <div className="space-y-1">
                  <label className="text-[10px] font-medium text-muted-foreground block truncate">
                    Vòng ngực
                  </label>
                  <Input
                    type="number"
                    placeholder="cm"
                    value={advisorChest}
                    onChange={(e) => setAdvisorChest(e.target.value)}
                    className="h-8 text-xs px-2"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-medium text-muted-foreground block truncate">
                    Vòng eo
                  </label>
                  <Input
                    type="number"
                    placeholder="cm"
                    value={advisorWaist}
                    onChange={(e) => setAdvisorWaist(e.target.value)}
                    className="h-8 text-xs px-2"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-medium text-muted-foreground block truncate">
                    Vòng mông
                  </label>
                  <Input
                    type="number"
                    placeholder="cm"
                    value={advisorHips}
                    onChange={(e) => setAdvisorHips(e.target.value)}
                    className="h-8 text-xs px-2"
                  />
                </div>
              </div>

              {/* Phong cách mặc: TIGHT / REGULAR / LOOSE */}
              <div className="space-y-1.5 pt-1">
                <label className="text-[11px] font-semibold text-muted-foreground block">
                  Phong cách mặc mong muốn
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(
                    [
                      { key: "TIGHT", label: "Ôm sát" },
                      { key: "REGULAR", label: "Vừa vặn" },
                      { key: "LOOSE", label: "Rộng rãi" },
                    ] as const
                  ).map((pref) => (
                    <button
                      key={pref.key}
                      type="button"
                      onClick={() => setAdvisorPreference(pref.key)}
                      className={cn(
                        "h-8 rounded-lg text-xs font-semibold border transition-all cursor-pointer",
                        advisorPreference === pref.key
                          ? "bg-foreground text-background border-foreground shadow-sm"
                          : "border-border text-muted-foreground hover:bg-muted/40"
                      )}
                    >
                      {pref.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="button"
                size="sm"
                className="w-full text-xs font-bold gap-2 cursor-pointer h-9 shadow-sm"
                onClick={requestRecommendation}
                disabled={isAdvisorLoading || !advisorHeight || !advisorWeight}
              >
                {isAdvisorLoading ? (
                  <>
                    <RefreshCw size={13} className="animate-spin" />
                    Đang phân tích số đo qua AI...
                  </>
                ) : (
                  <>
                    <Sparkles size={14} />
                    Gợi ý kích cỡ thông minh
                  </>
                )}
              </Button>

              {/* Error Message */}
              {advisorError && (
                <div className="p-2.5 bg-destructive/10 text-destructive text-xs rounded-xl flex items-center gap-2">
                  <XCircle size={14} className="shrink-0" />
                  <span>{advisorError}</span>
                </div>
              )}

              {/* Result Box từ backend API */}
              {advisorResult && (
                <div className="p-4 bg-white dark:bg-zinc-900 rounded-xl border border-primary/40 space-y-3 shadow-md animate-in fade-in duration-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                        Size đề xuất từ hệ thống
                      </span>
                      <span className="text-2xl font-black text-foreground">
                        Size {advisorResult.recommendedSize}
                      </span>
                    </div>
                    <Badge variant="success" className="text-xs px-2.5 py-1 font-bold">
                      Khớp {advisorResult.confidenceScore}
                    </Badge>
                  </div>

                  {advisorResult.fitType && (
                    <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                      <CheckCircle2 size={14} />
                      <span>{advisorResult.fitType}</span>
                    </div>
                  )}

                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {advisorResult.advice ||
                      `Size ${advisorResult.recommendedSize} là lựa chọn lý tưởng nhất cho số đo của bạn (độ tin cậy ${advisorResult.confidenceScore}).`}
                  </p>

                  <Button
                    size="xs"
                    className="w-full text-xs font-bold cursor-pointer h-8"
                    onClick={applyRecommendedSize}
                  >
                    Chọn Size {advisorResult.recommendedSize} ngay
                  </Button>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* 4. SIZE CHART MODAL POPUP */}
      {isSizeChartOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-2xl bg-white dark:bg-zinc-950 rounded-3xl border border-border p-6 sm:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-border">
              <div className="flex items-center gap-2">
                <Ruler size={18} className="text-primary" />
                <h3 className="font-bold text-base text-foreground">
                  Bảng thông số kích thước: {product.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsSizeChartOpen(false)}
                className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg cursor-pointer"
                aria-label="Đóng bảng size"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-muted-foreground my-4">
              Lựa chọn kích cỡ phù hợp nhất với số đo cơ thể của bạn. Nếu số đo nằm giữa hai kích cỡ, bạn nên ưu tiên chọn kích cỡ lớn hơn để có cảm giác mặc thoải mái nhất.
            </p>

            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full table-size-chart">
                <thead>
                  <tr>
                    <th>Kích cỡ</th>
                    <th>Chiều cao</th>
                    <th>Cân nặng</th>
                    {hasChestMeasurement && <th>Ngực</th>}
                    {hasWaistMeasurement && <th>Eo</th>}
                  </tr>
                </thead>
                <tbody>
                  {product.sizeCharts?.map((sc) => (
                    <tr key={sc.id || sc.size}>
                      <td className="font-bold">{sc.size}</td>
                      <td>
                        {sc.minHeightCm} - {sc.maxHeightCm} cm
                      </td>
                      <td>
                        {sc.minWeightKg} - {sc.maxWeightKg} kg
                      </td>
                      {hasChestMeasurement && (
                        <td>{sc.chestCm ? `${sc.chestCm} cm` : "-"}</td>
                      )}
                      {hasWaistMeasurement && (
                        <td>{sc.waistCm ? `${sc.waistCm} cm` : "-"}</td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-6 flex justify-end">
              <Button
                size="sm"
                onClick={() => setIsSizeChartOpen(false)}
                className="cursor-pointer"
              >
                Đã hiểu
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
