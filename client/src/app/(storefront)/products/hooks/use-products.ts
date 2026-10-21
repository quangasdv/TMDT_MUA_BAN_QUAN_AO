"use client";

import { useMemo, useCallback } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  getProductsApi,
  getCategoriesApi,
  GetProductsParams,
} from "@/api/products.api";

export function useProducts() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Đọc các giá trị filter từ URL Query Parameters
  const q = searchParams.get("q") || "";
  const category = searchParams.get("category") || searchParams.get("categoryId") || "";
  const minPrice = searchParams.get("minPrice") || "";
  const maxPrice = searchParams.get("maxPrice") || "";
  const color = searchParams.get("color") || "";
  const size = searchParams.get("size") || "";
  const page = parseInt(searchParams.get("page") || "1", 10) || 1;
  const limit = parseInt(searchParams.get("limit") || "12", 10) || 12;

  // Gom các tham số gọi API
  const queryParams: GetProductsParams = useMemo(
    () => ({
      q: q || undefined,
      category: category || undefined,
      minPrice: minPrice || undefined,
      maxPrice: maxPrice || undefined,
      color: color || undefined,
      size: size || undefined,
      page,
      limit,
    }),
    [q, category, minPrice, maxPrice, color, size, page, limit]
  );

  // 1. Gọi API Lấy Danh mục
  const { data: categoriesData, isLoading: categoriesLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: getCategoriesApi,
    staleTime: 5 * 60 * 1000,
  });

  // 2. Gọi API Lấy Danh sách Sản phẩm
  const {
    data: productsData,
    isLoading: productsLoading,
    isError: productsError,
    error: productsErrorObj,
    refetch: refetchProducts,
    isPlaceholderData,
  } = useQuery({
    queryKey: ["products", queryParams],
    queryFn: () => getProductsApi(queryParams),
    staleTime: 30 * 1000,
  });

  const categories = categoriesData?.data?.categories || [];
  const products = productsData?.data?.products || [];
  const pagination = productsData?.data?.pagination || {
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 1,
  };

  // Cập nhật tham số URL an toàn
  const updateQueryParam = useCallback(
    (updates: Record<string, string | number | undefined | null>, resetPage = true) => {
      const current = new URLSearchParams(searchParams.toString());

      Object.entries(updates).forEach(([key, value]) => {
        if (value === undefined || value === null || value === "") {
          current.delete(key);
        } else {
          current.set(key, String(value));
        }
      });

      if (resetPage) {
        current.delete("page"); // Reset về trang 1 khi thay đổi bộ lọc
      }

      router.push(`${pathname}?${current.toString()}`, { scroll: false });
    },
    [router, pathname, searchParams]
  );

  const setFilter = useCallback(
    (key: keyof GetProductsParams, value: string | number | undefined | null) => {
      updateQueryParam({ [key]: value }, true);
    },
    [updateQueryParam]
  );

  const setPage = useCallback(
    (newPage: number) => {
      const current = new URLSearchParams(searchParams.toString());
      if (newPage <= 1) {
        current.delete("page");
      } else {
        current.set("page", String(newPage));
      }
      router.push(`${pathname}?${current.toString()}`);
      if (typeof window !== "undefined") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    },
    [router, pathname, searchParams]
  );

  const resetFilters = useCallback(() => {
    router.push(pathname);
  }, [router, pathname]);

  // Đếm số lượng bộ lọc đang active
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (q) count++;
    if (category) count++;
    if (minPrice || maxPrice) count++;
    if (color) count++;
    if (size) count++;
    return count;
  }, [q, category, minPrice, maxPrice, color, size]);

  return {
    categories,
    categoriesLoading,
    products,
    pagination,
    productsLoading,
    productsError,
    productsErrorObj,
    refetchProducts,
    isPlaceholderData,
    filters: {
      q,
      category,
      minPrice,
      maxPrice,
      color,
      size,
      page,
      limit,
    },
    activeFiltersCount,
    setFilter,
    setPage,
    resetFilters,
  };
}

