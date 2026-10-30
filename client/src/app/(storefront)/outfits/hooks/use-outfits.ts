"use client";

import { useState, useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  getCombosApi,
  getComboByIdApi,
  getOutfitSlotsApi,
} from "../api/outfits.api";
import {
  Combo,
  SlotProductVariant,
  isClothingSlot,
  isAccessorySlot,
} from "../validation/outfits.validation";
import { useCart } from "@/app/(storefront)/cart/hooks/use-cart";
import { toast } from "react-toastify";

export function useOutfits() {
  const { addItem } = useCart();
  const [userSelectedComboId, setUserSelectedComboId] = useState<string | null>(null);
  const [selectedVariants, setSelectedVariants] = useState<Record<string, SlotProductVariant>>({});
  const [selectedAccessories, setSelectedAccessories] = useState<Record<string, boolean>>({});
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  // 1. Query danh sách các combo thời trang
  const {
    data: combosData,
    isLoading: isCombosLoading,
    isError: isCombosError,
    error: combosError,
    refetch: refetchCombos,
  } = useQuery({
    queryKey: ["combos-list"],
    queryFn: getCombosApi,
    staleTime: 5 * 60 * 1000,
  });

  const combos: Combo[] = useMemo(() => combosData?.data?.combos || [], [combosData]);

  // Combo ID hiệu lực: ưu tiên lựa chọn của người dùng, nếu chưa có thì lấy combo đầu tiên
  const effectiveComboId = userSelectedComboId || (combos[0]?.id ?? null);

  // Chọn combo mới: reset trạng thái phụ kiện và biến thể để tránh rò rỉ dữ liệu cũ
  const setSelectedComboId = useCallback((comboId: string) => {
    setUserSelectedComboId(comboId);
    setSelectedAccessories({});
    setSelectedVariants({});
  }, []);

  // 2. Query chi tiết combo kèm toàn bộ danh sách biến thể
  const {
    data: comboDetailData,
    isLoading: isDetailLoading,
    isError: isDetailError,
    refetch: refetchDetail,
  } = useQuery({
    queryKey: ["combo-detail", effectiveComboId],
    queryFn: () => (effectiveComboId ? getComboByIdApi(effectiveComboId) : null),
    enabled: Boolean(effectiveComboId),
    staleTime: 5 * 60 * 1000,
  });

  const activeCombo: Combo | null = useMemo(() => {
    if (comboDetailData?.data?.combo) {
      return comboDetailData.data.combo;
    }
    return combos.find((c) => c.id === effectiveComboId) || null;
  }, [comboDetailData, combos, effectiveComboId]);

  // 3. Phân tách danh sách món: Quần áo (Combo cứng) vs Phụ kiện (Không tính vào combo)
  const clothingItems = useMemo(() => {
    if (!activeCombo?.items) return [];
    return activeCombo.items.filter((it) => isClothingSlot(it.slotType));
  }, [activeCombo]);

  const accessoryItems = useMemo(() => {
    if (!activeCombo?.items) return [];
    return activeCombo.items.filter((it) => isAccessorySlot(it.slotType));
  }, [activeCombo]);

  // 4. Tính toán giá tiền theo quy tắc:
  // - 1 Combo cứng (chỉ gồm quần áo): Giá trọn gói ưu đãi rẻ hơn mua lẻ từng món
  // - Phụ kiện (giày, kính, nón...): CHỈ cộng vào tổng tiền khi người dùng ĐÃ TICK CHỌN (mặc định là false)
  const pricing = useMemo(() => {
    let clothingOriginalPrice = 0;
    clothingItems.forEach((item) => {
      const currentVar =
        selectedVariants[item.id] ||
        item.defaultVariant ||
        item.product?.allVariants?.[0];
      const priceAdj = Number(currentVar?.priceAdjustment || 0);
      const base = Number(item.product?.basePrice ?? item.price ?? 0);
      clothingOriginalPrice += base + priceAdj;
    });

    const discountRate = activeCombo?.discountRate || 0.15;
    // Giá combo cứng cho quần áo (rẻ hơn mua lẻ từng cái)
    const clothingComboPrice = Math.round(clothingOriginalPrice * (1 - discountRate));
    const clothingSavedAmount = clothingOriginalPrice - clothingComboPrice;

    // Tổng tiền phụ kiện: CHỈ cộng khi khách ĐÃ TICK CHỌN (Boolean is true)
    let selectedAccessoriesPrice = 0;
    let selectedAccessoriesCount = 0;
    accessoryItems.forEach((item) => {
      const isChecked = Boolean(selectedAccessories[item.id]);
      if (isChecked) {
        const currentVar =
          selectedVariants[item.id] ||
          item.defaultVariant ||
          item.product?.allVariants?.[0];
        const priceAdj = Number(currentVar?.priceAdjustment || 0);
        const base = Number(item.product?.basePrice ?? item.price ?? 0);
        selectedAccessoriesPrice += base + priceAdj;
        selectedAccessoriesCount++;
      }
    });

    const finalTotal = clothingComboPrice + selectedAccessoriesPrice;
    const regularTotalWithoutCombo = clothingOriginalPrice + selectedAccessoriesPrice;

    return {
      clothingOriginalPrice,
      clothingComboPrice,
      clothingSavedAmount,
      discountPercent: Math.round(discountRate * 100),
      selectedAccessoriesPrice,
      selectedAccessoriesCount,
      finalTotal,
      regularTotalWithoutCombo,
    };
  }, [activeCombo, clothingItems, accessoryItems, selectedVariants, selectedAccessories]);

  // Thay đổi biến thể (size, màu sắc) cho 1 món trong combo
  const handleSelectVariant = useCallback((itemId: string, variant: SlotProductVariant) => {
    setSelectedVariants((prev) => ({
      ...prev,
      [itemId]: variant,
    }));
  }, []);

  // Bật / Tắt phụ kiện mua kèm (mặc định là false nếu chưa tick chọn)
  const handleToggleAccessory = useCallback((itemId: string) => {
    setSelectedAccessories((prev) => ({
      ...prev,
      [itemId]: !Boolean(prev[itemId]),
    }));
  }, []);

  // Thêm trọn bộ combo (quần áo ưu đãi + các phụ kiện đã tick chọn) vào giỏ hàng
  const addComboToCart = useCallback(async () => {
    if (!activeCombo) return;

    // Danh sách các variantId cần thêm
    const itemsToAdd: Array<{ variantId: string; name: string }> = [];

    // 1. Thêm toàn bộ quần áo trong combo cứng
    for (const item of clothingItems) {
      const v =
        selectedVariants[item.id] ||
        item.defaultVariant ||
        item.product?.allVariants?.[0];
      const vId = v?.id || item.variantId;
      if (vId) {
        itemsToAdd.push({
          variantId: vId,
          name: item.productName || item.product?.name || "Quần áo Combo",
        });
      }
    }

    // 2. Thêm các phụ kiện CHỈ KHI ĐÃ ĐƯỢC TICK CHỌN
    for (const item of accessoryItems) {
      const isChecked = Boolean(selectedAccessories[item.id]);
      if (isChecked) {
        const v =
          selectedVariants[item.id] ||
          item.defaultVariant ||
          item.product?.allVariants?.[0];
        const vId = v?.id || item.variantId;
        if (vId) {
          itemsToAdd.push({
            variantId: vId,
            name: item.productName || item.product?.name || "Phụ kiện",
          });
        }
      }
    }

    if (itemsToAdd.length === 0) {
      toast.warning("Chưa có sản phẩm nào được chọn trong combo.");
      return;
    }

    setIsAddingToCart(true);
    let successCount = 0;

    for (const it of itemsToAdd) {
      try {
        await addItem({ variantId: it.variantId, quantity: 1 });
        successCount++;
      } catch {
        // useCart đã thông báo lỗi nếu có
      }
    }

    setIsAddingToCart(false);

    if (successCount > 0) {
      if (typeof window !== "undefined") {
        try {
          const clothingVariantIds = clothingItems.map((item) => {
            const v =
              selectedVariants[item.id] ||
              item.defaultVariant ||
              item.product?.allVariants?.[0];
            return v?.id || item.variantId;
          }).filter(Boolean);

          localStorage.setItem(
            "trendyfit_active_combo",
            JSON.stringify({
              outfitId: activeCombo.id,
              title: activeCombo.title,
              discountRate: activeCombo.discountRate || 0.15,
              clothingVariantIds,
              clothingOriginalPrice: pricing.clothingOriginalPrice,
            })
          );
        } catch {
          // ignore
        }
      }

      toast.success(
        `Đã thêm trọn bộ "${activeCombo.title}" (${successCount} món) vào giỏ hàng! Tiết kiệm ${new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(pricing.clothingSavedAmount)}`
      );
    }
  }, [
    activeCombo,
    clothingItems,
    accessoryItems,
    selectedVariants,
    selectedAccessories,
    addItem,
    pricing.clothingSavedAmount,
  ]);

  // Query phụ cho slots để giữ tính tương thích
  const { data: slotsData } = useQuery({
    queryKey: ["outfit-slots"],
    queryFn: getOutfitSlotsApi,
    staleTime: 5 * 60 * 1000,
  });

  return {
    combos,
    selectedComboId: effectiveComboId,
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
    isLoading: isCombosLoading || (isDetailLoading && !activeCombo),
    isError: isCombosError || isDetailError,
    error: combosError instanceof Error ? combosError.message : null,
    refetch: () => {
      refetchCombos();
      refetchDetail();
    },
    // Giữ tương thích ngược
    outfits: combos,
    slots: slotsData?.data?.slots || {},
  };
}
