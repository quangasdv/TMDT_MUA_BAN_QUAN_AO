"use client";

import React, { useState, Suspense } from "react";
import { useProducts } from "./hooks/use-products";
import { ProductCard } from "@/components/storefront/product-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Filter,
  X,
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  PackageOpen,
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
    setPage,
    resetFilters,
  } = useProducts();

  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [searchInput, setSearchInput] = useState(filters.q);

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
            className="h-10 pr-10 text-sm bg-muted/30"
          />
          <button
            type="submit"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            aria-label="Tìm kiếm"
          >
            <Search size={16} />
          </button>
        </form>
      </div>

      {/* 2. Active Filters Bar & Mobile Filter Trigger */}
      <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
        {/* Active Filter Badges */}
        <div className="flex items-center gap-2 flex-wrap">
          {activeFiltersCount > 0 && (
            <span className="text-xs font-semibold text-muted-foreground mr-1">
              Bộ lọc đang chọn:
            </span>
          )}

          {filters.q && (
            <Badge variant="secondary" className="gap-1 text-xs py-1">
              Từ khóa: &quot;{filters.q}&quot;
              <button
                type="button"
                onClick={() => {
                  setSearchInput("");
                  setFilter("q", undefined);
                }}
                className="hover:text-destructive"
              >
                <X size={12} />
              </button>
            </Badge>
          )}

          {filters.category && (
            <Badge variant="secondary" className="gap-1 text-xs py-1">
              Danh mục: {categories.find((c) => c.slug === filters.category)?.name || filters.category}
              <button
                type="button"
                onClick={() => setFilter("category", undefined)}
                className="hover:text-destructive"
              >
                <X size={12} />
              </button>
            </Badge>
          )}

          {(filters.minPrice || filters.maxPrice) && (
            <Badge variant="secondary" className="gap-1 text-xs py-1">
              Giá: {filters.minPrice ? `${Number(filters.minPrice).toLocaleString()} ₫` : "0"} -{" "}
              {filters.maxPrice ? `${Number(filters.maxPrice).toLocaleString()} ₫` : "Tối đa"}
              <button
                type="button"
                onClick={() => {
                  setFilter("minPrice", undefined);
                  setFilter("maxPrice", undefined);
                }}
                className="hover:text-destructive"
              >
                <X size={12} />
              </button>
            </Badge>
          )}

          {filters.color && (
            <Badge variant="secondary" className="gap-1 text-xs py-1">
              Màu: {filters.color}
              <button
                type="button"
                onClick={() => setFilter("color", undefined)}
                className="hover:text-destructive"
              >
                <X size={12} />
              </button>
            </Badge>
          )}

          {filters.size && (
            <Badge variant="secondary" className="gap-1 text-xs py-1">
              Size: {filters.size}
              <button
                type="button"
                onClick={() => setFilter("size", undefined)}
                className="hover:text-destructive"
              >
                <X size={12} />
              </button>
            </Badge>
          )}

          {activeFiltersCount > 0 && (
            <button
              type="button"
              onClick={resetFilters}
              className="text-xs text-destructive hover:underline font-semibold ml-2"
            >
              Xóa tất cả
            </button>
          )}
        </div>

        {/* Mobile Filter Button */}
        <div className="lg:hidden ml-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
            className="gap-2 text-xs"
          >
            <SlidersHorizontal size={14} />
            Bộ lọc {activeFiltersCount > 0 && `(${activeFiltersCount})`}
          </Button>
        </div>
      </div>

      {/* 3. Main Layout: Sidebar & Products Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        {/* DESKTOP SIDEBAR FILTER */}
        <aside className="hidden lg:block filter-sidebar-sticky space-y-6 rounded-xl border border-border/80 bg-card p-5">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h3 className="font-bold text-sm flex items-center gap-2">
              <Filter size={16} className="text-primary" />
              Bộ lọc sản phẩm
            </h3>
            {activeFiltersCount > 0 && (
              <button
                type="button"
                onClick={resetFilters}
                className="text-xs text-muted-foreground hover:text-destructive"
              >
                Làm mới
              </button>
            )}
          </div>

          {/* Lọc theo Danh mục */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Danh mục
            </h4>
            <div className="space-y-1">
              <button
                type="button"
                onClick={() => setFilter("category", undefined)}
                className={`w-full text-left text-xs px-2.5 py-1.5 rounded-lg transition-colors ${
                  !filters.category
                    ? "bg-primary/20 text-foreground font-semibold"
                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                }`}
              >
                Tất cả danh mục
              </button>
              {categoriesLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-6 w-full rounded my-1" />
                ))
              ) : (
                categories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setFilter("category", cat.slug)}
                    className={`w-full text-left text-xs px-2.5 py-1.5 rounded-lg transition-colors ${
                      filters.category === cat.slug
                        ? "bg-primary/20 text-foreground font-semibold"
                        : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                    }`}
                  >
                    {cat.name}
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Lọc theo Khoảng giá */}
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
                        setFilter("minPrice", undefined);
                        setFilter("maxPrice", undefined);
                      } else {
                        setFilter("minPrice", preset.min || undefined);
                        setFilter("maxPrice", preset.max || undefined);
                      }
                    }}
                    className={`w-full text-left text-xs px-2.5 py-1.5 rounded-lg transition-colors ${
                      isSelected
                        ? "bg-primary/20 text-foreground font-semibold"
                        : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                    }`}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Lọc theo Màu sắc */}
          <div className="space-y-2.5 border-t border-border pt-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Màu sắc
            </h4>
            <div className="grid grid-cols-2 gap-1.5">
              {COLOR_OPTIONS.map((c) => {
                const isSelected = filters.color === c.value;
                return (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setFilter("color", isSelected ? undefined : c.value)}
                    className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs border transition-colors ${
                      isSelected
                        ? "border-foreground bg-foreground/5 font-semibold text-foreground"
                        : "border-border text-muted-foreground hover:bg-muted/40"
                    }`}
                  >
                    <span
                      className="h-3 w-3 rounded-full border border-black/20 shrink-0"
                      style={{ backgroundColor: c.colorCode }}
                    />
                    <span className="truncate">{c.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Lọc theo Kích cỡ */}
          <div className="space-y-2.5 border-t border-border pt-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Kích cỡ
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {SIZE_OPTIONS.map((s) => {
                const isSelected = filters.size === s;
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setFilter("size", isSelected ? undefined : s)}
                    className={`h-8 min-w-[36px] px-2 rounded-lg text-xs font-medium border transition-colors ${
                      isSelected
                        ? "border-foreground bg-foreground text-background font-bold"
                        : "border-border text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                    }`}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
          </div>
        </aside>

        {/* MOBILE DRAWER FILTER */}
        {mobileFilterOpen && (
          <div className="lg:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-end">
            <div className="w-full max-w-xs bg-background h-full p-6 overflow-y-auto space-y-6 shadow-2xl animate-in slide-in-from-right duration-200">
              <div className="flex items-center justify-between border-b pb-4">
                <h3 className="font-bold text-base flex items-center gap-2">
                  <Filter size={18} className="text-primary" />
                  Bộ lọc sản phẩm
                </h3>
                <button
                  type="button"
                  onClick={() => setMobileFilterOpen(false)}
                  className="p-1 text-muted-foreground hover:text-foreground"
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
                    className={`w-full text-left text-xs px-2.5 py-2 rounded-lg ${
                      !filters.category ? "bg-primary/20 font-bold" : "text-muted-foreground"
                    }`}
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
                      className={`w-full text-left text-xs px-2.5 py-2 rounded-lg ${
                        filters.category === cat.slug ? "bg-primary/20 font-bold" : "text-muted-foreground"
                      }`}
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
                <div className="space-y-1">
                  {PRICE_PRESETS.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setFilter("minPrice", preset.min || undefined);
                        setFilter("maxPrice", preset.max || undefined);
                        setMobileFilterOpen(false);
                      }}
                      className={`w-full text-left text-xs px-2.5 py-2 rounded-lg ${
                        filters.minPrice === preset.min && filters.maxPrice === preset.max
                          ? "bg-primary/20 font-bold"
                          : "text-muted-foreground"
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
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
                  className="flex-1"
                >
                  Xóa bộ lọc
                </Button>
                <Button
                  size="sm"
                  onClick={() => setMobileFilterOpen(false)}
                  className="flex-1"
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
                  <Skeleton className="aspect-[3/4] w-full rounded-xl" />
                  <Skeleton className="h-4 w-3/4 rounded" />
                  <Skeleton className="h-4 w-1/2 rounded" />
                </div>
              ))}
            </div>
          ) : productsError ? (
            <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed rounded-xl bg-muted/20">
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
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
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
                        className={`h-8 w-8 rounded-lg text-xs font-semibold transition-colors ${
                          p === pagination.page
                            ? "bg-foreground text-background"
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
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center border border-dashed rounded-xl bg-card">
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
              <Skeleton key={i} className="aspect-[3/4] w-full rounded-xl" />
            ))}
          </div>
        </div>
      }
    >
      <ProductsCatalogContent />
    </Suspense>
  );
}

