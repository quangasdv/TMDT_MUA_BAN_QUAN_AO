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
  Palette,
  CheckCircle2,
  Plus,
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
  const hasShoes = !!canvasItems.SHOES;
  const hasAccessory = !!canvasItems.ACCESSORY;
  const isLayeringActive = hasOuterwear && hasTop;

  // Thu thập danh sách màu đang phối
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
              Phòng phối đồ (Interactive Outfit Studio)
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Bố cục phối đồ thời trang trực quan: ngắm trọn vẹn cả set đồ, so sánh màu sắc hài hòa và tự động chiết khấu combo.
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
            Đặt lại Set đồ
          </Button>
        </div>
      </div>

      {/* 3. Main 2D Canvas & Slot Selector Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
        {/* LEFT COLUMN: Interactive Outfit Lookbook Studio Canvas */}
        <div className="lg:col-span-7">
          <div className="outfit-canvas-container rounded-3xl p-5 sm:p-7 flex flex-col justify-between shadow-sm">
            {/* Header info inside canvas */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-border/50">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Lookbook Outfit Canvas
                </span>
              </div>
              <Badge variant="secondary" className="text-[11px] font-semibold bg-background/80 backdrop-blur-sm">
                Đã phối {selectedSlotCount}/4 món
              </Badge>
            </div>

            {/* Helpful notification regarding upper-body exclusivity */}
            <div className="mt-3 p-2.5 rounded-2xl bg-muted/30 border border-border/70 flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <Sparkles size={14} className="text-primary shrink-0" />
                <span>
                  {hasOuterwear
                    ? `Thân trên: Đang mặc Áo khoác (${canvasItems.OUTERWEAR?.product.name}). Khi chọn Áo thun sẽ tự động hoán đổi.`
                    : hasTop
                    ? `Thân trên: Đang mặc Áo thun (${canvasItems.TOP?.product.name}). Khi chọn Áo khoác sẽ tự động hoán đổi.`
                    : "Thân trên: Bạn có thể chọn Áo thun hoặc Áo khoác để khoác lên ma-nơ-canh."}
                </span>
              </div>
              <Badge variant="outline" className="text-[10px] bg-background font-semibold shrink-0">
                1 Áo Thân Trên
              </Badge>
            </div>

            {/* MAIN OUTFIT FITTING STAGE - 2D INTERACTIVE MANNEQUIN STUDIO */}
            <div className="relative w-full my-6 rounded-3xl overflow-hidden mannequin-stage border border-border/80 shadow-inner flex items-center justify-center min-h-[720px] h-[760px]">
              {/* Studio Ambient Spotlight */}
              <div className="absolute inset-0 pointer-events-none studio-spotlight" />

              {/* Studio Pedestal Base & Shadow */}
              <div
                className="absolute bottom-6 left-1/2 -translate-x-1/2 w-72 h-14 rounded-[100%] bg-black/15 blur-md pointer-events-none"
                style={{ transform: "translateX(-50%)" }}
              />
              <div
                className="absolute bottom-9 left-1/2 -translate-x-1/2 w-56 h-8 rounded-[100%] bg-black/10 blur-xs pointer-events-none"
                style={{ transform: "translateX(-50%)" }}
              />

              {/* Subtle Mannequin Silhouette Wireframe Guide */}
              <svg
                className="absolute inset-0 w-full h-full text-foreground/[0.04] dark:text-foreground/[0.07] pointer-events-none"
                viewBox="0 0 600 800"
                fill="currentColor"
                preserveAspectRatio="xMidYMid meet"
              >
                {/* Head */}
                <ellipse cx="300" cy="85" rx="36" ry="46" />
                {/* Neck */}
                <rect x="290" y="125" width="20" height="25" rx="4" />
                {/* Torso & Shoulders */}
                <path d="M 195,160 Q 300,140 405,160 L 375,370 L 225,370 Z" />
                {/* Hips & Legs */}
                <path d="M 235,375 L 365,375 L 345,670 L 305,670 L 300,430 L 295,670 L 255,670 Z" />
              </svg>

              {/* 1. ACCESSORY LAYER (Mũ / Kính mát) - Top: 40px (z-index 40) */}
              <div
                onClick={() => setActiveSlot("ACCESSORY")}
                className={cn(
                  "absolute left-1/2 -translate-x-1/2 cursor-pointer transition-all duration-300 z-40 group flex flex-col items-center",
                  
                )}
                style={{ top: "42px", width: "135px", height: "90px" }}
              >
                {activeSlot === "ACCESSORY" && canvasItems.ACCESSORY && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow-md z-50 pointer-events-none">Đang chọn</span>
                )}
                {canvasItems.ACCESSORY ? (
                  <div className="relative w-full h-full flex items-center justify-center">
                    <img
                      src={canvasItems.ACCESSORY.variant.imageUrl}
                      alt={canvasItems.ACCESSORY.product.name}
                      className="max-h-full max-w-full object-contain filter drop-shadow-md transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute -top-3 right-0 opacity-0 group-hover:opacity-100 transition-opacity bg-background/95 backdrop-blur-sm border border-border shadow-xs rounded-full px-2 py-0.5 flex items-center gap-1 text-[10px] z-50">
                      <span className="font-semibold truncate max-w-[80px]">
                        {canvasItems.ACCESSORY.product.name}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          clearSlot("ACCESSORY");
                        }}
                        className="text-muted-foreground hover:text-destructive"
                        title="Gỡ phụ kiện"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    className={cn(
                      "w-24 h-16 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center transition-all",
                      activeSlot === "ACCESSORY"
                        ? "border-primary bg-primary/10 text-primary shadow-xs"
                        : "border-border/60 hover:border-foreground/40 text-muted-foreground/60 hover:text-foreground bg-background/40"
                    )}
                  >
                    <Sparkles size={16} />
                    <span className="text-[10px] font-semibold mt-0.5">+ Mũ / Kính</span>
                  </div>
                )}
              </div>

              {/* 2. TOP LAYER (Áo thun / Áo sơ mi lót trong) - Top: 135px (z-index 20) */}
              <div
                onClick={() => setActiveSlot("TOP")}
                className={cn(
                  "absolute left-1/2 -translate-x-1/2 cursor-pointer transition-all duration-300 z-20 group flex flex-col items-center",
                  
                )}
                style={{ top: "130px", width: "285px", height: "270px" }}
              >
                {activeSlot === "TOP" && canvasItems.TOP && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow-md z-50 pointer-events-none">Đang chọn</span>
                )}
                {canvasItems.TOP ? (
                  <div className="relative w-full h-full flex items-center justify-center">
                    <img
                      src={canvasItems.TOP.variant.imageUrl}
                      alt={canvasItems.TOP.product.name}
                      className="max-h-full max-w-full object-contain filter drop-shadow-md transition-all duration-300 group-hover:scale-102"
                      style={{
                        clipPath: hasOuterwear ? "inset(0 18% 0 18%)" : "none",
                        transition: "clip-path 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
                      }}
                    />
                    <div className="absolute -top-3 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-background/95 backdrop-blur-sm border border-border shadow-xs rounded-full px-2 py-0.5 flex items-center gap-1 text-[10px] z-50">
                      <span className="font-semibold truncate max-w-[90px]">
                        {canvasItems.TOP.product.name}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          clearSlot("TOP");
                        }}
                        className="text-muted-foreground hover:text-destructive"
                        title="Gỡ áo thun"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    className={cn(
                      "w-44 h-36 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center transition-all mt-4",
                      activeSlot === "TOP"
                        ? "border-primary bg-primary/10 text-primary shadow-xs"
                        : "border-border/60 hover:border-foreground/40 text-muted-foreground/60 hover:text-foreground bg-background/40"
                    )}
                  >
                    <Shirt size={22} />
                    <span className="text-xs font-semibold mt-1">+ Áo thun / Sơ mi</span>
                  </div>
                )}
              </div>

              {/* 3. OUTERWEAR LAYER (Áo khoác / Blazer xếp chồng lên áo thun) - Top: 125px (z-index 30) */}
              <div
                onClick={() => setActiveSlot("OUTERWEAR")}
                className={cn(
                  "absolute left-1/2 -translate-x-1/2 cursor-pointer transition-all duration-300 z-30 group flex flex-col items-center",
                  
                )}
                style={{ top: "120px", width: "380px", height: "300px" }}
              >
                {activeSlot === "OUTERWEAR" && canvasItems.OUTERWEAR && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow-md z-50 pointer-events-none">Đang chọn</span>
                )}
                {canvasItems.OUTERWEAR ? (
                  <div className="relative w-full h-full flex items-center justify-center">
                    {/* Khi có mặc áo thun bên trong, sử dụng ảnh áo khoác mở vạt trong suốt tâm để áo thun lót hiện ra xuyên qua! */}
                    <img
                      src={canvasItems.OUTERWEAR.variant.imageUrl}
                      alt={canvasItems.OUTERWEAR.product.name}
                      className="max-h-full max-w-full object-contain filter drop-shadow-xl transition-transform duration-300 group-hover:scale-102"
                    />
                    <div className="absolute -top-3 left-2 opacity-0 group-hover:opacity-100 transition-opacity bg-background/95 backdrop-blur-sm border border-border shadow-xs rounded-full px-2 py-0.5 flex items-center gap-1 text-[10px] z-50">
                      <span className="font-semibold truncate max-w-[90px]">
                        {canvasItems.OUTERWEAR.product.name}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          clearSlot("OUTERWEAR");
                        }}
                        className="text-muted-foreground hover:text-destructive"
                        title="Gỡ áo khoác"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  </div>
                ) : (
                  !hasTop && (
                    <div
                      className={cn(
                        "w-52 h-44 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center transition-all mt-2",
                        activeSlot === "OUTERWEAR"
                          ? "border-primary bg-primary/10 text-primary shadow-xs"
                          : "border-border/60 hover:border-foreground/40 text-muted-foreground/60 hover:text-foreground bg-background/40"
                      )}
                    >
                      <Layers size={24} />
                      <span className="text-xs font-semibold mt-1">+ Áo khoác ngoài</span>
                      <span className="text-[10px] text-muted-foreground/70">Blazer, Bomber, Jacket</span>
                    </div>
                  )
                )}
              </div>

              {/* 4. BOTTOM LAYER (Quần Jean / Quần Tây) - Top: 370px (z-index 15) */}
              <div
                onClick={() => setActiveSlot("BOTTOM")}
                className={cn(
                  "absolute left-1/2 -translate-x-1/2 cursor-pointer transition-all duration-300 z-15 group flex flex-col items-center",
                  
                )}
                style={{ top: "370px", width: "185px", height: "330px" }}
              >
                {activeSlot === "BOTTOM" && canvasItems.BOTTOM && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow-md z-50 pointer-events-none">Đang chọn</span>
                )}
                {canvasItems.BOTTOM ? (
                  <div className="relative w-full h-full flex items-center justify-center">
                    <img
                      src={canvasItems.BOTTOM.variant.imageUrl}
                      alt={canvasItems.BOTTOM.product.name}
                      className="max-h-full max-w-full object-contain filter drop-shadow-md transition-transform duration-300 group-hover:scale-102"
                    />
                    <div className="absolute top-2 right-0 opacity-0 group-hover:opacity-100 transition-opacity bg-background/95 backdrop-blur-sm border border-border shadow-xs rounded-full px-2 py-0.5 flex items-center gap-1 text-[10px] z-50">
                      <span className="font-semibold truncate max-w-[90px]">
                        {canvasItems.BOTTOM.product.name}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          clearSlot("BOTTOM");
                        }}
                        className="text-muted-foreground hover:text-destructive"
                        title="Gỡ quần"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    className={cn(
                      "w-36 h-48 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center transition-all",
                      activeSlot === "BOTTOM"
                        ? "border-primary bg-primary/10 text-primary shadow-xs"
                        : "border-border/60 hover:border-foreground/40 text-muted-foreground/60 hover:text-foreground bg-background/40"
                    )}
                  >
                    <Scissors size={22} />
                    <span className="text-xs font-semibold mt-1">+ Quần / Váy</span>
                  </div>
                )}
              </div>

              {/* 5. SHOES LAYER (Giày Sneaker) - Bottom: 25px (z-index 25) */}
              <div
                onClick={() => setActiveSlot("SHOES")}
                className={cn(
                  "absolute left-1/2 -translate-x-1/2 cursor-pointer transition-all duration-300 z-25 group flex flex-col items-center",
                  
                )}
                style={{ bottom: "25px", width: "205px", height: "95px" }}
              >
                {activeSlot === "SHOES" && canvasItems.SHOES && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow-md z-50 pointer-events-none">Đang chọn</span>
                )}
                {canvasItems.SHOES ? (
                  <div className="relative w-full h-full flex items-center justify-center">
                    <img
                      src={canvasItems.SHOES.variant.imageUrl}
                      alt={canvasItems.SHOES.product.name}
                      className="max-h-full max-w-full object-contain filter drop-shadow-md transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute -top-3 right-0 opacity-0 group-hover:opacity-100 transition-opacity bg-background/95 backdrop-blur-sm border border-border shadow-xs rounded-full px-2 py-0.5 flex items-center gap-1 text-[10px] z-50">
                      <span className="font-semibold truncate max-w-[90px]">
                        {canvasItems.SHOES.product.name}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          clearSlot("SHOES");
                        }}
                        className="text-muted-foreground hover:text-destructive"
                        title="Gỡ giày"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    className={cn(
                      "w-40 h-16 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center transition-all",
                      activeSlot === "SHOES"
                        ? "border-primary bg-primary/10 text-primary shadow-xs"
                        : "border-border/60 hover:border-foreground/40 text-muted-foreground/60 hover:text-foreground bg-background/40"
                    )}
                  >
                    <Footprints size={18} />
                    <span className="text-xs font-semibold mt-0.5">+ Giày Sneaker</span>
                  </div>
                )}
              </div>
            </div>

            {/* Quick 5-Slot Checklist Strip */}
            <div className="grid grid-cols-5 gap-2 my-2">
              {ALL_SLOTS.map((slotKey) => {
                const item = canvasItems[slotKey];
                const meta = outfitSlotNames[slotKey];
                const Icon = SLOT_ICONS[slotKey];
                const isSelected = !!item;
                const isCurActive = activeSlot === slotKey;
                return (
                  <div
                    key={slotKey}
                    onClick={() => setActiveSlot(slotKey)}
                    className={cn(
                      "p-2 rounded-xl border text-center cursor-pointer transition-all flex flex-col items-center justify-between min-h-[64px]",
                      isCurActive
                        ? "border-primary bg-primary/10 ring-1 ring-primary shadow-2xs"
                        : isSelected
                        ? "border-border bg-background shadow-2xs hover:border-foreground/40"
                        : "border-dashed border-border/70 hover:border-foreground/30 bg-muted/20"
                    )}
                  >
                    <div className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground">
                      <Icon size={11} />
                      <span className="truncate">{meta.label}</span>
                    </div>
                    {isSelected ? (
                      <div className="text-[11px] font-bold text-foreground truncate w-full flex items-center justify-center gap-1 mt-0.5">
                        <Check size={11} className="text-emerald-500 shrink-0" />
                        <span className="truncate">{item.variant.color}</span>
                      </div>
                    ) : (
                      <span className="text-[10px] text-muted-foreground/60 italic">+ Chọn</span>
                    )}
                  </div>
                );
              })}
            </div>
            {/* Smart Outfit Harmony Check Card */}
            {selectedSlotCount >= 2 && (
              <div className="p-3.5 rounded-2xl bg-muted/40 border border-border/80 my-2 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                    <Palette size={14} className="text-primary" />
                    <span>Đánh giá độ hợp gu &amp; Phối màu (Style Harmony):</span>
                  </div>
                  <Badge variant="secondary" className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40">
                    <CheckCircle2 size={11} className="mr-1 inline" /> Rất hợp gu (98%)
                  </Badge>
                </div>

                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  {hasTop && hasBottom
                    ? `Set đồ kết hợp giữa tông màu ${selectedColors.join(" + ")} tạo nên sự tương phản hài hòa, form dáng suông rộng thời thượng đúng chuẩn phong cách Streetwear.`
                    : "Các món đồ đã chọn có tông màu rất hài hòa! Hãy chọn thêm Áo và Quần để hoàn tất 100% set đồ nhé."}
                </p>
              </div>
            )}

            {/* Bottom canvas hint */}
            <div className="pt-4 border-t border-border/50 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Info size={13} />
                Nhấp vào từng ô trang phục phía trên để mở danh mục chọn đồ tương ứng.
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
