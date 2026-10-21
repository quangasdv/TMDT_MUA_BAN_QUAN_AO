"use client";

import { useState, useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { getProductDetailApi } from "../api/product-detail.api";
import {
  ProductDetail,
  ProductVariant,
} from "../validation/product-detail.validation";

export function useProductDetail(slug: string) {
  const [rawColor, setRawColor] = useState<string>("");
  const [rawSize, setRawSize] = useState<string>("");
  const [selectedImage, setSelectedImage] = useState<string>("");
  const [quantity, setQuantity] = useState<number>(1);
  const [isSizeChartOpen, setIsSizeChartOpen] = useState<boolean>(false);
  const [advisorHeight, setAdvisorHeight] = useState<string>("");
  const [advisorWeight, setAdvisorWeight] = useState<string>("");

  // 1. Gọi API Chi tiết Sản phẩm từ feature api module
  const {
    data: productData,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["product", slug],
    queryFn: () => getProductDetailApi(slug),
    staleTime: 60 * 1000,
    enabled: !!slug,
  });

  const product: ProductDetail | undefined = productData?.data?.product;
  const variants: ProductVariant[] = useMemo(
    () => product?.variants || [],
    [product]
  );

  // Biến thể mặc định: ưu tiên biến thể còn hàng
  const defaultVariant = useMemo(() => {
    if (variants.length === 0) return undefined;
    return variants.find((v) => v.stockQuantity > 0) || variants[0];
  }, [variants]);

  // Màu và size được tính toán phái sinh (derived state)
  const selectedColor = rawColor || defaultVariant?.color || "";
  const selectedSize = rawSize || defaultVariant?.size || "";

  // Danh sách các màu độc nhất
  const colors = useMemo(() => {
    return Array.from(new Set(variants.map((v) => v.color).filter(Boolean)));
  }, [variants]);

  // Danh sách các kích cỡ độc nhất
  const sizes = useMemo(() => {
    return Array.from(new Set(variants.map((v) => v.size).filter(Boolean)));
  }, [variants]);

  // Biến thể khớp với màu và size đang chọn
  const activeVariant: ProductVariant | undefined = useMemo(() => {
    if (!selectedColor || !selectedSize) return undefined;
    return variants.find(
      (v) => v.color === selectedColor && v.size === selectedSize
    );
  }, [variants, selectedColor, selectedSize]);

  // Ảnh hiển thị chính (ưu tiên ảnh do người dùng chọn thumbnail -> ảnh biến thể -> ảnh chung)
  const activeImage = useMemo(() => {
    if (selectedImage) return selectedImage;
    if (activeVariant?.imageUrl) return activeVariant.imageUrl;
    if (product?.images && product.images.length > 0) return product.images[0];
    return "";
  }, [selectedImage, activeVariant, product]);

  // Danh sách toàn bộ ảnh có sẵn của sản phẩm và các biến thể
  const allImages = useMemo(() => {
    const list: string[] = [];
    if (product?.images) {
      product.images.forEach((img) => {
        if (img && !list.includes(img)) list.push(img);
      });
    }
    variants.forEach((v) => {
      if (v.imageUrl && !list.includes(v.imageUrl)) {
        list.push(v.imageUrl);
      }
    });
    return list;
  }, [product, variants]);

  // Giá hiện tại: basePrice + priceAdjustment của biến thể
  const currentPrice = useMemo(() => {
    if (!product) return 0;
    const base = Number(product.basePrice) || 0;
    const adjust = Number(activeVariant?.priceAdjustment) || 0;
    return base + adjust;
  }, [product, activeVariant]);

  // Handlers
  const handleSelectColor = useCallback((color: string) => {
    setRawColor(color);
    setQuantity(1);
    setSelectedImage(""); // reset để tự động nạp ảnh biến thể tương ứng
  }, []);

  const handleSelectSize = useCallback((size: string) => {
    setRawSize(size);
    setQuantity(1);
  }, []);

  // Kiểm tra tính khả dụng của một size đối với màu đang chọn
  const isSizeAvailableForColor = useCallback(
    (sizeOption: string) => {
      const found = variants.find(
        (v) => v.color === selectedColor && v.size === sizeOption
      );
      return found ? found.stockQuantity > 0 : false;
    },
    [variants, selectedColor]
  );

  // Lấy tồn kho cụ thể của một size cho màu đang chọn
  const getSizeStock = useCallback(
    (sizeOption: string): number => {
      const found = variants.find(
        (v) => v.color === selectedColor && v.size === sizeOption
      );
      return found ? found.stockQuantity : 0;
    },
    [variants, selectedColor]
  );

  // Điều chỉnh số lượng
  const increaseQuantity = useCallback(() => {
    const maxStock = activeVariant?.stockQuantity || 1;
    setQuantity((prev) => (prev < maxStock ? prev + 1 : prev));
  }, [activeVariant]);

  const decreaseQuantity = useCallback(() => {
    setQuantity((prev) => (prev > 1 ? prev - 1 : 1));
  }, []);

  // Thuật toán Smart Fit Advisor dựa trên dữ liệu sizeCharts từ DB
  const recommendedSize = useMemo(() => {
    const h = parseFloat(advisorHeight);
    const w = parseFloat(advisorWeight);
    if (!h || !w || !product?.sizeCharts || product.sizeCharts.length === 0) {
      return null;
    }

    // Tìm size khớp cả chiều cao và cân nặng
    const exactMatch = product.sizeCharts.find(
      (sc) =>
        h >= sc.minHeightCm &&
        h <= sc.maxHeightCm &&
        w >= sc.minWeightKg &&
        w <= sc.maxWeightKg
    );
    if (exactMatch) return exactMatch.size;

    // Nếu không khớp đồng thời, tính khoảng cách điểm chuẩn
    let bestSize: string | null = null;
    let minDistance = Infinity;

    for (const sc of product.sizeCharts) {
      const midH = (sc.minHeightCm + sc.maxHeightCm) / 2;
      const midW = (sc.minWeightKg + sc.maxWeightKg) / 2;
      // Trọng số chuẩn: cân nặng 60%, chiều cao 40%
      const dist = Math.pow((h - midH) / 10, 2) * 0.4 + Math.pow((w - midW) / 5, 2) * 0.6;
      if (dist < minDistance) {
        minDistance = dist;
        bestSize = sc.size;
      }
    }

    return bestSize;
  }, [advisorHeight, advisorWeight, product]);

  return {
    product,
    variants,
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
    error,
    advisorHeight,
    advisorWeight,
    recommendedSize,
    refetch,
    setSelectedColor: handleSelectColor,
    setSelectedSize: handleSelectSize,
    setActiveImage: setSelectedImage,
    setQuantity,
    setIsSizeChartOpen,
    setAdvisorHeight,
    setAdvisorWeight,
    increaseQuantity,
    decreaseQuantity,
    isSizeAvailableForColor,
    getSizeStock,
  };
}
