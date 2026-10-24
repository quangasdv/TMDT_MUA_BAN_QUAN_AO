"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getAdminVouchersApi,
  createAdminVoucherApi,
  updateAdminVoucherApi,
  deleteAdminVoucherApi,
} from "../api/admin.api";
import {
  CreateVoucherPayload,
  UpdateVoucherPayload,
  AdminVoucher,
} from "../validation/admin.validation";
import { useAuthStore } from "@/stores/auth.store";
import { toast } from "react-toastify";

export function useAdminVouchers() {
  const { user, isAuthenticated } = useAuthStore();
  const queryClient = useQueryClient();
  const isAdmin = isAuthenticated && user?.role === "ADMIN";

  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isConfirmDeactivateOpen, setIsConfirmDeactivateOpen] = useState(false);

  const [voucherToEdit, setVoucherToEdit] = useState<AdminVoucher | null>(null);
  const [voucherToDeactivate, setVoucherToDeactivate] = useState<AdminVoucher | null>(null);

  // Lazy initializer for default create form
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

  // Edit form state
  const [editForm, setEditForm] = useState<UpdateVoucherPayload>({
    code: "",
    discountType: "PERCENT",
    discountValue: 10,
    minOrderValue: 0,
    usageLimit: 100,
    expiresAt: "",
    isActive: true,
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

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateVoucherPayload }) =>
      updateAdminVoucherApi(id, payload),
    onSuccess: (res) => {
      toast.success(res.message || "Cập nhật voucher thành công!");
      queryClient.invalidateQueries({ queryKey: ["admin-vouchers"] });
      setIsEditModalOpen(false);
      setVoucherToEdit(null);
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Lỗi khi cập nhật mã giảm giá.";
      toast.error(msg);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteAdminVoucherApi(id),
    onSuccess: (res) => {
      toast.success(res.message || "Đã vô hiệu hóa voucher thành công!");
      queryClient.invalidateQueries({ queryKey: ["admin-vouchers"] });
      setIsConfirmDeactivateOpen(false);
      setVoucherToDeactivate(null);
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Lỗi khi vô hiệu hóa mã giảm giá.";
      toast.error(msg);
    },
  });

  const openEditModal = (voucher: AdminVoucher) => {
    setVoucherToEdit(voucher);
    let expFormatted = "";
    try {
      expFormatted = new Date(voucher.expiresAt).toISOString().split("T")[0];
    } catch {
      expFormatted = "";
    }
    setEditForm({
      code: voucher.code,
      discountType: voucher.discountType,
      discountValue: Number(voucher.discountValue),
      minOrderValue: Number(voucher.minOrderValue),
      usageLimit: Number(voucher.usageLimit),
      expiresAt: expFormatted,
      isActive: voucher.isActive !== false,
    });
    setIsEditModalOpen(true);
  };

  const openDeactivateModal = (voucher: AdminVoucher) => {
    setVoucherToDeactivate(voucher);
    setIsConfirmDeactivateOpen(true);
  };

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
    // Create
    isCreateModalOpen,
    setIsCreateModalOpen,
    createForm,
    setCreateForm,
    createVoucher: (payload: CreateVoucherPayload) => createMutation.mutate(payload),
    isCreating: createMutation.isPending,
    // Edit
    isEditModalOpen,
    setIsEditModalOpen,
    voucherToEdit,
    editForm,
    setEditForm,
    openEditModal,
    updateVoucher: (id: string, payload: UpdateVoucherPayload) =>
      updateMutation.mutate({ id, payload }),
    isUpdating: updateMutation.isPending,
    // Deactivate
    isConfirmDeactivateOpen,
    setIsConfirmDeactivateOpen,
    voucherToDeactivate,
    openDeactivateModal,
    confirmDeactivate: (id: string) => deleteMutation.mutate(id),
    isDeleting: deleteMutation.isPending,
  };
}
