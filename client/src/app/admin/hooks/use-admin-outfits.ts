"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getAdminOutfitsApi,
  createAdminOutfitApi,
  updateAdminOutfitApi,
  deleteAdminOutfitApi,
  getAdminProductsApi,
} from "../api/admin.api";
import {
  AdminOutfit,
  CreateOutfitPayload,
  UpdateOutfitPayload,
  AdminProduct,
} from "../validation/admin.validation";
import { useAuthStore } from "@/stores/auth.store";
import { toast } from "react-toastify";

export function useAdminOutfits() {
  const { user, isAuthenticated } = useAuthStore();
  const queryClient = useQueryClient();
  const isAdmin = isAuthenticated && user?.role === "ADMIN";

  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const [outfitToEdit, setOutfitToEdit] = useState<AdminOutfit | null>(null);
  const [outfitToDelete, setOutfitToDelete] = useState<AdminOutfit | null>(null);

  // Form state for creating combo
  const [createForm, setCreateForm] = useState<CreateOutfitPayload>({
    title: "",
    description: "",
    bannerUrl: "",
    discountRate: 0.15,
    isActive: true,
    items: [],
  });

  // Form state for editing combo
  const [editForm, setEditForm] = useState<UpdateOutfitPayload>({
    title: "",
    description: "",
    bannerUrl: "",
    discountRate: 0.15,
    isActive: true,
    items: [],
  });

  // 1. Query danh sách tất cả combo
  const {
    data: outfitsResponse,
    isLoading: isOutfitsLoading,
    isError: isOutfitsError,
    error: outfitsError,
    refetch: refetchOutfits,
  } = useQuery({
    queryKey: ["admin-outfits"],
    queryFn: getAdminOutfitsApi,
    enabled: isAdmin,
    staleTime: 15 * 1000,
  });

  // 2. Query danh sách tất cả sản phẩm để chọn món vào combo
  const {
    data: productsResponse,
    isLoading: isProductsLoading,
  } = useQuery({
    queryKey: ["admin-products"],
    queryFn: getAdminProductsApi,
    enabled: isAdmin,
    staleTime: 60 * 1000,
  });

  const rawOutfits = useMemo(() => outfitsResponse?.data?.outfits || [], [outfitsResponse]);
  const products: AdminProduct[] = useMemo(() => productsResponse?.data?.products || [], [productsResponse]);

  // Bộ lọc tìm kiếm
  const outfits = useMemo(() => {
    if (!searchQuery.trim()) return rawOutfits;
    const q = searchQuery.toLowerCase();
    return rawOutfits.filter(
      (o) =>
        o.title.toLowerCase().includes(q) ||
        (o.description && o.description.toLowerCase().includes(q))
    );
  }, [rawOutfits, searchQuery]);

  // 3. Mutation Tạo Combo
  const createMutation = useMutation({
    mutationFn: (payload: CreateOutfitPayload) => createAdminOutfitApi(payload),
    onSuccess: (res) => {
      toast.success(res.message || "Tạo combo thành công!");
      queryClient.invalidateQueries({ queryKey: ["admin-outfits"] });
      queryClient.invalidateQueries({ queryKey: ["combos-list"] });
      setIsCreateModalOpen(false);
      setCreateForm({
        title: "",
        description: "",
        bannerUrl: "",
        discountRate: 0.15,
        isActive: true,
        items: [],
      });
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || "Lỗi khi tạo combo.";
      toast.error(msg);
    },
  });

  // 4. Mutation Cập nhật Combo
  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateOutfitPayload }) =>
      updateAdminOutfitApi(id, payload),
    onSuccess: (res) => {
      toast.success(res.message || "Cập nhật combo thành công!");
      queryClient.invalidateQueries({ queryKey: ["admin-outfits"] });
      queryClient.invalidateQueries({ queryKey: ["combos-list"] });
      setIsEditModalOpen(false);
      setOutfitToEdit(null);
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || "Lỗi khi cập nhật combo.";
      toast.error(msg);
    },
  });

  // 5. Mutation Xóa Combo
  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteAdminOutfitApi(id),
    onSuccess: (res) => {
      toast.success(res.message || "Đã xóa combo thành công!");
      queryClient.invalidateQueries({ queryKey: ["admin-outfits"] });
      queryClient.invalidateQueries({ queryKey: ["combos-list"] });
      setIsDeleteModalOpen(false);
      setOutfitToDelete(null);
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || "Lỗi khi xóa combo.";
      toast.error(msg);
    },
  });

  // Mở modal sửa
  const openEditModal = (outfit: AdminOutfit) => {
    setOutfitToEdit(outfit);
    // Lấy danh sách các món quần áo đưa vào form sửa
    const clothingItems = outfit.items.filter((it) =>
      ["TOP", "BOTTOM", "OUTERWEAR"].includes(it.slotType)
    );
    setEditForm({
      title: outfit.title,
      description: outfit.description || "",
      bannerUrl: outfit.bannerUrl || "",
      discountRate: outfit.discountRate,
      isActive: outfit.isActive,
      items: (clothingItems.length > 0 ? clothingItems : outfit.items).map((it) => ({
        variantId: it.variantId,
        slotType: it.slotType,
      })),
    });
    setIsEditModalOpen(true);
  };

  // Mở modal xác nhận xóa
  const openDeleteModal = (outfit: AdminOutfit) => {
    setOutfitToDelete(outfit);
    setIsDeleteModalOpen(true);
  };

  // Bật/tắt trạng thái combo
  const toggleStatus = (outfit: AdminOutfit) => {
    updateMutation.mutate({
      id: outfit.id,
      payload: { isActive: !outfit.isActive },
    });
  };

  return {
    outfits,
    totalCount: rawOutfits.length,
    products,
    searchQuery,
    setSearchQuery,
    isLoading: isOutfitsLoading,
    isProductsLoading,
    isError: isOutfitsError,
    error: outfitsError instanceof Error ? outfitsError.message : null,
    refetch: refetchOutfits,
    // Create
    isCreateModalOpen,
    setIsCreateModalOpen,
    createForm,
    setCreateForm,
    createOutfit: createMutation.mutate,
    isCreating: createMutation.isPending,
    // Edit
    isEditModalOpen,
    setIsEditModalOpen,
    outfitToEdit,
    editForm,
    setEditForm,
    openEditModal,
    updateOutfit: (payload: UpdateOutfitPayload) => {
      if (outfitToEdit) {
        // Giữ lại các món phụ kiện nếu có sẵn trước đó
        const existingAccessories = outfitToEdit.items
          .filter((it) => ["SHOES", "ACCESSORY"].includes(it.slotType))
          .map((it) => ({ variantId: it.variantId, slotType: it.slotType }));

        const itemsToSave = payload.items
          ? [...payload.items, ...existingAccessories]
          : undefined;

        updateMutation.mutate({
          id: outfitToEdit.id,
          payload: {
            ...payload,
            items: itemsToSave,
          },
        });
      }
    },
    isUpdating: updateMutation.isPending,
    toggleStatus,
    // Delete
    isDeleteModalOpen,
    setIsDeleteModalOpen,
    outfitToDelete,
    openDeleteModal,
    confirmDelete: () => {
      if (outfitToDelete) {
        deleteMutation.mutate(outfitToDelete.id);
      }
    },
    isDeleting: deleteMutation.isPending,
  };
}
