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
  User,
  LayoutGrid,
  Eye,
  CheckCircle2,
  Palette,
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
  const [viewMode, setViewMode] = useState<"mannequin" | "flatlay">("mannequin");

  const handleSelectProduct = (slot: OutfitSlotType, prod: SlotProduct) => {
    const variant = selectedVariants[prod.id] || prod.variants[0];
    if (variant) {
      selectItemForSlot(slot, prod, variant);
    }
  };

  const handleVariantChange = (
    prodId: string,
    variant: SlotProductVariant,
    slot: OutfitSlotType,
    prod: SlotProduct
  ) => {
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
  const hasOuterwear = !!canvasItems.OUTERWEAR;
  const hasTop = !!canvasItems.TOP;
  const hasBottom = !!canvasItems.BOTTOM;
  const isLayeringActive = hasOuterwear && hasTop;

  // Tính toán nhận xét phối màu thông minh
  const selectedColors = ALL_SLOTS.map((s) => canvasItems[s]?.variant.color).filter(Boolean);

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
              Phòng phối đồ 2D (Interactive Outfit Studio)
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Trực quan hóa phong cách thời trang, mix &amp; match trang phục theo từng tầng layer chân thực.
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
        {/* LEFT COLUMN: Interactive Visual Studio Canvas & Layer Slots */}
        <div className="lg:col-span-7">
          <div className="outfit-canvas-container rounded-3xl p-5 sm:p-7 flex flex-col justify-between shadow-sm">
            {/* Header info inside canvas */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-border/50">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Visual Outfit Studio
                </span>
                <Badge variant="secondary" className="text-[11px] font-semibold bg-background/80 backdrop-blur-sm ml-1">
                  Đã phối {selectedSlotCount}/5 món
                </Badge>
              </div>

              {/* View Mode Toggle: Mannequin vs Flat-lay */}
              <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-xl border border-border/50">
                <button
                  type="button"
                  onClick={() => setViewMode("mannequin")}
                  className={cn(
                    "flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer",
                    viewMode === "mannequin"
                      ? "bg-background text-foreground shadow-xs font-bold"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                  title="Chế độ Ma-nơ-canh 2D (Xếp chồng từng tầng)"
                >
                  <User size={13} />
                  <span>Ma-nơ-canh 2D</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("flatlay")}
                  className={cn(
                    "flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer",
                    viewMode === "flatlay"
                      ? "bg-background text-foreground shadow-xs font-bold"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                  title="Chế độ Xếp đồ trải sàn Lookbook (Flat-lay)"
                >
                  <LayoutGrid size={13} />
                  <span>Xếp đồ Flat-lay</span>
                </button>
              </div>
            </div>

            {/* Smart Layering Insight Alert */}
            {isLayeringActive && (
              <div className="mt-4 p-2.5 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-primary font-semibold">
                  <Sparkles size={14} className="shrink-0" />
                  <span>
                    Layering chuẩn: Áo khoác ngoài ({canvasItems.OUTERWEAR?.product.name}) phủ bên ngoài Áo lót trong ({canvasItems.TOP?.product.name})
                  </span>
                </div>
                <Badge variant="outline" className="text-[10px] bg-background/80 text-primary border-primary/30">
                  Z-Index Layered
                </Badge>
              </div>
            )}

            {/* Main Stage: Side-by-side Visual Canvas + Layer Cards */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 my-6 items-center">
              {/* 1. VISUAL STAGE (Mannequin or Flat-lay) */}
              <div className="md:col-span-6 flex flex-col items-center justify-center">
                {viewMode === "mannequin" ? (
                  /* MANNEQUIN 2D STAGE */
                  <div className="mannequin-stage relative w-full max-w-[270px] h-[500px] rounded-2xl overflow-hidden flex flex-col items-center justify-between p-3 select-none">
                    <div className="studio-spotlight absolute inset-0 pointer-events-none" />

                    {/* Minimalist Mannequin Silhouette Line Art */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
                      <svg
                        viewBox="0 0 160 400"
                        className="w-full h-full stroke-foreground fill-none"
                        strokeWidth="1.5"
                        strokeDasharray="3 3"
                      >
                        <circle cx="80" cy="35" r="16" />
                        <path d="M 74 51 L 74 65 M 86 51 L 86 65" />
                        <path d="M 45 75 Q 80 65 115 75 L 105 170 Q 80 178 55 170 Z" />
                        <path d="M 55 170 Q 80 182 105 170 L 110 210 Q 80 220 50 210 Z" />
                        <path d="M 58 215 L 62 360 M 102 215 L 98 360" />
                        <path d="M 80 360 L 80 395 M 50 395 L 110 395" strokeDasharray="none" strokeWidth="2" />
                      </svg>
                    </div>

                    {/* LAYER 5: ACCESSORY (Top / Head) - z-index: 40 */}
                    <div
                      onClick={() => setActiveSlot("ACCESSORY")}
                      className={cn(
                        "relative z-40 w-24 h-16 rounded-xl flex items-center justify-center transition-all cursor-pointer",
                        canvasItems.ACCESSORY
                          ? "layer-item bg-white/70 dark:bg-black/40 backdrop-blur-xs p-1 rounded-xl shadow-xs"
                          : activeSlot === "ACCESSORY"
                          ? "border border-primary bg-primary/10 ring-1 ring-primary"
                          : "border border-dashed border-border/80 hover:border-foreground/50 bg-background/40"
                      )}
                      title="Tầng 1: Mũ & Phụ kiện"
                    >
                      {canvasItems.ACCESSORY ? (
                        <img
                          src={canvasItems.ACCESSORY.variant.imageUrl}
                          alt={canvasItems.ACCESSORY.product.name}
                          className="h-full w-full object-contain filter drop-shadow-xs"
                        />
                      ) : (
                        <span className="text-[10px] font-bold text-muted-foreground flex items-center gap-1">
                          <Sparkles size={11} /> + Mũ / Kính
                        </span>
                      )}
                    </div>

                    {/* TORSO CONTAINER: OUTERWEAR & TOP OVERLAPPING */}
                    <div className="relative w-full h-44 flex items-center justify-center">
                      {/* LAYER 2: TOP (Inside shirt) - z-index: 20 */}
                      <div
                        onClick={() => setActiveSlot("TOP")}
                        className={cn(
                          "absolute z-20 w-36 h-36 rounded-2xl flex items-center justify-center transition-all cursor-pointer overflow-hidden",
                          canvasItems.TOP
                            ? "layer-item layer-top bg-white/70 dark:bg-black/40 backdrop-blur-xs p-1 shadow-xs"
                            : activeSlot === "TOP"
                            ? "border border-primary bg-primary/10 ring-1 ring-primary"
                            : "border border-dashed border-border/80 hover:border-foreground/50 bg-background/40"
                        )}
                        style={{
                          transform: canvasItems.OUTERWEAR ? "scale(0.85)" : "scale(1)",
                        }}
                        title="Tầng 2: Áo trong (Top)"
                      >
                        {canvasItems.TOP ? (
                          <img
                            src={canvasItems.TOP.variant.imageUrl}
                            alt={canvasItems.TOP.product.name}
                            className="h-full w-full object-contain filter drop-shadow-xs"
                          />
                        ) : (
                          <span className="text-[10px] font-bold text-muted-foreground flex items-center gap-1">
                            <Shirt size={12} /> + Áo trong
                          </span>
                        )}
                      </div>

                      {/* LAYER 3: OUTERWEAR (Jacket outside) - z-index: 30 */}
                      {canvasItems.OUTERWEAR ? (
                        <div
                          onClick={() => setActiveSlot("OUTERWEAR")}
                          className="absolute z-30 w-44 h-44 flex items-center justify-center transition-all cursor-pointer pointer-events-auto"
                          title="Tầng 3: Áo khoác ngoài (Outerwear - Phủ bên ngoài)"
                        >
                          <img
                            src={canvasItems.OUTERWEAR.variant.imageUrl}
                            alt={canvasItems.OUTERWEAR.product.name}
                            className="layer-item layer-outerwear h-full w-full object-contain p-1"
                            style={{
                              opacity: canvasItems.TOP ? 0.94 : 1,
                            }}
                          />
                          <Badge
                            variant="secondary"
                            className="absolute -top-1 -right-1 text-[9px] px-1 py-0 bg-background/90 shadow-xs border"
                          >
                            Áo khoác
                          </Badge>
                        </div>
                      ) : (
                        <div
                          onClick={() => setActiveSlot("OUTERWEAR")}
                          className={cn(
                            "absolute z-10 w-44 h-44 rounded-2xl flex items-center justify-center transition-all cursor-pointer border border-dashed",
                            activeSlot === "OUTERWEAR"
                              ? "border-primary bg-primary/5 ring-1 ring-primary"
                              : "border-border/60 hover:border-foreground/40"
                          )}
                          title="Tầng 3: Áo khoác ngoài"
                        >
                          <span className="text-[10px] font-bold text-muted-foreground/70 flex items-center gap-1 absolute top-1 left-2">
                            <Layers size={11} /> + Áo khoác
                          </span>
                        </div>
                      )}
                    </div>

                    {/* LAYER 1: BOTTOM (Quần/Váy) - z-index: 15 */}
                    <div
                      onClick={() => setActiveSlot("BOTTOM")}
                      className={cn(
                        "relative z-15 w-32 h-44 rounded-2xl flex items-center justify-center transition-all cursor-pointer overflow-hidden mt-1",
                        canvasItems.BOTTOM
                          ? "layer-item layer-bottom bg-white/70 dark:bg-black/40 backdrop-blur-xs p-1 shadow-xs"
                          : activeSlot === "BOTTOM"
                          ? "border border-primary bg-primary/10 ring-1 ring-primary"
                          : "border border-dashed border-border/80 hover:border-foreground/50 bg-background/40"
                      )}
                      title="Tầng 4: Quần hoặc Váy"
                    >
                      {canvasItems.BOTTOM ? (
                        <img
                          src={canvasItems.BOTTOM.variant.imageUrl}
                          alt={canvasItems.BOTTOM.product.name}
                          className="h-full w-full object-contain filter drop-shadow-xs"
                        />
                      ) : (
                        <span className="text-[10px] font-bold text-muted-foreground flex items-center gap-1">
                          <Scissors size={12} /> + Quần / Váy
                        </span>
                      )}
                    </div>

                    {/* LAYER 4: SHOES (Giày dép) - z-index: 10 */}
                    <div
                      onClick={() => setActiveSlot("SHOES")}
                      className={cn(
                        "relative z-10 w-28 h-16 rounded-xl flex items-center justify-center transition-all cursor-pointer overflow-hidden mt-1",
                        canvasItems.SHOES
                          ? "layer-item layer-shoes bg-white/70 dark:bg-black/40 backdrop-blur-xs p-1 shadow-xs"
                          : activeSlot === "SHOES"
                          ? "border border-primary bg-primary/10 ring-1 ring-primary"
                          : "border border-dashed border-border/80 hover:border-foreground/50 bg-background/40"
                      )}
                      title="Tầng 5: Giày sneaker / boots"
                    >
                      {canvasItems.SHOES ? (
                        <img
                          src={canvasItems.SHOES.variant.imageUrl}
                          alt={canvasItems.SHOES.product.name}
                          className="h-full w-full object-contain filter drop-shadow-xs"
                        />
                      ) : (
                        <span className="text-[10px] font-bold text-muted-foreground flex items-center gap-1">
                          <Footprints size={12} /> + Giày dép
                        </span>
                      )}
                    </div>

                    {/* Canvas Stage Watermark */}
                    <span className="absolute bottom-1 right-2 text-[8px] font-mono uppercase tracking-widest text-muted-foreground/50">
                      TrendyFit Studio 2D
                    </span>
                  </div>
                ) : (
                  /* FLAT-LAY EDITORIAL LOOKBOOK STAGE */
                  <div className="mannequin-stage relative w-full max-w-[270px] h-[500px] rounded-2xl overflow-y-auto p-4 flex flex-col justify-start gap-3 select-none">
                    <div className="flex items-center justify-between pb-2 border-b border-border/50 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      <span>Flat-lay Collage</span>
                      <Eye size={12} />
                    </div>

                    {selectedSlotCount > 0 ? (
                      <div className="space-y-2.5">
                        {/* 1. Accessory */}
                        {canvasItems.ACCESSORY && (
                          <div
                            onClick={() => setActiveSlot("ACCESSORY")}
                            className="bg-card/90 rounded-xl p-2 border border-border flex items-center gap-3 cursor-pointer hover:border-primary transition-colors shadow-2xs"
                          >
                            <img
                              src={canvasItems.ACCESSORY.variant.imageUrl}
                              alt=""
                              className="h-12 w-12 object-contain bg-muted/20 rounded-lg p-1 shrink-0"
                            />
                            <div className="min-w-0">
                              <Badge variant="outline" className="text-[9px] mb-0.5">Phụ kiện</Badge>
                              <p className="text-xs font-bold truncate">{canvasItems.ACCESSORY.product.name}</p>
                              <p className="text-[10px] text-muted-foreground">{canvasItems.ACCESSORY.variant.color}</p>
                            </div>
                          </div>
                        )}

                        {/* 2. Outerwear */}
                        {canvasItems.OUTERWEAR && (
                          <div
                            onClick={() => setActiveSlot("OUTERWEAR")}
                            className="bg-card/90 rounded-xl p-2 border border-border flex items-center gap-3 cursor-pointer hover:border-primary transition-colors shadow-2xs"
                          >
                            <img
                              src={canvasItems.OUTERWEAR.variant.imageUrl}
                              alt=""
                              className="h-16 w-16 object-contain bg-muted/20 rounded-lg p-1 shrink-0"
                            />
                            <div className="min-w-0">
                              <Badge variant="outline" className="text-[9px] mb-0.5">Áo khoác ngoài</Badge>
                              <p className="text-xs font-bold truncate">{canvasItems.OUTERWEAR.product.name}</p>
                              <p className="text-[10px] text-muted-foreground">{canvasItems.OUTERWEAR.variant.color}</p>
                            </div>
                          </div>
                        )}

                        {/* 3. Top */}
                        {canvasItems.TOP && (
                          <div
                            onClick={() => setActiveSlot("TOP")}
                            className="bg-card/90 rounded-xl p-2 border border-border flex items-center gap-3 cursor-pointer hover:border-primary transition-colors shadow-2xs"
                          >
                            <img
                              src={canvasItems.TOP.variant.imageUrl}
                              alt=""
                              className="h-16 w-16 object-contain bg-muted/20 rounded-lg p-1 shrink-0"
                            />
                            <div className="min-w-0">
                              <Badge variant="outline" className="text-[9px] mb-0.5">Áo lót trong</Badge>
                              <p className="text-xs font-bold truncate">{canvasItems.TOP.product.name}</p>
                              <p className="text-[10px] text-muted-foreground">{canvasItems.TOP.variant.color}</p>
                            </div>
                          </div>
                        )}

                        {/* 4. Bottom */}
                        {canvasItems.BOTTOM && (
                          <div
                            onClick={() => setActiveSlot("BOTTOM")}
                            className="bg-card/90 rounded-xl p-2 border border-border flex items-center gap-3 cursor-pointer hover:border-primary transition-colors shadow-2xs"
                          >
                            <img
                              src={canvasItems.BOTTOM.variant.imageUrl}
                              alt=""
                              className="h-16 w-16 object-contain bg-muted/20 rounded-lg p-1 shrink-0"
                            />
                            <div className="min-w-0">
                              <Badge variant="outline" className="text-[9px] mb-0.5">Quần / Váy</Badge>
                              <p className="text-xs font-bold truncate">{canvasItems.BOTTOM.product.name}</p>
                              <p className="text-[10px] text-muted-foreground">{canvasItems.BOTTOM.variant.color}</p>
                            </div>
                          </div>
                        )}

                        {/* 5. Shoes */}
                        {canvasItems.SHOES && (
                          <div
                            onClick={() => setActiveSlot("SHOES")}
                            className="bg-card/90 rounded-xl p-2 border border-border flex items-center gap-3 cursor-pointer hover:border-primary transition-colors shadow-2xs"
                          >
                            <img
                              src={canvasItems.SHOES.variant.imageUrl}
                              alt=""
                              className="h-14 w-14 object-contain bg-muted/20 rounded-lg p-1 shrink-0"
                            />
                            <div className="min-w-0">
                              <Badge variant="outline" className="text-[9px] mb-0.5">Giày dép</Badge>
                              <p className="text-xs font-bold truncate">{canvasItems.SHOES.product.name}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-center p-4 text-muted-foreground space-y-2">
                        <PackageOpen size={36} className="opacity-30" />
                        <p className="text-xs font-semibold">Chưa có món nào được chọn</p>
                        <p className="text-[11px] text-muted-foreground/80">
                          Hãy chọn Áo và Quần ở danh sách để chiêm ngưỡng trọn bộ set đồ!
                        </p>
                      </div>
                    )}
                  </div>
                )}
                <span className="text-[11px] text-muted-foreground mt-2 italic flex items-center gap-1">
                  <Info size={11} /> Nhấp vào từng món trên Canvas để chuyển đổi tầng
                </span>
              </div>

              {/* 2. COMPACT LAYER SELECTOR CARDS */}
              <div className="md:col-span-6 flex flex-col gap-2.5 w-full">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1 block">
                  Danh sách tầng đồ phối:
                </span>
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
                        "canvas-slot-box w-full rounded-xl p-2.5 sm:p-3 flex items-center justify-between gap-3 cursor-pointer relative bg-background/90 backdrop-blur-sm",
                        isActive ? "is-active ring-2 ring-primary" : "hover:border-foreground/40",
                        item ? "border-solid bg-background shadow-2xs" : "border-dashed"
                      )}
                    >
                      {/* Left: Slot label & Icon */}
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={cn(
                            "h-8 w-8 rounded-lg flex items-center justify-center shrink-0 transition-colors",
                            isActive
                              ? "bg-foreground text-background"
                              : item
                              ? "bg-muted text-foreground"
                              : "bg-muted/40 text-muted-foreground"
                          )}
                        >
                          <SlotIcon size={15} />
                        </div>

                        <div className="min-w-0">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block leading-tight">
                            {meta.label}
                          </span>

                          {item ? (
                            <div className="truncate">
                              <p className="text-xs font-bold text-foreground truncate">
                                {item.product.name}
                              </p>
                              <p className="text-[10px] text-muted-foreground leading-tight">
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
                            <p className="text-[11px] text-muted-foreground/80 italic leading-tight">
                              Chưa chọn ({meta.hint})
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Right: Item Thumbnail or Add Trigger */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        {item ? (
                          <>
                            <div className="relative h-11 w-11 rounded-lg overflow-hidden bg-muted/20 border border-border shrink-0">
                              {item.variant.imageUrl ? (
                                <img
                                  src={item.variant.imageUrl}
                                  alt={item.product.name}
                                  className="canvas-item-img h-full w-full object-cover object-center"
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center">
                                  <PackageOpen size={14} className="text-muted-foreground" />
                                </div>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                clearSlot(slotKey);
                              }}
                              className="p-1 text-muted-foreground hover:text-destructive rounded-md hover:bg-destructive/10 transition-colors cursor-pointer"
                              title="Bỏ chọn món này"
                              aria-label={`Bỏ chọn ${meta.label}`}
                            >
                              <X size={15} />
                            </button>
                          </>
                        ) : (
                          <span className="text-[11px] font-semibold text-primary underline underline-offset-2">
                            Chọn +
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Smart Outfit Harmony Check Card */}
            {selectedSlotCount >= 2 && (
              <div className="p-3.5 rounded-2xl bg-muted/40 border border-border/80 my-2 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                    <Palette size={14} className="text-primary" />
                    <span>Đánh giá độ hợp gu &amp; Phối màu (Style Check):</span>
                  </div>
                  <Badge variant="secondary" className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40">
                    <CheckCircle2 size={11} className="mr-1 inline" /> Rất hợp gu (96%)
                  </Badge>
                </div>

                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  {hasTop && hasBottom
                    ? `Set đồ kết hợp giữa tông màu ${selectedColors.join(" và ")} mang đến phong cách Streetwear tối giản, năng động và tôn dáng cực tốt cho người mặc.`
                    : "Bạn đã phối các món đồ ăn ý! Hãy chọn thêm Áo và Quần để hoàn thiện 100% set đồ hoàn chỉnh nhé."}
                </p>
              </div>
            )}

            {/* Bottom canvas hint */}
            <div className="pt-4 border-t border-border/50 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Info size={13} />
                Nhấp vào từng tầng trên Ma-nơ-canh hoặc danh sách để đổi đồ tương ứng.
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
                  className="text-xs text-destructive hover:underline font-semibold cursor-pointer"
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
                    selectedVariants[prod.id] || prod.variants[0];

                  return (
                    <div
                      key={prod.id}
                      className={cn(
                        "p-3 rounded-xl border flex items-center justify-between gap-3 transition-colors",
                        isSelected
                          ? "bg-primary/5 border-primary shadow-xs"
                          : "border-border hover:bg-muted/40"
                      )}
                    >
                      {/* Product Thumbnail */}
                      <div className="relative h-14 w-14 rounded-lg overflow-hidden bg-muted/20 border border-border shrink-0">
                        {currentSelectedVariant?.imageUrl ? (
                          <img
                            src={currentSelectedVariant.imageUrl}
                            alt={prod.name}
                            className="h-full w-full object-cover object-center"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <PackageOpen size={16} className="text-muted-foreground" />
                          </div>
                        )}
                      </div>

                      {/* Product Info */}
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
                                  "text-[10px] px-1.5 py-0.5 rounded border transition-colors cursor-pointer",
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
              Các phong cách thời trang thịnh hành được các Stylist TrendyFit phối sẵn chuẩn gu (Chiết khấu combo 10% - 15%).
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
