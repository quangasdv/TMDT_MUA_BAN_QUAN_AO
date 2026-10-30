"use client";

import { useMemo, useState, useCallback, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getCartApi,
  addToCartApi,
  updateCartItemQuantityApi,
  removeCartItemApi,
} from "../api/cart.api";
import {
  Cart,
  CartItem,
  AddToCartPayload,
} from "../validation/cart.validation";
import { toast } from "react-toastify";
import { getApiErrorCode, getApiErrorMessage } from "@/lib/error";

export const CART_QUERY_KEY = ["cart"] as const;
export const CHECKOUT_SELECTED_STORAGE_KEY = "trendyfit_checkout_selected_item_ids";

export const FREE_SHIPPING_THRESHOLD = 499000;
export const STANDARD_SHIPPING_FEE = 30000;

export function useCart() {
  const queryClient = useQueryClient();
  const [updatingItemIds, setUpdatingItemIds] = useState<Set<string>>(new Set());

  // Thông tin Combo đang chọn từ localStorage (nếu có)
  const [activeCombo, setActiveCombo] = useState<{
    outfitId: string;
    title: string;
    discountRate: number;
    clothingVariantIds: string[];
    clothingOriginalPrice?: number;
  } | null>(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("trendyfit_active_combo");
        if (stored) return JSON.parse(stored);
      } catch {
        // ignore
      }
    }
    return null;
  });

  // Trạng thái lưu trữ các ID sản phẩm được tick chọn (null: mặc định chọn tất cả sản phẩm còn hàng)
  const [userSelectedIds, setUserSelectedIds] = useState<Set<string> | null>(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = sessionStorage.getItem(CHECKOUT_SELECTED_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            return new Set(parsed);
          }
        }
      } catch {
        // ignore
      }
    }
    return null;
  });

  // 1. Query: Lấy dữ liệu giỏ hàng hiện tại
  const {
    data: cartResponse,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: CART_QUERY_KEY,
    queryFn: getCartApi,
    staleTime: 30 * 1000,
    retry: 1,
  });

  const cart: Cart | undefined = cartResponse?.data?.cart;
  const items: CartItem[] = useMemo(() => cart?.items || [], [cart]);

  // Tập hợp các ID hợp lệ được chọn
  const effectiveSelectedIds = useMemo(() => {
    if (userSelectedIds !== null) {
      const currentItemIds = new Set(items.map((it) => it.id));
      const filtered = new Set<string>();
      userSelectedIds.forEach((id) => {
        if (currentItemIds.has(id)) {
          filtered.add(id);
        }
      });
      return filtered;
    }

    // Mặc định: Chọn tất cả các sản phẩm còn hàng và còn hoạt động
    const defaultSelected = new Set<string>();
    items.forEach((it) => {
      if (
        it.variant?.stockQuantity > 0 &&
        it.variant?.product?.isActive !== false
      ) {
        defaultSelected.add(it.id);
      }
    });
    return defaultSelected;
  }, [items, userSelectedIds]);

  // Đồng bộ lựa chọn vào sessionStorage để chuyển sang trang Checkout
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        sessionStorage.setItem(
          CHECKOUT_SELECTED_STORAGE_KEY,
          JSON.stringify(Array.from(effectiveSelectedIds))
        );
      } catch {
        // ignore
      }
    }
  }, [effectiveSelectedIds]);

  // Danh sách các món ĐƯỢC CHỌN để thanh toán
  const selectedItems = useMemo(() => {
    return items.filter((it) => effectiveSelectedIds.has(it.id));
  }, [items, effectiveSelectedIds]);

  // 2. Tính toán tổng toàn bộ giỏ hàng (giữ tương thích ngược)
  const totalItemCount = useMemo(() => {
    return items.reduce((acc, it) => acc + (it.quantity || 0), 0);
  }, [items]);

  const subtotalPrice = useMemo(() => {
    return items.reduce((acc, it) => {
      const base = Number(it.variant?.product?.basePrice) || 0;
      const adjust = Number(it.variant?.priceAdjustment) || 0;
      const unitPrice = base + adjust;
      return acc + unitPrice * (it.quantity || 0);
    }, 0);
  }, [items]);

  const isFreeShipping = subtotalPrice >= FREE_SHIPPING_THRESHOLD;
  const shippingFee = items.length === 0 ? 0 : isFreeShipping ? 0 : 0;
  const finalTotal = subtotalPrice;

  const amountNeededForFreeShipping = useMemo(() => {
    return Math.max(0, FREE_SHIPPING_THRESHOLD - subtotalPrice);
  }, [subtotalPrice]);

  const freeShippingProgress = useMemo(() => {
    if (items.length === 0) return 0;
    return Math.min(100, Math.round((subtotalPrice / FREE_SHIPPING_THRESHOLD) * 100));
  }, [subtotalPrice, items.length]);

  // 3. Tính toán CHỈ CHO CÁC MÓN ĐƯỢC CHỌN (Phục vụ Checkout)
  const selectedItemCount = useMemo(() => {
    return selectedItems.reduce((acc, it) => acc + (it.quantity || 0), 0);
  }, [selectedItems]);

  const selectedSubtotalPrice = useMemo(() => {
    return selectedItems.reduce((acc, it) => {
      const base = Number(it.variant?.product?.basePrice) || 0;
      const adjust = Number(it.variant?.priceAdjustment) || 0;
      const unitPrice = base + adjust;
      return acc + unitPrice * (it.quantity || 0);
    }, 0);
  }, [selectedItems]);

  const selectedIsFreeShipping = selectedSubtotalPrice >= FREE_SHIPPING_THRESHOLD;

  const selectedShippingFee = useMemo(() => {
    if (selectedItems.length === 0) return 0;
    return selectedIsFreeShipping ? 0 : STANDARD_SHIPPING_FEE;
  }, [selectedItems.length, selectedIsFreeShipping]);

  // Tính toán ưu đãi Combo (Dynamic Bundle Matching)
  const { eligibleComboCount, comboDiscountAmount, isComboApplied, hasPartialCombo } = useMemo(() => {
    if (!activeCombo || !activeCombo.clothingVariantIds || activeCombo.clothingVariantIds.length === 0) {
      return { eligibleComboCount: 0, comboDiscountAmount: 0, isComboApplied: false, hasPartialCombo: false };
    }

    const quantities = activeCombo.clothingVariantIds.map((vId) => {
      const it = selectedItems.find((item) => item.variantId === vId);
      return it ? (it.quantity || 0) : 0;
    });

    const minQty = Math.min(...quantities);
    const someQty = quantities.some((q) => q > 0);

    if (minQty > 0) {
      let singleSetPrice = 0;
      for (const vId of activeCombo.clothingVariantIds) {
        const it = selectedItems.find((item) => item.variantId === vId);
        if (it) {
          const base = Number(it.variant?.product?.basePrice) || 0;
          const adjust = Number(it.variant?.priceAdjustment) || 0;
          singleSetPrice += base + adjust;
        }
      }
      const rate = Number(activeCombo.discountRate) || 0.15;
      const discount = Math.round(minQty * singleSetPrice * rate);
      return {
        eligibleComboCount: minQty,
        comboDiscountAmount: discount,
        isComboApplied: true,
        hasPartialCombo: false,
      };
    }

    return {
      eligibleComboCount: 0,
      comboDiscountAmount: 0,
      isComboApplied: false,
      hasPartialCombo: someQty,
    };
  }, [activeCombo, selectedItems]);

  const selectedFinalTotal = Math.max(0, selectedSubtotalPrice - comboDiscountAmount + selectedShippingFee);

  const selectedAmountNeededForFreeShipping = useMemo(() => {
    return Math.max(0, FREE_SHIPPING_THRESHOLD - selectedSubtotalPrice);
  }, [selectedSubtotalPrice]);

  const selectedFreeShippingProgress = useMemo(() => {
    if (selectedItems.length === 0) return 0;
    return Math.min(100, Math.round((selectedSubtotalPrice / FREE_SHIPPING_THRESHOLD) * 100));
  }, [selectedSubtotalPrice, selectedItems.length]);

  // Kiểm tra tồn kho cho các món được chọn
  const hasSelectedOutOfStockItems = useMemo(() => {
    return selectedItems.some(
      (it) =>
        it.variant.stockQuantity <= 0 ||
        (it.variant.product && it.variant.product.isActive === false)
    );
  }, [selectedItems]);

  const hasSelectedExceededStockItems = useMemo(() => {
    return selectedItems.some((it) => it.quantity > it.variant.stockQuantity);
  }, [selectedItems]);

  // Thao tác chọn / bỏ chọn checkbox
  const isItemSelected = useCallback(
    (id: string) => effectiveSelectedIds.has(id),
    [effectiveSelectedIds]
  );

  const toggleSelectItem = useCallback(
    (id: string) => {
      setUserSelectedIds((prev) => {
        const next = new Set(prev ?? effectiveSelectedIds);
        if (next.has(id)) {
          next.delete(id);
        } else {
          next.add(id);
        }
        return next;
      });
    },
    [effectiveSelectedIds]
  );

  const selectAllItems = useCallback(() => {
    const selectableIds = items
      .filter(
        (it) =>
          it.variant?.stockQuantity > 0 &&
          it.variant?.product?.isActive !== false
      )
      .map((it) => it.id);
    setUserSelectedIds(new Set(selectableIds));
  }, [items]);

  const unselectAllItems = useCallback(() => {
    setUserSelectedIds(new Set());
  }, []);

  const selectableItemsCount = useMemo(() => {
    return items.filter(
      (it) =>
        it.variant?.stockQuantity > 0 &&
        it.variant?.product?.isActive !== false
    ).length;
  }, [items]);

  const isAllSelected = useMemo(() => {
    return (
      selectableItemsCount > 0 &&
      effectiveSelectedIds.size >= selectableItemsCount
    );
  }, [selectableItemsCount, effectiveSelectedIds.size]);

  const toggleSelectAll = useCallback(() => {
    if (isAllSelected) {
      unselectAllItems();
    } else {
      selectAllItems();
    }
  }, [isAllSelected, unselectAllItems, selectAllItems]);

  // Kiểm tra tồn kho toàn bộ giỏ (giữ tương thích)
  const hasOutOfStockItems = useMemo(() => {
    return items.some(
      (it) =>
        it.variant.stockQuantity <= 0 ||
        (it.variant.product && it.variant.product.isActive === false)
    );
  }, [items]);

  const hasExceededStockItems = useMemo(() => {
    return items.some((it) => it.quantity > it.variant.stockQuantity);
  }, [items]);

  // Helper quản lý trạng thái đang cập nhật của từng item để chống race condition
  const setItemUpdating = useCallback((id: string, updating: boolean) => {
    setUpdatingItemIds((prev) => {
      const next = new Set(prev);
      if (updating) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  }, []);

  // 4. Mutation: Thêm sản phẩm vào giỏ
  const addItemMutation = useMutation({
    mutationFn: (payload: AddToCartPayload) => addToCartApi(payload),
    onSuccess: (data) => {
      queryClient.setQueryData(CART_QUERY_KEY, data);
      queryClient.invalidateQueries({ queryKey: CART_QUERY_KEY });
    },
    onError: (err) => {
      const errorCode = getApiErrorCode(err);
      const message = getApiErrorMessage(err);

      if (errorCode === "CART_INVALID_QUANTITY") {
        toast.error("Số lượng thêm vào giỏ không hợp lệ.");
      } else {
        toast.error(message || "Không thể thêm sản phẩm vào giỏ hàng.");
      }
    },
  });

  // 5. Mutation: Cập nhật số lượng món
  const updateQuantityMutation = useMutation({
    mutationFn: async ({ id, quantity }: { id: string; quantity: number }) => {
      return updateCartItemQuantityApi(id, { quantity });
    },
    onMutate: ({ id }) => {
      setItemUpdating(id, true);
    },
    onSuccess: (data) => {
      queryClient.setQueryData(CART_QUERY_KEY, data);
      queryClient.invalidateQueries({ queryKey: CART_QUERY_KEY });
    },
    onError: (err) => {
      const errorCode = getApiErrorCode(err);
      const message = getApiErrorMessage(err);

      if (errorCode === "CART_ITEM_NOT_FOUND") {
        toast.warn("Sản phẩm không còn trong giỏ hàng. Đang đồng bộ lại...");
        queryClient.invalidateQueries({ queryKey: CART_QUERY_KEY });
      } else if (errorCode === "CART_INVALID_QUANTITY") {
        toast.error("Số lượng cập nhật không hợp lệ.");
      } else {
        toast.error(message || "Lỗi khi cập nhật số lượng.");
      }
    },
    onSettled: (_, __, { id }) => {
      setItemUpdating(id, false);
    },
  });

  // 6. Mutation: Xóa món khỏi giỏ
  const removeItemMutation = useMutation({
    mutationFn: (id: string) => removeCartItemApi(id),
    onMutate: (id: string) => {
      setItemUpdating(id, true);
    },
    onSuccess: (data) => {
      queryClient.setQueryData(CART_QUERY_KEY, data);
      queryClient.invalidateQueries({ queryKey: CART_QUERY_KEY });
      toast.success("Đã xóa sản phẩm khỏi giỏ hàng.");
    },
    onError: (err) => {
      const errorCode = getApiErrorCode(err);
      const message = getApiErrorMessage(err);

      if (errorCode === "CART_ITEM_NOT_FOUND") {
        toast.info("Sản phẩm này đã được xóa trước đó.");
        queryClient.invalidateQueries({ queryKey: CART_QUERY_KEY });
      } else {
        toast.error(message || "Không thể xóa sản phẩm lúc này.");
      }
    },
    onSettled: (_, __, id: string) => {
      setItemUpdating(id, false);
    },
  });

  // Safe quantity controls with stock bounds & single flight
  const changeItemQuantity = useCallback(
    async (item: CartItem, newQuantity: number) => {
      if (updatingItemIds.has(item.id)) return;

      if (newQuantity <= 0) {
        removeItemMutation.mutate(item.id);
        return;
      }

      const maxStock = item.variant?.stockQuantity || 1;
      if (newQuantity > maxStock) {
        toast.warning(
          `Sản phẩm chỉ còn ${maxStock} món trong kho. Không thể tăng thêm.`
        );
        return;
      }

      updateQuantityMutation.mutate({ id: item.id, quantity: newQuantity });
    },
    [updatingItemIds, removeItemMutation, updateQuantityMutation]
  );

  return {
    cart,
    items,
    // Thông tin tổng toàn bộ giỏ (tương thích)
    totalItemCount,
    subtotalPrice,
    shippingFee,
    finalTotal,
    isFreeShipping,
    amountNeededForFreeShipping,
    freeShippingProgress,
    hasOutOfStockItems,
    hasExceededStockItems,
    // Thông tin các món ĐƯỢC CHỌN (Selection)
    selectedItemIds: effectiveSelectedIds,
    selectedItems,
    selectedItemCount,
    selectedSubtotalPrice,
    selectedShippingFee,
    selectedFinalTotal,
    // Thông tin Ưu Đãi Combo
    activeCombo,
    comboDiscountAmount,
    eligibleComboCount,
    isComboApplied,
    hasPartialCombo,
    selectedIsFreeShipping,
    selectedAmountNeededForFreeShipping,
    selectedFreeShippingProgress,
    hasSelectedOutOfStockItems,
    hasSelectedExceededStockItems,
    isItemSelected,
    toggleSelectItem,
    selectAllItems,
    unselectAllItems,
    toggleSelectAll,
    isAllSelected,
    selectableItemsCount,
    // Trạng thái truy vấn
    isLoading,
    isFetching,
    isError,
    error,
    updatingItemIds,
    refetch,
    addItem: addItemMutation.mutateAsync,
    isAddingItem: addItemMutation.isPending,
    changeItemQuantity,
    removeItem: (id: string) => removeItemMutation.mutate(id),
    isRemovingItem: removeItemMutation.isPending,
  };
}
