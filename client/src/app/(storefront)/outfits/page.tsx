"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { useOutfits } from "./hooks/use-outfits";
import {
  Combo,
  ComboItem,
  outfitSlotNames,
} from "./validation/outfits.validation";
import { formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Layers,
  Shirt,
  Scissors,
  Footprints,
  Sparkles,
  ShoppingBag,
  Check,
  RefreshCw,
  AlertCircle,
  Tag,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import "./style/outfits.css";

const SLOT_ICONS = {
  TOP: Shirt,
  BOTTOM: Scissors,
  OUTERWEAR: Layers,
  SHOES: Footprints,
  ACCESSORY: Sparkles,
};

export default function CombosPage() {
  const {
    combos,
    selectedComboId,
    setSelectedComboId,
    activeCombo,
    clothingItems,
    accessoryItems,
    selectedVariants,
    selectedAccessories,
    handleSelectVariant,
    handleToggleAccessory,
    pricing,
    addComboToCart,
    isAddingToCart,
    isLoading,
    isError,
    error,
    refetch,
  } = useOutfits();

  // 1. Loading Skeleton State
  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
        <div className="space-y-4 mb-8">
          <Skeleton className="h-6 w-52 rounded-full" />
          <Skeleton className="h-10 w-96 rounded-xl" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-6">
            <Skeleton className="h-[550px] w-full rounded-3xl" />
          </div>
          <div className="lg:col-span-6 space-y-4">
            <Skeleton className="h-24 w-full rounded-2xl" />
            <Skeleton className="h-44 w-full rounded-2xl" />
            <Skeleton className="h-40 w-full rounded-2xl" />
            <Skeleton className="h-28 w-full rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  // 2. Error State
  if (isError || !activeCombo) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-rose-100 text-rose-600 mb-4">
          <AlertCircle size={32} />
        </div>
        <h1 className="text-xl font-bold text-slate-900">Không thể tải Combo thời trang</h1>
        <p className="text-sm text-slate-600 mt-2 mb-6">
          {error || "Đã xảy ra lỗi khi tải danh sách các set phối đồ combo. Vui lòng thử lại."}
        </p>
        <Button
          onClick={() => refetch()}
          className="gap-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold"
        >
          <RefreshCw size={16} />
          Thử lại
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/60 pb-20">
      {/* 1. Header Section */}
      <div className="bg-white border-b border-slate-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/20 text-slate-900 text-xs font-black tracking-wide border border-primary/30 shadow-xs">
                <Sparkles size={13} className="text-slate-900" />
                MUA THEO COMBO — TIẾT KIỆM NGAY {pricing.discountPercent}%
              </div>
              <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-slate-900">
                Combo & Set Đồ Phối Sẵn
              </h1>
              <p className="text-sm sm:text-base text-slate-600 max-w-2xl font-medium">
                1 Combo cứng giá rẻ hơn mua lẻ từng món, chỉ bao gồm quần áo. Giày dép, kính, mũ nón... là phụ kiện phối kèm tùy chọn và không tính vào giá gói combo.
              </p>
            </div>

            <div className="flex items-center gap-2 self-start md:self-auto text-xs font-bold text-slate-700 bg-slate-100 px-3.5 py-2 rounded-xl border border-slate-200">
              <Tag size={15} className="text-slate-900" />
              <span>Đang mở bán: <strong>{combos.length}</strong> Combo độc quyền</span>
            </div>
          </div>

          {/* 2. Combo Selection Tabs */}
          <div className="mt-8">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
              Chọn phong cách Combo:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {combos.map((combo: Combo) => {
                const isSelected = combo.id === selectedComboId;
                return (
                  <button
                    key={combo.id}
                    onClick={() => setSelectedComboId(combo.id)}
                    className={`flex items-center justify-between p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? "border-slate-900 bg-white ring-2 ring-slate-900/10 shadow-md"
                        : "border-slate-200 bg-white/70 hover:bg-white hover:border-slate-300"
                    }`}
                  >
                    <div className="min-w-0 pr-3">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="font-bold text-slate-900 text-sm truncate">
                          {combo.title}
                        </span>
                        {isSelected && (
                          <span className="flex h-4 w-4 items-center justify-center rounded-full bg-slate-900 text-primary shrink-0">
                            <Check size={10} strokeWidth={3} />
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 line-clamp-1 font-medium">
                        {combo.description}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs font-black text-slate-900">
                          {formatPrice(combo.comboPrice)}
                        </span>
                        <span className="text-[11px] text-slate-400 line-through">
                          {formatPrice(combo.originalPrice)}
                        </span>
                      </div>
                    </div>
                    <Badge className="bg-primary text-primary-foreground font-black text-[10px] shrink-0 hover:bg-primary border-none">
                      -{combo.discountPercent || 15}%
                    </Badge>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Main Combo Configurator */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* CỘT TRÁI: Trực quan hóa Visual Showcase của Combo */}
          <div className="lg:col-span-5 space-y-4 lg:sticky lg:top-24">
            <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs overflow-hidden">
              <div className="relative aspect-[3/4] w-full rounded-2xl overflow-hidden bg-slate-100 flex items-center justify-center">
                {activeCombo.bannerUrl ? (
                  <Image
                    src={activeCombo.bannerUrl}
                    alt={activeCombo.title}
                    fill
                    className="object-cover transition-transform duration-500 hover:scale-105"
                    sizes="(max-width: 1024px) 100vw, 40vw"
                    priority
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-slate-400">
                    <Layers size={48} className="mb-2" />
                    <span className="text-xs font-semibold">Ảnh set phối đồ</span>
                  </div>
                )}

                {/* Floating Discount Badge */}
                <div className="absolute top-4 left-4">
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/90 backdrop-blur-md text-white text-xs font-black shadow-lg">
                    <Tag size={13} className="text-primary" />
                    <span>GÓI COMBO -{pricing.discountPercent}%</span>
                  </div>
                </div>

                {/* Savings Pill */}
                <div className="absolute bottom-4 left-4 right-4">
                  <div className="p-3 rounded-xl bg-white/95 backdrop-blur-md border border-slate-200 shadow-md flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        Ưu đãi gói quần áo
                      </p>
                      <p className="text-xs font-black text-slate-900">
                        Tiết kiệm ngay {formatPrice(pricing.clothingSavedAmount)}
                      </p>
                    </div>
                    <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300">
                      Rẻ hơn mua lẻ
                    </span>
                  </div>
                </div>
              </div>

              {/* Tag preview items in combo */}
              <div className="mt-4 pt-4 border-t border-slate-100">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5">
                  Các món có trong set phong cách:
                </p>
                <div className="flex flex-wrap gap-2">
                  {clothingItems.map((item) => (
                    <span
                      key={item.id}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-800 border border-slate-300"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-900" />
                      {item.productName || item.product?.name}
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-200 text-slate-700">
                        Combo
                      </span>
                    </span>
                  ))}
                  {accessoryItems.map((item) => {
                    const isChecked = Boolean(selectedAccessories[item.id]);
                    return (
                      <span
                        key={item.id}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border transition-colors ${
                          isChecked
                            ? "bg-amber-50 text-amber-900 border-amber-300 shadow-xs"
                            : "bg-slate-50 text-slate-400 border-slate-200 line-through opacity-60"
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${isChecked ? "bg-amber-600" : "bg-slate-300"}`} />
                        {item.productName || item.product?.name}
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${isChecked ? "bg-amber-100 text-amber-800" : "bg-slate-200 text-slate-500"}`}>
                          Phụ kiện {isChecked ? "✓ Đã chọn" : "+ Chưa chọn"}
                        </span>
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Value Guarantees */}
            <div className="grid grid-cols-2 gap-3 text-xs text-slate-600 font-medium">
              <div className="p-3 rounded-2xl bg-white border border-slate-200 flex items-center gap-2">
                <ShieldCheck size={16} className="text-emerald-700 shrink-0" />
                <span>Cam kết chính hãng & phối chuẩn form</span>
              </div>
              <div className="p-3 rounded-2xl bg-white border border-slate-200 flex items-center gap-2">
                <CheckCircle2 size={16} className="text-primary-foreground shrink-0" />
                <span>Hỗ trợ đổi size từng món trong 7 ngày</span>
              </div>
            </div>
          </div>

          {/* CỘT PHẢI: Tùy chỉnh kích thước, màu sắc & phụ kiện */}
          <div className="lg:col-span-7 space-y-6">
            {/* Title & Description of Current Combo */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Combo đang chọn
                </span>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-primary/20 text-slate-900 border border-primary/30">
                  Giá ưu đãi cố định
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                {activeCombo.title}
              </h2>
              <p className="text-sm text-slate-600 font-medium leading-relaxed">
                {activeCombo.description}
              </p>
            </div>

            {/* PHẦN 1: QUẦN ÁO TRONG COMBO (GIÁ CỨNG ƯU ĐÃI) */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
                    <Shirt size={18} className="text-slate-900" />
                    1. Quần áo trong Combo (Giá gói cố định)
                  </h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Tùy chọn kích cỡ và màu sắc phù hợp với bạn trước khi thêm vào giỏ.
                  </p>
                </div>
                <Badge className="bg-slate-900 text-white font-bold text-xs">
                  {clothingItems.length} Món
                </Badge>
              </div>

              <div className="space-y-4">
                {clothingItems.map((item: ComboItem) => {
                  const SlotIcon = SLOT_ICONS[item.slotType] || Shirt;
                  const slotMeta = outfitSlotNames[item.slotType] || { label: "Quần áo" };
                  const currentVariant = selectedVariants[item.id] || item.defaultVariant;
                  const allVariants = item.product?.allVariants || [];
                  const basePrice = Number(item.product?.basePrice ?? item.price ?? 0);
                  const priceAdj = Number(currentVariant?.priceAdjustment || 0);
                  const itemUnitPrice = basePrice + priceAdj;

                  // Unique available sizes
                  const uniqueSizes = Array.from(
                    new Set(allVariants.map((v) => v.size).filter(Boolean))
                  );

                  return (
                    <div
                      key={item.id}
                      className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition space-y-3"
                    >
                      <div className="flex items-start gap-3">
                        <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-white border border-slate-200 shrink-0">
                          {currentVariant?.imageUrl || item.imageUrl ? (
                            <Image
                              src={currentVariant?.imageUrl || item.imageUrl}
                              alt={item.productName}
                              fill
                              className="object-cover"
                              sizes="64px"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-slate-400">
                              <SlotIcon size={20} />
                            </div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-slate-200 text-slate-800">
                              {slotMeta.label}
                            </span>
                            <span className="text-xs text-slate-500">
                              SKU: {currentVariant?.sku || item.sku}
                            </span>
                          </div>
                          <h4 className="font-bold text-slate-900 text-sm truncate">
                            {item.productName || item.product?.name}
                          </h4>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs font-bold text-slate-700">
                              Giá gốc lẻ: {formatPrice(itemUnitPrice)}
                            </span>
                            <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300">
                              Đã bao gồm trong Combo
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Variant Size Picker */}
                      {uniqueSizes.length > 0 && (
                        <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-700">Chọn kích cỡ (Size):</span>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {uniqueSizes.map((size) => {
                              const isSizeActive = currentVariant?.size === size;
                              const matchingVariant = allVariants.find((v) => v.size === size);
                              return (
                                <button
                                  key={size}
                                  type="button"
                                  onClick={() => {
                                    if (matchingVariant) {
                                      handleSelectVariant(item.id, matchingVariant);
                                    }
                                  }}
                                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                    isSizeActive
                                      ? "bg-slate-900 text-white shadow-xs"
                                      : "bg-white text-slate-800 border border-slate-300 hover:border-slate-400"
                                  }`}
                                >
                                  {size}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Subtotal clothing combo summary */}
              <div className="p-4 rounded-2xl bg-slate-100 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-medium text-slate-600">
                    Giá mua lẻ từng món: <span className="line-through">{formatPrice(pricing.clothingOriginalPrice)}</span>
                  </p>
                  <p className="text-xs font-bold text-slate-800 mt-0.5">
                    Giá trọn gói Combo Quần Áo:{" "}
                    <strong className="text-base text-slate-950 font-black">
                      {formatPrice(pricing.clothingComboPrice)}
                    </strong>
                  </p>
                </div>
                <div className="text-right sm:self-auto self-start">
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 text-xs font-black">
                    Tiết kiệm {formatPrice(pricing.clothingSavedAmount)}
                  </span>
                </div>
              </div>
            </div>

            {/* PHẦN 2: PHỤ KIỆN PHỐI KÈM (GIÀY, KÍNH, NÓN... - BÁN LẺ RIÊNG, KHÔNG TÍNH VÀO COMBO) */}
            {accessoryItems.length > 0 && (
              <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div>
                    <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
                      <Footprints size={18} className="text-amber-700" />
                      2. Phụ kiện phối kèm (Không tính vào Combo)
                    </h3>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                      Giày dép, nón, kính là phụ kiện độc lập, bán lẻ theo giá niêm yết riêng nếu bạn muốn mua trọn bộ.
                    </p>
                  </div>
                  <Badge variant="outline" className="text-amber-800 border-amber-300 bg-amber-50 font-bold text-xs">
                    Tùy chọn thêm
                  </Badge>
                </div>

                <div className="space-y-3">
                  {accessoryItems.map((item: ComboItem) => {
                    const isChecked = Boolean(selectedAccessories[item.id]);
                    const currentVariant = selectedVariants[item.id] || item.defaultVariant;
                    const allVariants = item.product?.allVariants || [];
                    const basePrice = Number(item.product?.basePrice ?? item.price ?? 0);
                    const priceAdj = Number(currentVariant?.priceAdjustment || 0);
                    const itemUnitPrice = basePrice + priceAdj;

                    const uniqueSizes = Array.from(
                      new Set(allVariants.map((v) => v.size).filter(Boolean))
                    );

                    return (
                      <div
                        key={item.id}
                        onClick={() => handleToggleAccessory(item.id)}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer select-none ${
                          isChecked
                            ? "border-slate-900 bg-white shadow-sm ring-1 ring-slate-900/10"
                            : "border-slate-200 bg-slate-50/50 hover:bg-white hover:border-slate-300 opacity-80"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            {/* Explicit Custom Checkbox with SVG Check icon */}
                            <button
                              type="button"
                              role="checkbox"
                              aria-checked={isChecked}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleAccessory(item.id);
                              }}
                              className={`h-5 w-5 rounded-md border flex items-center justify-center transition-all cursor-pointer shrink-0 ${
                                isChecked
                                  ? "bg-slate-900 border-slate-900 text-primary shadow-xs"
                                  : "bg-white border-slate-300 hover:border-slate-400"
                              }`}
                            >
                              {isChecked && <Check size={13} strokeWidth={3.5} />}
                            </button>

                            <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                              {currentVariant?.imageUrl || item.imageUrl ? (
                                <Image
                                  src={currentVariant?.imageUrl || item.imageUrl}
                                  alt={item.productName}
                                  fill
                                  className="object-cover"
                                  sizes="48px"
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center text-slate-400">
                                  <Footprints size={18} />
                                </div>
                              )}
                            </div>

                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <h4 className="font-bold text-slate-900 text-sm truncate">
                                  {item.productName || item.product?.name}
                                </h4>
                                <span
                                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border transition-colors ${
                                    isChecked
                                      ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                                      : "bg-slate-100 text-slate-600 border-slate-200"
                                  }`}
                                >
                                  {isChecked ? "✓ Đã chọn mua kèm" : "+ Tùy chọn mua kèm"}
                                </span>
                              </div>
                              <p className="text-xs text-slate-500 font-medium mt-0.5">
                                Phụ kiện phối kèm • {formatPrice(itemUnitPrice)}
                              </p>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <span className={`font-black text-sm transition-colors ${isChecked ? "text-slate-900" : "text-slate-400"}`}>
                              +{formatPrice(itemUnitPrice)}
                            </span>
                          </div>
                        </div>

                        {/* If checked and size selector exists */}
                        {isChecked && uniqueSizes.length > 0 && (
                          <div
                            className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <span className="text-xs font-semibold text-slate-600">
                              Chọn size phụ kiện:
                            </span>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {uniqueSizes.map((size) => {
                                const isSizeActive = currentVariant?.size === size;
                                const matchingVariant = allVariants.find((v) => v.size === size);
                                return (
                                  <button
                                    key={size}
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (matchingVariant) {
                                        handleSelectVariant(item.id, matchingVariant);
                                      }
                                    }}
                                    className={`px-2.5 py-0.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                      isSizeActive
                                        ? "bg-slate-900 text-white"
                                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                                    }`}
                                  >
                                    {size}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* PHẦN 3: TỔNG KẾT THANH TOÁN & THÊM VÀO GIỎ HÀNG */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-md space-y-5">
              <h3 className="font-black text-slate-900 text-base">
                Tổng kết đơn hàng Combo
              </h3>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-slate-600">
                  <span>Combo Quần Áo ({clothingItems.length} món ưu đãi):</span>
                  <span className="font-bold text-slate-900">
                    {formatPrice(pricing.clothingComboPrice)}
                  </span>
                </div>
                {pricing.selectedAccessoriesCount > 0 ? (
                  <div className="flex justify-between text-slate-600">
                    <span>
                      Phụ kiện phối kèm ({pricing.selectedAccessoriesCount} món tính giá lẻ):
                    </span>
                    <span className="font-bold text-slate-900">
                      +{formatPrice(pricing.selectedAccessoriesPrice)}
                    </span>
                  </div>
                ) : (
                  <div className="flex justify-between text-slate-400 text-xs italic">
                    <span>Phụ kiện phối kèm:</span>
                    <span>Không chọn phụ kiện</span>
                  </div>
                )}
                <div className="flex justify-between text-emerald-700 font-bold text-xs bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                  <span>Tổng tiền tiết kiệm được:</span>
                  <span>-{formatPrice(pricing.clothingSavedAmount)}</span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500">Tổng thanh toán dự kiến:</p>
                  <p className="text-2xl font-black text-slate-950">
                    {formatPrice(pricing.finalTotal)}
                  </p>
                </div>
                <div className="text-right text-xs text-slate-400 line-through">
                  Giá nếu mua lẻ: {formatPrice(pricing.regularTotalWithoutCombo)}
                </div>
              </div>

              {/* Add to Cart CTA */}
              <Button
                onClick={addComboToCart}
                disabled={isAddingToCart}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-black text-base py-6 rounded-2xl shadow-lg cursor-pointer transition-transform hover:scale-[1.01] active:scale-[0.99] gap-2"
              >
                {isAddingToCart ? (
                  <RefreshCw size={20} className="animate-spin" />
                ) : (
                  <ShoppingBag size={20} />
                )}
                {isAddingToCart ? "Đang thêm vào giỏ hàng..." : "Thêm trọn bộ Combo vào giỏ hàng"}
              </Button>

              <div className="text-center">
                <Link
                  href="/cart"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors"
                >
                  Xem giỏ hàng hiện tại
                  <ArrowRight size={13} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
