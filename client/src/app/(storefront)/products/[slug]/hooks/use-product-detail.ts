"use client";

import { useState, useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { getProductDetailApi } from "../api/product-detail.api";
import {
  ProductDetail,
  ProductVariant,
} from "../validation/product-detail.validation";
import {
  getFitRecommendationApi,
  FitAdvisorResult,
  FitPreference,
} from "@/api/fit-advisor.api";
import { toast } from "react-toastify";

export function useProductDetail(slug: string) {
  const [rawColor, setRawColor] = useState<string>("");
  const [rawSize, setRawSize] = useState<string>("");
  const [selectedImage, setSelectedImage] = useState<string>("");
  const [quantity, setQuantity] = useState<number>(1);
  const [isSizeChartOpen, setIsSizeChartOpen] = useState<boolean>(false);

  // States cho Smart Fit Advisor form
  const [advisorHeight, setAdvisorHeight] = useState<string>("");
  const [advisorWeight, setAdvisorWeight] = useState<string>("");
  const [advisorChest, setAdvisorChest] = useState<string>("");
  const [advisorWaist, setAdvisorWaist] = useState<string>("");
  const [advisorHips, setAdvisorHips] = useState<string>("");
  const [advisorPreference, setAdvisorPreference] = useState<FitPreference>("REGULAR");
  const [advisorResult, setAdvisorResult] = useState<FitAdvisorResult | null>(null);
  const [isAdvisorLoading, setIsAdvisorLoading] = useState<boolean>(false);
  const [advisorError, setAdvisorError] = useState<string | null>(null);

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

  // Gọi API Smart Fit Advisor (POST /api/fit-advisor/recommend)
  const requestRecommendation = useCallback(async () => {
    const height = parseFloat(advisorHeight);
    const weight = parseFloat(advisorWeight);

    if (!height || isNaN(height) || height < 100 || height > 250) {
      setAdvisorError("Vui lòng nhập chiều cao hợp lệ (100 - 250 cm).");
      return;
    }
    if (!weight || isNaN(weight) || weight < 30 || weight > 200) {
      setAdvisorError("Vui lòng nhập cân nặng hợp lệ (30 - 200 kg).");
      return;
    }
    if (!product?.id) {
      setAdvisorError("Không tìm thấy thông tin sản phẩm.");
      return;
    }

    setAdvisorError(null);
    setIsAdvisorLoading(true);

    try {
      const res = await getFitRecommendationApi({
        productId: product.id,
        heightCm: height,
        weightKg: weight,
        chestCm: advisorChest ? parseFloat(advisorChest) : undefined,
        waistCm: advisorWaist ? parseFloat(advisorWaist) : undefined,
        hipsCm: advisorHips ? parseFloat(advisorHips) : undefined,
        fitPreference: advisorPreference,
      });

      if (res.success && res.data) {
        setAdvisorResult(res.data);
        toast.success(`Hệ thống gợi ý Size ${res.data.recommendedSize} cho bạn!`);
      } else {
        setAdvisorError(res.message || "Không thể tính toán size đề xuất.");
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Đã có lỗi xảy ra khi tính toán size đề xuất.";
      setAdvisorError(message);
      toast.error(message);
    } finally {
      setIsAdvisorLoading(false);
    }
  }, [
    advisorHeight,
    advisorWeight,
    advisorChest,
    advisorWaist,
    advisorHips,
    advisorPreference,
    product,
  ]);

  // Áp dụng size đề xuất từ Smart Fit Advisor vào form mua hàng
  const applyRecommendedSize = useCallback(() => {
    if (advisorResult?.recommendedSize) {
      handleSelectSize(advisorResult.recommendedSize);
      toast.info(`Đã chọn Size ${advisorResult.recommendedSize}.`);
    }
  }, [advisorResult, handleSelectSize]);

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
    advisorChest,
    advisorWaist,
    advisorHips,
    advisorPreference,
    advisorResult,
    isAdvisorLoading,
    advisorError,
    refetch,
    setSelectedColor: handleSelectColor,
    setSelectedSize: handleSelectSize,
    setActiveImage: setSelectedImage,
    setQuantity,
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
  };
}
