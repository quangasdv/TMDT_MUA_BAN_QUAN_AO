"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useOutfits } from "./hooks/use-outfits";
import {
  OutfitSlotType,
  outfitSlotNames,
  SlotProduct,
  SlotProductVariant,
} from "./validation/outfits.validation";
import { formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  Layers,
  Shirt,
  Scissors,
  Footprints,
  Sparkles,
  ShoppingBag,
  RotateCcw,
  Check,
  ChevronRight,
  RefreshCw,
  AlertCircle,
  X,
  PackageOpen,
  Info,
} from "lucide-react";
import "./style/outfits.css";

const SLOT_ICONS: Record<OutfitSlotType, React.ElementType> = {
  TOP: Shirt,
  BOTTOM: Scissors,
  OUTERWEAR: Layers,
  SHOES: Footprints,
  ACCESSORY: Sparkles,
};

const ALL_SLOTS: OutfitSlotType[] = ["ACCESSORY", "OUTERWEAR", "TOP", "BOTTOM", "SHOES"];

export default function OutfitsPage() {
  const {
    outfits,
    slots,
    activeSlot,
    selectedOutfitId,
    canvasItems,
    totalPrice,
    selectedSlotCount,
    isLoading,
    isError,
    isAddingAllToCart,
    setActiveSlot,
    selectItemForSlot,
    clearSlot,
    loadPresetOutfit,
    resetCanvas,
    addAllToCart,
    refetch,
  } = useOutfits();

  const [selectedVariants, setSelectedVariants] = useState<Record<string, SlotProductVariant>>({});

  const handleSelectProduct = (slot: OutfitSlotType, prod: SlotProduct) => {
    const variant = selectedVariants[prod.id] || prod.variants[0];
    if (variant) {
      selectItemForSlot(slot, prod, variant);
    }
  };

  const handleVariantChange = (prodId: string, variant: SlotProductVariant, slot: OutfitSlotType, prod: SlotProduct) => {
    setSelectedVariants((prev) => ({ ...prev, [prodId]: variant }));
    selectItemForSlot(slot, prod, variant);
  };

  // 1. Loading Skeleton State
  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
        <div className="space-y-4 mb-8">
          <Skeleton className="h-4 w-48 rounded" />
          <Skeleton className="h-10 w-80 rounded" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7">
            <Skeleton className="h-[600px] w-full rounded-3xl" />
          </div>
          <div className="lg:col-span-5 space-y-4">
            <Skeleton className="h-12 w-full rounded-xl" />
            <Skeleton className="h-64 w-full rounded-2xl" />
            <Skeleton className="h-40 w-full rounded-2xl" />
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
          <AlertCircle size={32} />
        </div>
        <h1 className="text-xl font-bold text-foreground">Không thể tải phòng phối đồ</h1>
        <p className="text-sm text-muted-foreground mt-2 mb-6">
          Đã xảy ra lỗi khi tải danh mục và sản phẩm phối đồ. Vui lòng thử lại.
        </p>
        <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2 cursor-pointer">
          <RefreshCw size={14} />
          Thử lại
        </Button>
      </div>
    );
  }

  const activeSlotProducts = slots[activeSlot] || [];

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* 1. Breadcrumbs */}
      <nav className="flex items-center gap-2 text-xs text-muted-foreground mb-6">
        <Link href="/" className="hover:text-foreground transition-colors">
          Trang chủ
        </Link>
        <ChevronRight size={12} />
        <span className="text-foreground font-semibold">Phòng phối đồ tương tác 2D</span>
      </nav>

      {/* 2. Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-border/70 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Layers size={22} className="text-primary" />
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
              Phòng phối đồ 2D (Outfit Canvas)
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Tự do sáng tạo phong cách đường phố cá tính qua 5 tầng trang phục tương tác thời gian thực.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={resetCanvas}
            className="text-xs gap-1.5 h-9 rounded-xl cursor-pointer"
          >
            <RotateCcw size={14} />
            Đặt lại Canvas
          </Button>
        </div>
      </div>

      {/* 3. Main 2D Canvas & Slot Selector Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
        {/* LEFT COLUMN: Interactive 2D Visual Canvas */}
        <div className="lg:col-span-7">
          <div className="outfit-canvas-container rounded-3xl p-6 sm:p-8 flex flex-col justify-between shadow-sm">
            {/* Header info inside canvas */}
            <div className="flex items-center justify-between pb-4 border-b border-border/50">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Interactive Studio Canvas
                </span>
              </div>
              <Badge variant="secondary" className="text-[11px] font-semibold bg-background/80 backdrop-blur-sm">
                Đã phối {selectedSlotCount}/5 món
              </Badge>
            </div>

            {/* Vertical Visual Mannequin Layered Slots */}
            <div className="flex flex-col items-center justify-center gap-4 py-8 max-w-md mx-auto w-full">
              {ALL_SLOTS.map((slotKey) => {
                const item = canvasItems[slotKey];
                const meta = outfitSlotNames[slotKey];
                const SlotIcon = SLOT_ICONS[slotKey];
                const isActive = activeSlot === slotKey;

                return (
                  <div
                    key={slotKey}
                    onClick={() => setActiveSlot(slotKey)}
                    className={cn(
                      "canvas-slot-box w-full rounded-2xl p-3 sm:p-4 flex items-center justify-between gap-4 cursor-pointer relative bg-background/90 backdrop-blur-sm",
                      isActive ? "is-active ring-2 ring-primary" : "hover:border-foreground/40",
                      item ? "border-solid bg-background" : "border-dashed"
                    )}
                  >
                    {/* Left: Slot label & Icon */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={cn(
                          "h-10 w-10 rounded-xl flex items-center justify-center shrink-0 transition-colors",
                          isActive
                            ? "bg-foreground text-background"
                            : item
                            ? "bg-muted text-foreground"
                            : "bg-muted/40 text-muted-foreground"
                        )}
                      >
                        <SlotIcon size={18} />
                      </div>

                      <div className="min-w-0">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                          {meta.label}
                        </span>

                        {item ? (
                          <div className="truncate">
                            <p className="text-xs sm:text-sm font-bold text-foreground truncate">
                              {item.product.name}
                            </p>
                            <p className="text-[11px] text-muted-foreground">
                              {item.variant.color} · Size {item.variant.size} ·{" "}
                              <strong className="text-foreground font-semibold">
                                {formatPrice(
                                  (Number(item.product.basePrice) || 0) +
                                    (Number(item.variant.priceAdjustment) || 0)
                                )}
                              </strong>
                            </p>
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground/80 italic">
                            Chưa chọn món ({meta.hint})
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Right: Item Thumbnail or Add Trigger */}
                    <div className="flex items-center gap-2 shrink-0">
                      {item ? (
                        <>
                          <div className="relative h-14 w-14 rounded-xl overflow-hidden bg-muted/20 border border-border shrink-0">
                            {item.variant.imageUrl ? (
                              <img
                                src={item.variant.imageUrl}
                                alt={item.product.name}
                                className="canvas-item-img h-full w-full object-cover object-center"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center">
                                <PackageOpen size={16} className="text-muted-foreground" />
                              </div>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              clearSlot(slotKey);
                            }}
                            className="p-1 text-muted-foreground hover:text-destructive rounded-lg hover:bg-destructive/10 transition-colors"
                            title="Bỏ chọn món này"
                            aria-label={`Bỏ chọn ${meta.label}`}
                          >
                            <X size={16} />
                          </button>
                        </>
                      ) : (
                        <span className="text-xs font-semibold text-primary underline underline-offset-2">
                          Chọn món +
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bottom canvas hint */}
            <div className="pt-4 border-t border-border/50 flex items-center justify-between text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Info size={13} />
                Nhấp trực tiếp vào từng tầng để mở danh sách đồ tương ứng.
              </span>
              <span className="font-semibold text-foreground">
                Tổng set: {formatPrice(totalPrice)}
              </span>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Slot Tabs & Item Selector */}
        <div className="lg:col-span-5 space-y-6">
          {/* 5 Slot Tabs */}
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Chọn tầng phối đồ:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {ALL_SLOTS.map((slotKey) => {
                const meta = outfitSlotNames[slotKey];
                const SlotIcon = SLOT_ICONS[slotKey];
                const isActive = activeSlot === slotKey;
                const isFilled = !!canvasItems[slotKey];

                return (
                  <button
                    key={slotKey}
                    type="button"
                    onClick={() => setActiveSlot(slotKey)}
                    className={cn(
                      "slot-tab-btn flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border cursor-pointer",
                      isActive
                        ? "is-active shadow-sm"
                        : "border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    )}
                  >
                    <SlotIcon size={13} />
                    <span>{meta.label}</span>
                    {isFilled && (
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 ml-0.5" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Slot Catalog List */}
          <div className="bg-card rounded-2xl border border-border p-5 space-y-4 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-border/70">
              <div>
                <h3 className="text-sm font-bold text-foreground">
                  Danh mục: {outfitSlotNames[activeSlot].label}
                </h3>
                <p className="text-[11px] text-muted-foreground">
                  {activeSlotProducts.length} sản phẩm khả dụng cho tầng này
                </p>
              </div>

              {canvasItems[activeSlot] && (
                <button
                  type="button"
                  onClick={() => clearSlot(activeSlot)}
                  className="text-xs text-destructive hover:underline font-semibold"
                >
                  Gỡ món đang chọn
                </button>
              )}
            </div>

            {/* List of products for the active slot */}
            {activeSlotProducts.length > 0 ? (
              <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                {activeSlotProducts.map((prod) => {
                  const isSelected = canvasItems[activeSlot]?.product.id === prod.id;
                  const currentSelectedVariant =
                    (isSelected ? canvasItems[activeSlot]?.variant : null) ||
                    selectedVariants[prod.id] ||
                    prod.variants[0];

                  const prodImage =
                    currentSelectedVariant?.imageUrl ||
                    (prod.variants[0] ? prod.variants[0].imageUrl : "");

                  return (
                    <div
                      key={prod.id}
                      className={cn(
                        "p-3 rounded-xl border transition-all flex gap-3 items-center justify-between",
                        isSelected
                          ? "border-primary bg-primary/5 shadow-sm"
                          : "border-border bg-background hover:border-foreground/30"
                      )}
                    >
                      {/* Product thumbnail */}
                      <div className="relative h-16 w-16 rounded-lg overflow-hidden bg-muted/30 border border-border/60 shrink-0">
                        {prodImage ? (
                          <img
                            src={prodImage}
                            alt={prod.name}
                            className="h-full w-full object-cover object-center"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <PackageOpen size={18} className="text-muted-foreground" />
                          </div>
                        )}
                      </div>

                      {/* Info & Variants */}
                      <div className="flex-1 min-w-0 space-y-1">
                        <Link
                          href={`/products/${prod.slug}`}
                          className="font-bold text-xs text-foreground hover:text-primary transition-colors block truncate"
                        >
                          {prod.name}
                        </Link>

                        <p className="text-xs font-black text-foreground">
                          {formatPrice(
                            (Number(prod.basePrice) || 0) +
                              (Number(currentSelectedVariant?.priceAdjustment) || 0)
                          )}
                        </p>

                        {/* Variant pills if multiple */}
                        {prod.variants.length > 1 && (
                          <div className="flex flex-wrap gap-1 pt-1">
                            {prod.variants.slice(0, 4).map((v) => (
                              <button
                                key={v.id}
                                type="button"
                                onClick={() =>
                                  handleVariantChange(prod.id, v, activeSlot, prod)
                                }
                                className={cn(
                                  "text-[10px] px-1.5 py-0.5 rounded border transition-colors",
                                  currentSelectedVariant?.id === v.id
                                    ? "bg-foreground text-background border-foreground font-semibold"
                                    : "border-border text-muted-foreground hover:bg-muted"
                                )}
                              >
                                {v.color} - {v.size}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Select Action */}
                      <Button
                        size="xs"
                        variant={isSelected ? "default" : "outline"}
                        className={cn(
                          "shrink-0 text-xs font-bold cursor-pointer h-8",
                          isSelected ? "bg-primary text-primary-foreground" : ""
                        )}
                        onClick={() => handleSelectProduct(activeSlot, prod)}
                      >
                        {isSelected ? (
                          <>
                            <Check size={13} />
                            Đã phối
                          </>
                        ) : (
                          "Phối món này"
                        )}
                      </Button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-8 text-center text-muted-foreground space-y-2">
                <PackageOpen size={32} className="mx-auto opacity-30" />
                <p className="text-xs">
                  Hiện chưa có sản phẩm mẫu cho tầng &quot;{outfitSlotNames[activeSlot].label}&quot;.
                </p>
                <p className="text-[11px] text-muted-foreground/80">
                  Hãy thử chuyển sang các tầng khác như Áo (TOP) hoặc Quần (BOTTOM) để tiếp tục phối đồ!
                </p>
              </div>
            )}
          </div>

          {/* Sticky Total & Add All to Cart Action Card */}
          <div className="bg-card rounded-2xl border border-border p-5 space-y-4 shadow-sm">
            <div className="flex justify-between items-baseline pb-3 border-b border-border">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                  Tổng giá set đồ Canvas
                </span>
                <span className="text-[11px] text-muted-foreground">
                  Đã chọn {selectedSlotCount} món trang phục
                </span>
              </div>
              <span className="text-2xl font-black text-foreground tracking-tight">
                {formatPrice(totalPrice)}
              </span>
            </div>

            <Button
              size="lg"
              className="w-full h-12 text-sm font-bold gap-2 rounded-xl shadow-md cursor-pointer"
              disabled={selectedSlotCount === 0 || isAddingAllToCart}
              onClick={addAllToCart}
            >
              <ShoppingBag size={17} />
              {isAddingAllToCart
                ? "Đang thêm set đồ..."
                : selectedSlotCount === 0
                ? "Chưa chọn món đồ nào"
                : `Thêm toàn bộ Set đồ vào giỏ (${selectedSlotCount} món)`}
            </Button>
          </div>
        </div>
      </div>

      {/* 4. Lookbook Presets Section (GET /api/outfits) */}
      <section className="mt-16 sm:mt-24 border-t border-border/80 pt-10">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-foreground">
              Bộ sưu tập Outfit phối sẵn (Lookbook Presets)
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              Các phong cách thời trang thịnh hành được các Stylist TrendyFit phối sẵn chuẩn gu.
            </p>
          </div>
        </div>

        {outfits.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {outfits.map((outfit) => {
              const isSelected = selectedOutfitId === outfit.id;
              return (
                <div
                  key={outfit.id}
                  className={cn(
                    "lookbook-preset-card rounded-2xl border bg-card overflow-hidden shadow-sm flex flex-col justify-between",
                    isSelected ? "ring-2 ring-primary border-primary" : "border-border"
                  )}
                >
                  <div className="relative aspect-[4/3] bg-muted/30 overflow-hidden">
                    {outfit.imageUrl ? (
                      <img
                        src={outfit.imageUrl}
                        alt={outfit.name}
                        className="h-full w-full object-cover object-center"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                        <Layers size={36} className="opacity-30" />
                      </div>
                    )}
                    {outfit.discountPercent && outfit.discountPercent > 0 && (
                      <Badge variant="destructive" className="absolute top-3 left-3 text-xs font-bold">
                        Giảm {outfit.discountPercent}%
                      </Badge>
                    )}
                  </div>

                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div>
                      <h3 className="font-bold text-base text-foreground line-clamp-1">
                        {outfit.name}
                      </h3>
                      {outfit.description && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {outfit.description}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground font-semibold mt-2">
                        Bao gồm {outfit.items.length} món đồ phối hợp
                      </p>
                    </div>

                    <Button
                      variant={isSelected ? "default" : "outline"}
                      size="sm"
                      className="w-full text-xs font-bold gap-2 cursor-pointer h-9 rounded-xl"
                      onClick={() => loadPresetOutfit(outfit)}
                    >
                      <Layers size={14} />
                      {isSelected ? "Đang áp dụng trên Canvas" : "Thử set đồ này trên Canvas"}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-8 rounded-2xl border border-dashed border-border text-center space-y-3 bg-muted/10">
            <Sparkles size={32} className="mx-auto text-primary opacity-60" />
            <p className="text-sm font-semibold text-foreground">
              Bộ sưu tập Lookbook Preset đang được cập nhật
            </p>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              Bạn có thể tự do phối hợp các tầng trang phục Áo (TOP), Quần (BOTTOM), Áo khoác (OUTERWEAR) trên Studio Canvas 2D phía trên!
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
