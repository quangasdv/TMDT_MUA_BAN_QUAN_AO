"use client";

import { useMemo, useState, useCallback } from "react";
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

export const FREE_SHIPPING_THRESHOLD = 499000;
export const STANDARD_SHIPPING_FEE = 30000;

export function useCart() {
  const queryClient = useQueryClient();
  const [updatingItemIds, setUpdatingItemIds] = useState<Set<string>>(new Set());

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

  // 2. Tính toán các chỉ số tài chính và vận chuyển
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

  const shippingFee = useMemo(() => {
    if (items.length === 0) return 0;
    return isFreeShipping ? 0 : STANDARD_SHIPPING_FEE;
  }, [items.length, isFreeShipping]);

  const finalTotal = subtotalPrice + shippingFee;

  const amountNeededForFreeShipping = useMemo(() => {
    return Math.max(0, FREE_SHIPPING_THRESHOLD - subtotalPrice);
  }, [subtotalPrice]);

  const freeShippingProgress = useMemo(() => {
    if (items.length === 0) return 0;
    return Math.min(100, Math.round((subtotalPrice / FREE_SHIPPING_THRESHOLD) * 100));
  }, [subtotalPrice, items.length]);

  // Kiểm tra tính hợp lệ của tồn kho
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

  // 3. Mutation: Thêm sản phẩm vào giỏ
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

  // 4. Mutation: Cập nhật số lượng món
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

  // 5. Mutation: Xóa món khỏi giỏ
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
    totalItemCount,
    subtotalPrice,
    shippingFee,
    finalTotal,
    isFreeShipping,
    amountNeededForFreeShipping,
    freeShippingProgress,
    hasOutOfStockItems,
    hasExceededStockItems,
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
