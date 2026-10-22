"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAdminOrdersApi, updateOrderStatusApi } from "../api/admin.api";
import { AdminOrder } from "../validation/admin.validation";
import { useAuthStore } from "@/stores/auth.store";
import { toast } from "react-toastify";

export function useAdminOrders() {
  const { user, isAuthenticated } = useAuthStore();
  const queryClient = useQueryClient();
  const canAccess = isAuthenticated && (user?.role === "ADMIN" || user?.role === "STAFF");

  const [page, setPage] = useState(1);
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Modals state
  const [selectedOrderForDetail, setSelectedOrderForDetail] = useState<AdminOrder | null>(null);
  const [orderToUpdateStatus, setOrderToUpdateStatus] = useState<AdminOrder | null>(null);
  const [targetStatus, setTargetStatus] = useState("");

  const {
    data: ordersResponse,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["admin-orders", page, selectedStatus],
    queryFn: () =>
      getAdminOrdersApi({
        status: selectedStatus === "ALL" ? undefined : selectedStatus,
        page,
        limit: 15,
      }),
    enabled: canAccess,
    staleTime: 10 * 1000,
  });

  const orders = useMemo(() => ordersResponse?.data?.orders || [], [ordersResponse]);
  const pagination = useMemo(
    () =>
      ordersResponse?.data?.pagination || {
        page: 1,
        limit: 15,
        total: 0,
        totalPages: 1,
      },
    [ordersResponse]
  );

  // Status mutation
  const statusMutation = useMutation({
    mutationFn: ({ orderId, status }: { orderId: string; status: string }) =>
      updateOrderStatusApi(orderId, status),
    onSuccess: (res, variables) => {
      toast.success(
        res.message || `Đã chuyển trạng thái đơn hàng sang "${variables.status}" thành công!`
      );
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
      setOrderToUpdateStatus(null);
      if (selectedOrderForDetail?.id === variables.orderId) {
        setSelectedOrderForDetail((prev) => (prev ? { ...prev, status: variables.status } : null));
      }
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Lỗi khi cập nhật trạng thái đơn hàng.";
      toast.error(msg);
    },
  });

  // Client-side search filtering
  const filteredOrders = useMemo(() => {
    if (!searchQuery.trim()) return orders;
    const q = searchQuery.toLowerCase().trim();
    return orders.filter(
      (order) =>
        order.orderCode.toString().includes(q) ||
        order.recipientName?.toLowerCase().includes(q) ||
        order.recipientPhone?.toLowerCase().includes(q) ||
        order.user?.email?.toLowerCase().includes(q)
    );
  }, [orders, searchQuery]);

  return {
    orders: filteredOrders,
    rawOrdersCount: orders.length,
    pagination,
    page,
    setPage,
    selectedStatus,
    setSelectedStatus,
    searchQuery,
    setSearchQuery,
    isLoading,
    isError,
    error: error instanceof Error ? error.message : null,
    refetch,
    // Modals & Actions
    selectedOrderForDetail,
    setSelectedOrderForDetail,
    orderToUpdateStatus,
    setOrderToUpdateStatus,
    targetStatus,
    setTargetStatus,
    isUpdating: statusMutation.isPending,
    updateStatus: (orderId: string, status: string) =>
      statusMutation.mutate({ orderId, status }),
  };
}

