"use client";

import { useState, useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { getOutfitsApi, getOutfitSlotsApi } from "../api/outfits.api";
import {
  OutfitSlotType,
  SlotProduct,
  SlotProductVariant,
  Outfit,
} from "../validation/outfits.validation";
import { useCart } from "@/app/(storefront)/cart/hooks/use-cart";
import { toast } from "react-toastify";

export type CanvasSelectionMap = Record<
  OutfitSlotType,
  { product: SlotProduct; variant: SlotProductVariant } | null
>;

const INITIAL_CANVAS_SELECTION: CanvasSelectionMap = {
  TOP: null,
  BOTTOM: null,
  OUTERWEAR: null,
  SHOES: null,
  ACCESSORY: null,
};

export function useOutfits() {
  const { addItem } = useCart();
  const [activeSlot, setActiveSlot] = useState<OutfitSlotType>("TOP");
  const [selectedOutfitId, setSelectedOutfitId] = useState<string | null>(null);
  const [canvasItems, setCanvasItems] = useState<CanvasSelectionMap>(
    INITIAL_CANVAS_SELECTION
  );
  const [isAddingAllToCart, setIsAddingAllToCart] = useState(false);

  // 1. Query danh sách set phối sẵn Lookbook
  const {
    data: outfitsData,
    isLoading: isOutfitsLoading,
    isError: isOutfitsError,
    refetch: refetchOutfits,
  } = useQuery({
    queryKey: ["outfits"],
    queryFn: getOutfitsApi,
    staleTime: 5 * 60 * 1000,
  });

  // 2. Query sản phẩm theo 4 tầng slot
  const {
    data: slotsData,
    isLoading: isSlotsLoading,
    isError: isSlotsError,
    refetch: refetchSlots,
  } = useQuery({
    queryKey: ["outfit-slots"],
    queryFn: getOutfitSlotsApi,
    staleTime: 5 * 60 * 1000,
  });

  const outfits: Outfit[] = outfitsData?.data?.outfits || [];
  const rawSlots = useMemo(() => slotsData?.data?.slots || {}, [slotsData]);

  // Chuẩn hóa slots với đầy đủ 5 tầng
  const slots: Record<OutfitSlotType, SlotProduct[]> = useMemo(() => {
    return {
      TOP: rawSlots.TOP || [],
      BOTTOM: rawSlots.BOTTOM || [],
      OUTERWEAR: rawSlots.OUTERWEAR || [],
      SHOES: rawSlots.SHOES || [],
      ACCESSORY: rawSlots.ACCESSORY || [],
    };
  }, [rawSlots]);

  // Chọn một sản phẩm cho slot cụ thể
  // Chọn một sản phẩm cho slot cụ thể (Ràng buộc thân trên: Chọn 1 trong 2 giữa Áo khoác & Áo thun)
  const selectItemForSlot = useCallback(
    (slot: OutfitSlotType, product: SlotProduct, variant?: SlotProductVariant) => {
      const targetVariant = variant || product.variants[0];
      if (!targetVariant) return;

      setCanvasItems((prev) => {
        const next = {
          ...prev,
          [slot]: { product, variant: targetVariant },
        };
        // Nếu chọn Áo khoác ngoài -> Tự động nhả Áo thun
        if (slot === "OUTERWEAR") {
          next.TOP = null;
        }
        // Nếu chọn Áo thun / Áo trong -> Tự động nhả Áo khoác
        else if (slot === "TOP") {
          next.OUTERWEAR = null;
        }
        return next;
      });
      setSelectedOutfitId(null);
    },
    []
  );

  // Xóa / Gỡ bỏ item khỏi slot
  const clearSlot = useCallback((slot: OutfitSlotType) => {
    setCanvasItems((prev) => ({
      ...prev,
      [slot]: null,
    }));
  }, []);

  // Nạp nguyên một preset Outfit có sẵn
  const loadPresetOutfit = useCallback((outfit: Outfit) => {
    setSelectedOutfitId(outfit.id);
    const newCanvas: CanvasSelectionMap = {
      TOP: null,
      BOTTOM: null,
      OUTERWEAR: null,
      SHOES: null,
      ACCESSORY: null,
    };

    outfit.items.forEach((item) => {
      const prod = item.variant.product;
      const catSlug = prod?.slug?.toLowerCase() || "";

      let targetSlot: OutfitSlotType = "TOP";
      if (catSlug.includes("quan") || catSlug.includes("jean") || catSlug.includes("pant")) {
        targetSlot = "BOTTOM";
      } else if (catSlug.includes("khoac") || catSlug.includes("jacket") || catSlug.includes("hoodie")) {
        targetSlot = "OUTERWEAR";
      } else if (catSlug.includes("giay") || catSlug.includes("shoe")) {
        targetSlot = "SHOES";
      }

      newCanvas[targetSlot] = {
        product: prod,
        variant: item.variant,
      };
    });

    setCanvasItems(newCanvas);
    toast.success(`Đã áp dụng set phối đồ: "${outfit.name}"`);
  }, []);

  // Reset toàn bộ canvas
  const resetCanvas = useCallback(() => {
    setCanvasItems(INITIAL_CANVAS_SELECTION);
    setSelectedOutfitId(null);
  }, []);

  // Tính tổng giá các món đang chọn trên canvas
  const totalPrice = useMemo(() => {
    let sum = 0;
    (Object.keys(canvasItems) as OutfitSlotType[]).forEach((slot) => {
      const entry = canvasItems[slot];
      if (entry) {
        const base = Number(entry.product.basePrice) || 0;
        const adjust = Number(entry.variant.priceAdjustment) || 0;
        sum += base + adjust;
      }
    });
    return sum;
  }, [canvasItems]);

  const selectedSlotCount = useMemo(() => {
    return Object.values(canvasItems).filter(Boolean).length;
  }, [canvasItems]);

  // Thêm toàn bộ các món trong canvas vào giỏ hàng
  const addAllToCart = useCallback(async () => {
    const activeEntries = Object.values(canvasItems).filter(Boolean) as Array<{
      product: SlotProduct;
      variant: SlotProductVariant;
    }>;

    if (activeEntries.length === 0) {
      toast.warning("Chưa có món đồ nào được chọn trên Canvas.");
      return;
    }

    setIsAddingAllToCart(true);
    let successCount = 0;

    for (const entry of activeEntries) {
      try {
        await addItem({ variantId: entry.variant.id, quantity: 1 });
        successCount++;
      } catch {
        // useCart đã bắt lỗi
      }
    }

    setIsAddingAllToCart(false);

    if (successCount > 0) {
      toast.success(
        `Đã thêm thành công ${successCount} món từ phòng phối đồ vào giỏ hàng!`
      );
    }
  }, [canvasItems, addItem]);

  return {
    outfits,
    slots,
    activeSlot,
    selectedOutfitId,
    canvasItems,
    totalPrice,
    selectedSlotCount,
    isLoading: isOutfitsLoading || isSlotsLoading,
    isError: isOutfitsError || isSlotsError,
    isAddingAllToCart,
    setActiveSlot,
    selectItemForSlot,
    clearSlot,
    loadPresetOutfit,
    resetCanvas,
    addAllToCart,
    refetch: () => {
      refetchOutfits();
      refetchSlots();
    },
  };
}
