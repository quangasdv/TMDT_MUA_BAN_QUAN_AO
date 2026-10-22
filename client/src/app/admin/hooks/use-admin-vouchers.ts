"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAdminVouchersApi, createAdminVoucherApi } from "../api/admin.api";
import {
  CreateVoucherPayload,
} from "../validation/admin.validation";
import { useAuthStore } from "@/stores/auth.store";
import { toast } from "react-toastify";

export function useAdminVouchers() {
  const { user, isAuthenticated } = useAuthStore();
  const queryClient = useQueryClient();
  const isAdmin = isAuthenticated && user?.role === "ADMIN";

  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Lazy initializer for default form
  const [createForm, setCreateForm] = useState<CreateVoucherPayload>(() => {
    const defaultDate = new Date();
    defaultDate.setDate(defaultDate.getDate() + 30);
    return {
      code: "",
      discountType: "PERCENT",
      discountValue: 10,
      minOrderValue: 0,
      usageLimit: 100,
      expiresAt: defaultDate.toISOString().split("T")[0],
    };
  });

  const {
    data: vouchersResponse,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["admin-vouchers"],
    queryFn: getAdminVouchersApi,
    enabled: isAdmin,
    staleTime: 15 * 1000,
  });

  const vouchers = useMemo(() => vouchersResponse?.data?.vouchers || [], [vouchersResponse]);

  const createMutation = useMutation({
    mutationFn: (payload: CreateVoucherPayload) => createAdminVoucherApi(payload),
    onSuccess: (res, variables) => {
      toast.success(res.message || `Đã tạo voucher "${variables.code}" thành công!`);
      queryClient.invalidateQueries({ queryKey: ["admin-vouchers"] });
      setIsCreateModalOpen(false);
      const resetDate = new Date();
      resetDate.setDate(resetDate.getDate() + 30);
      setCreateForm({
        code: "",
        discountType: "PERCENT",
        discountValue: 10,
        minOrderValue: 0,
        usageLimit: 100,
        expiresAt: resetDate.toISOString().split("T")[0],
      });
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Lỗi khi tạo mã giảm giá.";
      toast.error(msg);
    },
  });

  const filteredVouchers = useMemo(() => {
    if (!searchQuery.trim()) return vouchers;
    const q = searchQuery.toLowerCase().trim();
    return vouchers.filter((v) => v.code.toLowerCase().includes(q));
  }, [vouchers, searchQuery]);

  return {
    vouchers: filteredVouchers,
    totalCount: vouchers.length,
    searchQuery,
    setSearchQuery,
    isLoading,
    isError,
    error: error instanceof Error ? error.message : null,
    refetch,
    isCreateModalOpen,
    setIsCreateModalOpen,
    createForm,
    setCreateForm,
    createVoucher: (payload: CreateVoucherPayload) => createMutation.mutate(payload),
    isCreating: createMutation.isPending,
  };
}
