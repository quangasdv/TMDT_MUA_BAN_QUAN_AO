"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getUserOrdersApi } from "../api/orders.api";
import { Order, OrderStatus } from "../validation/orders.validation";
import { useAuthStore } from "@/stores/auth.store";

export type OrderFilterTab = "ALL" | OrderStatus;

export function useOrders() {
  const { isAuthenticated, isInitialized } = useAuthStore();
  const [activeTab, setActiveTab] = useState<OrderFilterTab>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const {
    data: ordersResponse,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["user-orders"],
    queryFn: getUserOrdersApi,
    enabled: isAuthenticated && isInitialized,
    staleTime: 10 * 1000,
  });

  const orders: Order[] = useMemo(() => ordersResponse?.data?.orders || [], [ordersResponse]);

  // Đếm số lượng đơn hàng theo từng nhóm trạng thái
  const counts = useMemo(() => {
    const res: Record<string, number> = {
      ALL: orders.length,
      PENDING_PAYMENT: 0,
      PAID: 0,
      PROCESSING: 0,
      SHIPPED: 0,
      DELIVERED: 0,
      CANCELLED: 0,
    };

    orders.forEach((ord) => {
      if (res[ord.status] !== undefined) {
        res[ord.status]++;
      }
    });

    return res;
  }, [orders]);

  // Lọc theo tab trạng thái và tìm kiếm mã đơn
  const filteredOrders = useMemo(() => {
    return orders.filter((ord) => {
      // 1. Lọc theo tab
      if (activeTab !== "ALL" && ord.status !== activeTab) {
        return false;
      }

      // 2. Lọc theo chuỗi tìm kiếm mã đơn hoặc tên người nhận
      if (searchQuery.trim()) {
        const query = searchQuery.trim().toLowerCase();
        const codeMatches = ord.orderCode.toString().includes(query);
        const nameMatches = ord.recipientName.toLowerCase().includes(query);
        const itemMatches = ord.items.some((it) =>
          it.variant?.product?.name?.toLowerCase().includes(query)
        );
        return codeMatches || nameMatches || itemMatches;
      }

      return true;
    });
  }, [orders, activeTab, searchQuery]);

  return {
    orders: filteredOrders,
    rawOrdersCount: orders.length,
    counts,
    activeTab,
    setActiveTab,
    searchQuery,
    setSearchQuery,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
    isAuthenticated,
    isInitialized,
  };
}

