"use client";

import React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { getCategoriesApi, getProductsApi } from "@/api/products.api";
import { ProductCard } from "@/components/storefront/product-card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  ArrowRight,
  Sparkles,
  Layers,
  Shirt,
  Scissors,
  CheckCircle2,
  RefreshCw,
  TrendingUp,
} from "lucide-react";
import "./home/style/home.css";

export default function HomePage() {
  // 1. Lấy danh mục sản phẩm từ API
  const {
    data: categoriesData,
    isLoading: categoriesLoading,
  } = useQuery({
    queryKey: ["categories"],
    queryFn: getCategoriesApi,
    staleTime: 5 * 60 * 1000,
  });

  // 2. Lấy danh sách sản phẩm mới nhất (limit = 8) từ API
  const {
    data: productsData,
    isLoading: productsLoading,
    isError: productsError,
    refetch: refetchProducts,
  } = useQuery({
    queryKey: ["products", "home-featured"],
    queryFn: () => getProductsApi({ limit: 8 }),
    staleTime: 60 * 1000,
  });

  const categories = categoriesData?.data?.categories || [];
  const products = productsData?.data?.products || [];

  return (
    <div className="flex flex-col gap-16 sm:gap-24 pb-16">
      {/* 1. HERO BANNER - Phong cách Editorial Thời Trang */}
      <section className="relative overflow-hidden hero-gradient border-b border-border/50 pt-10 sm:pt-16 pb-16 sm:pb-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            {/* Left Column: Heading & CTA */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-3.5 py-1 text-xs font-semibold text-foreground tracking-wide">
                <Sparkles size={14} className="text-primary" />
                <span>BỘ SƯU TẬP XUÂN HÈ 2026</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.1] text-foreground">
                Định hình phong cách, <br className="hidden sm:inline" />
                <span className="relative inline-block mt-1">
                  khẳng định bản sắc
                  <span className="absolute left-0 bottom-1.5 w-full h-3 bg-primary/30 -z-10 rounded-sm" />
                </span>
              </h1>

              <p className="text-base sm:text-lg text-muted-foreground max-w-xl mx-auto lg:mx-0 leading-relaxed font-normal">
                Thời trang may mặc ứng dụng kết hợp công nghệ đo size thông minh{" "}
                <strong className="text-foreground font-semibold">Smart Fit</strong> và phòng thử đồ tương tác{" "}
                <strong className="text-foreground font-semibold">Outfit Builder 2D</strong>.
              </p>

              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 sm:gap-4 pt-2">
                <Link
                  href="/products"
                  className={cn(buttonVariants({ size: "lg" }), "h-12 px-6 text-sm font-semibold gap-2 shadow-md")}
                >
                  Khám phá sản phẩm
                  <ArrowRight size={16} />
                </Link>

                <Link
                  href="/outfits"
                  className={cn(buttonVariants({ size: "lg", variant: "outline" }), "h-12 px-6 text-sm font-semibold gap-2")}
                >
                  <Layers size={16} />
                  Combo Thời Trang Ưu Đãi
                </Link>
              </div>

              {/* Highlights Micro-badges */}
              <div className="pt-6 border-t border-border/60 flex flex-wrap items-center justify-center lg:justify-start gap-6 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={15} className="text-primary" />
                  <span>Cotton 100% thoáng mát</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={15} className="text-primary" />
                  <span>Gợi ý size khớp 95%</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={15} className="text-primary" />
                  <span>Đổi trả miễn phí 7 ngày</span>
                </div>
              </div>
            </div>

            {/* Right Column: Visual Collage Cards */}
            <div className="lg:col-span-5 relative">
              <div className="relative mx-auto max-w-md aspect-[4/5] rounded-2xl overflow-hidden shadow-2xl border border-border/80 bg-muted">
                <img
                  src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&auto=format&fit=crop&q=80"
                  alt="TrendyFit Lookbook"
                  className="h-full w-full object-cover object-center"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-6 text-white">
                  <Badge className="w-fit mb-2 bg-primary text-primary-foreground font-bold text-xs">
                    NEW ARRIVALS
                  </Badge>
                  <h3 className="text-xl font-bold">TrendyFit Studio Collection</h3>
                  <p className="text-xs text-white/80 mt-1">
                    Thiết kế tối giản, form dáng thời thượng sẵn sàng cho mọi dịp.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. KHU VỰC DANH MỤC NỔI BẬT */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
              <Shirt size={14} className="text-primary" />
              <span>Phân loại phong cách</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              Danh mục thời trang
            </h2>
          </div>
          <Link
            href="/products"
            className="text-sm font-semibold text-foreground hover:text-primary transition-colors flex items-center gap-1 group"
          >
            <span>Xem tất cả danh mục</span>
            <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          {categoriesLoading ? (
            Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-32 sm:h-40 rounded-xl" />
            ))
          ) : categories.length > 0 ? (
            categories.map((category) => (
              <Link
                key={category.id}
                href={`/products?category=${category.slug}`}
                className="group relative flex flex-col justify-end overflow-hidden rounded-xl border border-border/80 bg-card p-5 h-32 sm:h-44 transition-all duration-300 hover:border-foreground hover:shadow-lg"
              >
                <div className="absolute top-3 right-3 text-muted-foreground/40 group-hover:text-primary transition-colors">
                  <Scissors size={20} />
                </div>
                <div className="relative z-10">
                  <h3 className="text-base sm:text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                    {category.name}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1 group-hover:text-foreground">
                    <span>Xem sản phẩm</span>
                    <ArrowRight size={12} />
                  </p>
                </div>
              </Link>
            ))
          ) : (
            <div className="col-span-full py-8 text-center text-sm text-muted-foreground border rounded-xl">
              Chưa có danh mục nào được nạp từ hệ thống.
            </div>
          )}
        </div>
      </section>

      {/* 3. KHU VỰC SẢN PHẨM MỚI NHẤT */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
              <TrendingUp size={14} className="text-primary" />
              <span>Xu hướng lựa chọn</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              Sản phẩm mới nhất
            </h2>
          </div>
          <Link
            href="/products"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "hidden sm:inline-flex")}
          >
            Xem tất cả ({products.length > 0 ? `${products.length}+ món` : "Xem thêm"})
          </Link>
        </div>

        {/* Products Grid */}
        {productsLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
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
              Vui lòng kiểm tra kết nối API Backend hoặc thử lại.
            </p>
            <Button size="sm" variant="outline" onClick={() => refetchProducts()} className="gap-2">
              <RefreshCw size={14} />
              Thử lại
            </Button>
          </div>
        ) : products.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="py-12 text-center text-sm text-muted-foreground border rounded-xl">
            Hiện chưa có sản phẩm nào được kích hoạt trong cửa hàng.
          </div>
        )}

        {/* Mobile View All Button */}
        <div className="mt-8 text-center sm:hidden">
          <Link href="/products" className={cn(buttonVariants(), "w-full")}>
            Xem tất cả sản phẩm
          </Link>
        </div>
      </section>

      {/* 4. TÍNH NĂNG ĐẶC BIỆT: OUTFIT BUILDER & FIT ADVISOR TEASER */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full">
        <div className="rounded-2xl border border-border bg-gradient-to-br from-card via-muted/30 to-background p-8 sm:p-12 shadow-sm">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div className="space-y-4">
              <Badge className="bg-primary text-primary-foreground font-bold">
                CÔNG NGHỆ THỜI TRANG ĐỘC QUYỀN
              </Badge>
              <h2 className="text-2xl sm:text-3xl font-black text-foreground">
                Mua theo Combo Thời Trang & Tư vấn kích cỡ thông minh
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Khám phá các set combo thời trang phối sẵn với giá trọn gói ưu đãi hấp dẫn rẻ hơn mua lẻ từng món, đồng thời kết hợp thuật toán Smart Fit Advisor tính toán độ vừa vặn chuẩn xác đến 95%.
              </p>
              <div className="pt-2 flex flex-wrap gap-3">
                <Link href="/outfits" className={cn(buttonVariants({ size: "default" }), "gap-2")}>
                  <Layers size={16} />
                  Khám phá Combo thời trang
                </Link>
                <Link href="/products" className={cn(buttonVariants({ variant: "outline", size: "default" }))}>
                  Xem hướng dẫn chọn size
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-xl border border-border bg-card p-5 space-y-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20 text-primary">
                  <Layers size={20} />
                </div>
                <h4 className="font-bold text-sm">Combo Thời Trang Ưu Đãi</h4>
                <p className="text-xs text-muted-foreground">
                  Phối trang phục theo set hoàn chỉnh, tự động áp dụng mức giảm giá combo tiết kiệm.
                </p>
              </div>

              <div className="rounded-xl border border-border bg-card p-5 space-y-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20 text-primary">
                  <Sparkles size={20} />
                </div>
                <h4 className="font-bold text-sm">Smart Fit Advisor</h4>
                <p className="text-xs text-muted-foreground">
                  Thuật toán đối chiếu số đo cơ thể với bảng size chuẩn, đề xuất size lý tưởng.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
