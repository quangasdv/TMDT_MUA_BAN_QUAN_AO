"use client";

import React, { useState, Suspense } from "react";
import { useProducts } from "./hooks/use-products";
import { ProductCard } from "@/components/storefront/product-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  Filter,
  X,
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  PackageOpen,
  Check,
  CheckCircle2,
  ArrowUpDown,
} from "lucide-react";
import "./style/products.css";

const COLOR_OPTIONS = [
  { label: "Đen", value: "Đen", colorCode: "#111827" },
  { label: "Trắng", value: "Trắng", colorCode: "#ffffff" },
  { label: "Xám", value: "Xám", colorCode: "#9ca3af" },
  { label: "Xanh", value: "Xanh", colorCode: "#3b82f6" },
  { label: "Be", value: "Be", colorCode: "#fef3c7" },
  { label: "Nâu", value: "Nâu", colorCode: "#78350f" },
];

const SIZE_OPTIONS = ["S", "M", "L", "XL", "XXL"];

const PRICE_PRESETS = [
  { label: "Dưới 200.000 ₫", min: "", max: "200000" },
  { label: "200.000 ₫ - 500.000 ₫", min: "200000", max: "500000" },
  { label: "500.000 ₫ - 1.000.000 ₫", min: "500000", max: "1000000" },
  { label: "Trên 1.000.000 ₫", min: "1000000", max: "" },
];

function ProductsCatalogContent() {
  const {
    categories,
    categoriesLoading,
    products,
    pagination,
    productsLoading,
    productsError,
    refetchProducts,
    filters,
    activeFiltersCount,
    setFilter,
    setPriceRange,
    setPage,
    resetFilters,
  } = useProducts();

  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [searchInput, setSearchInput] = useState(filters.q);
  const [customMin, setCustomMin] = useState("");
  const [customMax, setCustomMax] = useState("");

  const handleApplyCustomPrice = (e: React.FormEvent) => {
    e.preventDefault();
    setPriceRange(
      customMin ? String(customMin).trim() : undefined,
      customMax ? String(customMax).trim() : undefined
    );
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFilter("q", searchInput.trim() || undefined);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* 1. Page Header & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-border/70 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
            {filters.category
              ? categories.find((c) => c.slug === filters.category)?.name || "Bộ sưu tập thời trang"
              : "Tất cả sản phẩm"}
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            {productsLoading
              ? "Đang tải dữ liệu sản phẩm..."
              : `Hiển thị ${products.length} trong tổng số ${pagination.total} sản phẩm`}
          </p>
        </div>

        {/* Quick Search Form */}
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
          <Input
            type="search"
            placeholder="Tìm theo tên, chất liệu, mô tả..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="h-10 pr-10 text-sm bg-muted/30 border-slate-300 focus:bg-background"
          />
          <button
            type="submit"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
            aria-label="Tìm kiếm"
          >
            <Search size={16} />
          </button>
        </form>
      </div>

      {/* 2. Controls Bar: Active Filters Chips + Sort By Dropdown */}
      <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
        {/* Active Filter Badges */}
        <div className="flex items-center gap-2 flex-wrap min-h-[36px]">
          {activeFiltersCount > 0 && (
            <span className="text-xs font-semibold text-muted-foreground mr-1">
              Bộ lọc đang chọn:
            </span>
          )}

          {filters.q && (
            <Badge
              variant="secondary"
              className="gap-1.5 text-xs py-1 px-2.5 rounded-full bg-slate-100 text-slate-900 border border-slate-300 animate-in zoom-in-95 duration-150 group"
            >
              Từ khóa: &quot;{filters.q}&quot;
              <button
                type="button"
                onClick={() => {
                  setSearchInput("");
                  setFilter("q", undefined);
                }}
                className="hover:text-destructive group-hover:rotate-90 transition-transform cursor-pointer"
              >
                <X size={12} />
              </button>
            </Badge>
          )}

          {filters.category && (
            <Badge
              variant="secondary"
              className="gap-1.5 text-xs py-1 px-2.5 rounded-full bg-slate-100 text-slate-900 border border-slate-300 animate-in zoom-in-95 duration-150 group"
            >
              Danh mục: {categories.find((c) => c.slug === filters.category)?.name || filters.category}
              <button
                type="button"
                onClick={() => setFilter("category", undefined)}
                className="hover:text-destructive group-hover:rotate-90 transition-transform cursor-pointer"
              >
                <X size={12} />
              </button>
            </Badge>
          )}

          {(filters.minPrice || filters.maxPrice) && (
            <Badge
              variant="secondary"
              className="gap-1.5 text-xs py-1 px-2.5 rounded-full bg-slate-100 text-slate-900 border border-slate-300 animate-in zoom-in-95 duration-150 group"
            >
              Giá: {filters.minPrice ? `${Number(filters.minPrice).toLocaleString()} ₫` : "0"} -{" "}
              {filters.maxPrice ? `${Number(filters.maxPrice).toLocaleString()} ₫` : "Tối đa"}
              <button
                type="button"
                onClick={() => setPriceRange(undefined, undefined)}
                className="hover:text-destructive group-hover:rotate-90 transition-transform cursor-pointer"
              >
                <X size={12} />
              </button>
            </Badge>
          )}

          {filters.color && (
            <Badge
              variant="secondary"
              className="gap-1.5 text-xs py-1 px-2.5 rounded-full bg-slate-100 text-slate-900 border border-slate-300 animate-in zoom-in-95 duration-150 group"
            >
              Màu: {filters.color}
              <button
                type="button"
                onClick={() => setFilter("color", undefined)}
                className="hover:text-destructive group-hover:rotate-90 transition-transform cursor-pointer"
              >
                <X size={12} />
              </button>
            </Badge>
          )}

          {filters.size && (
            <Badge
              variant="secondary"
              className="gap-1.5 text-xs py-1 px-2.5 rounded-full bg-slate-100 text-slate-900 border border-slate-300 animate-in zoom-in-95 duration-150 group"
            >
              Size: {filters.size}
              <button
                type="button"
                onClick={() => setFilter("size", undefined)}
                className="hover:text-destructive group-hover:rotate-90 transition-transform cursor-pointer"
              >
                <X size={12} />
              </button>
            </Badge>
          )}

          {filters.inStock === "true" && (
            <Badge
              variant="secondary"
              className="gap-1.5 text-xs py-1 px-2.5 rounded-full bg-emerald-50 text-emerald-900 border border-emerald-300 animate-in zoom-in-95 duration-150 group"
            >
              Còn hàng trong kho
              <button
                type="button"
                onClick={() => setFilter("inStock", undefined)}
                className="hover:text-destructive group-hover:rotate-90 transition-transform cursor-pointer"
              >
                <X size={12} />
              </button>
            </Badge>
          )}

          {filters.sortBy && filters.sortBy !== "newest" && (
            <Badge
              variant="secondary"
              className="gap-1.5 text-xs py-1 px-2.5 rounded-full bg-purple-50 text-purple-900 border border-purple-300 animate-in zoom-in-95 duration-150 group"
            >
              Sắp xếp:{" "}
              {filters.sortBy === "price_asc"
                ? "Giá tăng dần"
                : filters.sortBy === "price_desc"
                ? "Giá giảm dần"
                : "Tên A-Z"}
              <button
                type="button"
                onClick={() => setFilter("sortBy", undefined)}
                className="hover:text-destructive group-hover:rotate-90 transition-transform cursor-pointer"
              >
                <X size={12} />
              </button>
            </Badge>
          )}

          {activeFiltersCount > 0 && (
            <button
              type="button"
              onClick={resetFilters}
              className="text-xs text-destructive hover:underline font-semibold ml-2 cursor-pointer"
            >
              Xóa tất cả
            </button>
          )}
        </div>

        {/* Right side controls: Sort By Selector & Mobile Filter Button */}
        <div className="flex items-center gap-3 ml-auto">
          {/* Sort By Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 whitespace-nowrap hidden sm:inline flex items-center gap-1">
              <ArrowUpDown size={13} />
              Sắp xếp:
            </span>
            <select
              value={filters.sortBy || "newest"}
              onChange={(e) => setFilter("sortBy", e.target.value)}
              className="h-9 rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary shadow-2xs cursor-pointer hover:border-slate-400 transition-all"
            >
              <option value="newest">Mới nhất</option>
              <option value="price_asc">Giá: Thấp đến Cao</option>
              <option value="price_desc">Giá: Cao đến Thấp</option>
              <option value="name_asc">Tên: A đến Z</option>
            </select>
          </div>

          {/* Mobile Filter Drawer Button */}
          <div className="lg:hidden">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
              className="gap-2 text-xs font-semibold border-slate-300"
            >
              <SlidersHorizontal size={14} />
              Bộ lọc {activeFiltersCount > 0 && `(${activeFiltersCount})`}
            </Button>
          </div>
        </div>
      </div>

      {/* 3. Main Layout: Sidebar & Products Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        {/* DESKTOP SIDEBAR FILTER */}
        <aside className="hidden lg:block filter-sidebar-sticky space-y-6 rounded-2xl border border-slate-200 bg-card p-5 shadow-xs">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h3 className="font-bold text-sm flex items-center gap-2 text-slate-900">
              <Filter size={16} className="text-primary" />
              Bộ lọc sản phẩm
            </h3>
            {activeFiltersCount > 0 && (
              <button
                type="button"
                onClick={resetFilters}
                className="text-xs text-muted-foreground hover:text-destructive font-medium cursor-pointer"
              >
                Làm mới
              </button>
            )}
          </div>

          {/* 1. Lọc theo Danh mục */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Danh mục
            </h4>
            <div className="space-y-1">
              <button
                type="button"
                onClick={() => setFilter("category", undefined)}
                className={cn(
                  "filter-btn-touch w-full text-left text-xs px-3 py-2 rounded-xl transition-all flex items-center justify-between cursor-pointer",
                  !filters.category
                    ? "bg-slate-900 text-white font-bold shadow-xs translate-x-1"
                    : "text-slate-700 hover:bg-slate-100 hover:text-slate-950 hover:translate-x-0.5"
                )}
              >
                <span className="flex items-center">
                  {!filters.category && (
                    <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block mr-2 accent-dot-pulse" />
                  )}
                  Tất cả danh mục
                </span>
                {!filters.category && <Check size={13} className="text-primary" />}
              </button>
              {categoriesLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-7 w-full rounded-xl my-1" />
                ))
              ) : (
                categories.map((cat) => {
                  const isSelected = filters.category === cat.slug;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setFilter("category", isSelected ? undefined : cat.slug)}
                      className={cn(
                        "filter-btn-touch w-full text-left text-xs px-3 py-2 rounded-xl transition-all flex items-center justify-between cursor-pointer",
                        isSelected
                          ? "bg-slate-900 text-white font-bold shadow-xs translate-x-1"
                          : "text-slate-700 hover:bg-slate-100 hover:text-slate-950 hover:translate-x-0.5"
                      )}
                    >
                      <span className="flex items-center truncate">
                        {isSelected && (
                          <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block mr-2 accent-dot-pulse" />
                        )}
                        {cat.name}
                      </span>
                      {isSelected && <Check size={13} className="text-primary shrink-0 ml-1" />}
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* 2. Lọc theo Khoảng giá */}
          <div className="space-y-2.5 border-t border-border pt-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Khoảng giá
            </h4>
            <div className="space-y-1.5">
              {PRICE_PRESETS.map((preset, idx) => {
                const isSelected =
                  filters.minPrice === preset.min && filters.maxPrice === preset.max;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      if (isSelected) {
                        setPriceRange(undefined, undefined);
                      } else {
                        setPriceRange(preset.min || undefined, preset.max || undefined);
                      }
                    }}
                    className={cn(
                      "filter-btn-touch w-full text-left text-xs px-3 py-2 rounded-xl border transition-all flex items-center justify-between cursor-pointer",
                      isSelected
                        ? "border-slate-900 bg-slate-900 text-white font-bold shadow-xs ring-1 ring-slate-900"
                        : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50 hover:translate-x-0.5"
                    )}
                  >
                    <span>{preset.label}</span>
                    {isSelected && <Check size={13} className="text-primary shrink-0" />}
                  </button>
                );
              })}
            </div>

            {/* Ô nhập khoảng giá tùy chỉnh */}
            <form onSubmit={handleApplyCustomPrice} className="pt-2.5 border-t border-slate-100 space-y-1.5">
              <span className="text-[11px] font-semibold text-slate-600 block">Hoặc tự nhập khoảng giá (VNĐ):</span>
              <div className="flex items-center gap-1.5">
                <Input
                  type="number"
                  placeholder="Từ ₫"
                  value={customMin}
                  onChange={(e) => setCustomMin(e.target.value)}
                  className="h-8 text-xs bg-white text-slate-900 border-slate-300 px-2"
                />
                <span className="text-slate-400 text-xs">-</span>
                <Input
                  type="number"
                  placeholder="Đến ₫"
                  value={customMax}
                  onChange={(e) => setCustomMax(e.target.value)}
                  className="h-8 text-xs bg-white text-slate-900 border-slate-300 px-2"
                />
                <Button
                  type="submit"
                  size="sm"
                  className="h-8 px-2.5 text-xs bg-slate-900 text-white hover:bg-slate-800 font-bold shrink-0 cursor-pointer"
                >
                  Lọc
                </Button>
              </div>
            </form>
          </div>

          {/* 3. Lọc theo Màu sắc */}
          <div className="space-y-2.5 border-t border-border pt-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Màu sắc
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {COLOR_OPTIONS.map((c) => {
                const isSelected = filters.color === c.value;
                return (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setFilter("color", isSelected ? undefined : c.value)}
                    className={cn(
                      "filter-btn-touch flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs border transition-all cursor-pointer",
                      isSelected
                        ? "border-slate-900 bg-slate-100 font-bold text-slate-900 ring-2 ring-primary ring-offset-1 color-swatch-active scale-[1.03]"
                        : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50 hover:scale-[1.02]"
                    )}
                  >
                    <span
                      className="h-4 w-4 rounded-full border border-black/20 shrink-0 flex items-center justify-center shadow-2xs"
                      style={{ backgroundColor: c.colorCode }}
                    >
                      {isSelected && (
                        <Check
                          size={10}
                          className={
                            c.value === "Trắng" || c.value === "Be"
                              ? "text-slate-900"
                              : "text-white"
                          }
                        />
                      )}
                    </span>
                    <span className="truncate">{c.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. Lọc theo Kích cỡ */}
          <div className="space-y-2.5 border-t border-border pt-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Kích cỡ
            </h4>
            <div className="flex flex-wrap gap-2">
              {SIZE_OPTIONS.map((s) => {
                const isSelected = filters.size === s;
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setFilter("size", isSelected ? undefined : s)}
                    className={cn(
                      "filter-btn-touch h-9 min-w-[40px] px-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center",
                      isSelected
                        ? "border-primary bg-primary text-primary-foreground font-black size-pill-active scale-110 ring-2 ring-primary/40 ring-offset-1"
                        : "border-slate-200 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-50 hover:scale-105"
                    )}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 5. Tình trạng tồn kho (In Stock Only) */}
          <div className="space-y-2 border-t border-slate-200 pt-4">
            <button
              type="button"
              onClick={() =>
                setFilter("inStock", filters.inStock === "true" ? undefined : "true")
              }
              className={cn(
                "filter-btn-touch w-full flex items-center justify-between p-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer",
                filters.inStock === "true"
                  ? "border-emerald-300 bg-emerald-50 text-emerald-900 shadow-2xs"
                  : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
              )}
            >
              <span className="flex items-center gap-2">
                <CheckCircle2
                  size={15}
                  className={filters.inStock === "true" ? "text-emerald-600" : "text-slate-400"}
                />
                Chỉ hàng còn trong kho
              </span>
              {filters.inStock === "true" && (
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              )}
            </button>
          </div>
        </aside>

        {/* MOBILE DRAWER FILTER */}
        {mobileFilterOpen && (
          <div className="lg:hidden fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-md flex justify-end">
            <div className="w-full max-w-xs bg-white text-slate-900 h-full p-6 overflow-y-auto space-y-6 shadow-2xl animate-in slide-in-from-right duration-200">
              <div className="flex items-center justify-between border-b pb-4">
                <h3 className="font-bold text-base flex items-center gap-2 text-slate-900">
                  <Filter size={18} className="text-primary" />
                  Bộ lọc sản phẩm
                </h3>
                <button
                  type="button"
                  onClick={() => setMobileFilterOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Danh mục mobile */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Danh mục
                </h4>
                <div className="space-y-1">
                  <button
                    type="button"
                    onClick={() => {
                      setFilter("category", undefined);
                      setMobileFilterOpen(false);
                    }}
                    className={cn(
                      "w-full text-left text-xs px-3 py-2 rounded-xl font-medium transition-all",
                      !filters.category ? "bg-slate-900 text-white font-bold" : "text-slate-700 hover:bg-slate-100"
                    )}
                  >
                    Tất cả danh mục
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        setFilter("category", cat.slug);
                        setMobileFilterOpen(false);
                      }}
                      className={cn(
                        "w-full text-left text-xs px-3 py-2 rounded-xl font-medium transition-all",
                        filters.category === cat.slug
                          ? "bg-slate-900 text-white font-bold"
                          : "text-slate-700 hover:bg-slate-100"
                      )}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Khoảng giá mobile */}
              <div className="space-y-2 border-t pt-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Khoảng giá
                </h4>
                <div className="space-y-1.5">
                  {PRICE_PRESETS.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        if (filters.minPrice === preset.min && filters.maxPrice === preset.max) {
                          setPriceRange(undefined, undefined);
                        } else {
                          setPriceRange(preset.min || undefined, preset.max || undefined);
                        }
                        setMobileFilterOpen(false);
                      }}
                      className={cn(
                        "w-full text-left text-xs px-3 py-2 rounded-xl border transition-all",
                        filters.minPrice === preset.min && filters.maxPrice === preset.max
                          ? "border-slate-900 bg-slate-900 text-white font-bold"
                          : "border-slate-200 bg-white text-slate-700"
                      )}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tồn kho mobile */}
              <div className="space-y-2 border-t pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setFilter("inStock", filters.inStock === "true" ? undefined : "true");
                    setMobileFilterOpen(false);
                  }}
                  className={cn(
                    "w-full flex items-center justify-between p-2.5 rounded-xl border text-xs font-semibold",
                    filters.inStock === "true"
                      ? "border-emerald-300 bg-emerald-50 text-emerald-900"
                      : "border-slate-200 bg-white text-slate-700"
                  )}
                >
                  <span className="flex items-center gap-2">
                    <CheckCircle2 size={15} />
                    Chỉ hàng còn trong kho
                  </span>
                </button>
              </div>

              {/* Action buttons */}
              <div className="pt-4 border-t flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    resetFilters();
                    setMobileFilterOpen(false);
                  }}
                  className="flex-1 border-slate-300 text-slate-700"
                >
                  Xóa bộ lọc
                </Button>
                <Button
                  size="sm"
                  onClick={() => setMobileFilterOpen(false)}
                  className="flex-1 bg-slate-900 text-white font-bold hover:bg-slate-800"
                >
                  Áp dụng
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* PRODUCTS LIST GRID */}
        <main className="lg:col-span-3">
          {productsLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
              {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} className="flex flex-col gap-3">
                  <Skeleton className="aspect-[3/4] w-full rounded-2xl" />
                  <Skeleton className="h-4 w-3/4 rounded" />
                  <Skeleton className="h-4 w-1/2 rounded" />
                </div>
              ))}
            </div>
          ) : productsError ? (
            <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed rounded-2xl bg-muted/20">
              <p className="text-sm text-destructive font-medium">Không thể tải dữ liệu sản phẩm.</p>
              <p className="text-xs text-muted-foreground mt-1 mb-4">
                Vui lòng kiểm tra lại kết nối API Backend hoặc thử lại.
              </p>
              <Button size="sm" variant="outline" onClick={() => refetchProducts()} className="gap-2">
                <RefreshCw size={14} />
                Tải lại trang
              </Button>
            </div>
          ) : products.length > 0 ? (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 animate-in fade-in duration-200">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>

              {/* PAGINATION CONTROLS */}
              {pagination.totalPages > 1 && (
                <div className="mt-12 flex items-center justify-center gap-2 pt-6 border-t border-border">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pagination.page <= 1}
                    onClick={() => setPage(pagination.page - 1)}
                    className="gap-1 text-xs"
                  >
                    <ChevronLeft size={14} />
                    <span>Trước</span>
                  </Button>

                  <div className="flex items-center gap-1 mx-2">
                    {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setPage(p)}
                        className={`h-8 w-8 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                          p === pagination.page
                            ? "bg-slate-900 text-white font-bold"
                            : "text-muted-foreground hover:bg-muted"
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pagination.page >= pagination.totalPages}
                    onClick={() => setPage(pagination.page + 1)}
                    className="gap-1 text-xs"
                  >
                    <span>Sau</span>
                    <ChevronRight size={14} />
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center border border-dashed rounded-2xl bg-card">
              <PackageOpen className="h-12 w-12 text-muted-foreground/40 mb-3" />
              <h3 className="text-base font-bold text-foreground">Không tìm thấy sản phẩm phù hợp</h3>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm mb-4">
                Không có sản phẩm nào thỏa mãn các điều kiện tìm kiếm hoặc bộ lọc hiện tại của bạn.
              </p>
              <Button size="sm" variant="outline" onClick={resetFilters}>
                Xóa tất cả bộ lọc
              </Button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
          <Skeleton className="h-10 w-48 mb-8" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="aspect-[3/4] w-full rounded-2xl" />
            ))}
          </div>
        </div>
      }
    >
      <ProductsCatalogContent />
    </Suspense>
  );
}
