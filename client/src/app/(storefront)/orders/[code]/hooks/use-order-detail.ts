"use client";

import { useQuery } from "@tanstack/react-query";
import { getOrderDetailApi } from "../api/order-detail.api";
import { Order } from "@/app/(storefront)/orders/validation/orders.validation";
import { useAuthStore } from "@/stores/auth.store";

export function useOrderDetail(orderCodeParam: string | number) {
  const { isAuthenticated, isInitialized } = useAuthStore();
  const orderCode =
    typeof orderCodeParam === "string" ? parseInt(orderCodeParam, 10) : orderCodeParam;

  const {
    data: orderResponse,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["order-detail", orderCode],
    queryFn: () => getOrderDetailApi(orderCode),
    enabled: isAuthenticated && isInitialized && !isNaN(orderCode) && orderCode > 0,
    refetchInterval: (query) => {
      const order = query.state.data?.data?.order;
      // Nếu đơn hàng đang PENDING_PAYMENT, poll mỗi 5s để tự động cập nhật khi thanh toán hoàn tất
      if (order?.status === "PENDING_PAYMENT") {
        return 5000;
      }
      return false;
    },
    staleTime: 5000,
  });

  const order: Order | undefined = orderResponse?.data?.order;

  return {
    orderCode,
    order,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
    isAuthenticated,
    isInitialized,
  };
}
