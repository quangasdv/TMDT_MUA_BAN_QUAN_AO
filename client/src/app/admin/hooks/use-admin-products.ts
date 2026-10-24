"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getAdminProductsApi,
  createAdminProductApi,
  updateAdminProductApi,
  deleteAdminProductApi,
} from "../api/admin.api";
import { getCategoriesApi } from "@/api/products.api";
import {
  AdminProduct,
  CreateProductPayload,
  UpdateProductPayload,
} from "../validation/admin.validation";
import { useAuthStore } from "@/stores/auth.store";
import { toast } from "react-toastify";

export function useAdminProducts() {
  const { user, isAuthenticated } = useAuthStore();
  const queryClient = useQueryClient();
  const isAdmin = isAuthenticated && user?.role === "ADMIN";

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "HIDDEN">("ALL");

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<AdminProduct | null>(null);
  const [productToDelete, setProductToDelete] = useState<AdminProduct | null>(null);

  // Form states
  const [createForm, setCreateForm] = useState<CreateProductPayload>({
    name: "",
    slug: "",
    description: "",
    basePrice: 0,
    categoryId: "",
    variants: [
      {
        sku: "",
        color: "Đen",
        size: "M",
        priceAdjustment: 0,
        stockQuantity: 50,
        imageUrl: "",
      },
    ],
  });

  const [updateForm, setUpdateForm] = useState<UpdateProductPayload>({
    name: "",
    description: "",
    basePrice: 0,
    categoryId: "",
    isActive: true,
    imageUrl: "",
  });

  const {
    data: productsResponse,
    isLoading: isProductsLoading,
    isError: isProductsError,
    error: productsError,
    refetch: refetchProducts,
  } = useQuery({
    queryKey: ["admin-products"],
    queryFn: getAdminProductsApi,
    enabled: isAdmin,
    staleTime: 15 * 1000,
  });

  const { data: categoriesResponse, isLoading: isCategoriesLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: getCategoriesApi,
    staleTime: 60 * 1000,
  });

  const products = useMemo(() => productsResponse?.data?.products || [], [productsResponse]);
  const categories = useMemo(() => categoriesResponse?.data?.categories || [], [categoriesResponse]);

  // Create Product Mutation
  const createMutation = useMutation({
    mutationFn: (payload: CreateProductPayload) => createAdminProductApi(payload),
    onSuccess: (res) => {
      toast.success(res.message || "Tạo sản phẩm mới thành công!");
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
      setIsCreateModalOpen(false);
      setCreateForm({
        name: "",
        slug: "",
        description: "",
        basePrice: 0,
        categoryId: categories[0]?.id || "",
        variants: [
          {
            sku: "",
            color: "Đen",
            size: "M",
            priceAdjustment: 0,
            stockQuantity: 50,
            imageUrl: "",
          },
        ],
      });
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Lỗi khi tạo sản phẩm.";
      toast.error(msg);
    },
  });

  // Update Product Mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateProductPayload }) =>
      updateAdminProductApi(id, payload),
    onSuccess: (res) => {
      toast.success(res.message || "Cập nhật sản phẩm thành công!");
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      setEditingProduct(null);
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Lỗi khi cập nhật sản phẩm.";
      toast.error(msg);
    },
  });

  // Delete / Hide Product Mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteAdminProductApi(id),
    onSuccess: (res) => {
      toast.success(res.message || "Đã ẩn sản phẩm khỏi hệ thống.");
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
      setProductToDelete(null);
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Lỗi khi ẩn sản phẩm.";
      toast.error(msg);
    },
  });

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (statusFilter === "ACTIVE" && !p.isActive) return false;
      if (statusFilter === "HIDDEN" && p.isActive) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      return (
        p.name.toLowerCase().includes(q) ||
        p.slug.toLowerCase().includes(q) ||
        p.category?.name.toLowerCase().includes(q)
      );
    });
  }, [products, statusFilter, searchQuery]);

  return {
    products: filteredProducts,
    allProductsCount: products.length,
    activeCount: products.filter((p) => p.isActive).length,
    hiddenCount: products.filter((p) => !p.isActive).length,
    categories,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    isLoading: isProductsLoading || isCategoriesLoading,
    isError: isProductsError,
    error: productsError instanceof Error ? productsError.message : null,
    refetch: refetchProducts,
    // Create state & actions
    isCreateModalOpen,
    setIsCreateModalOpen,
    createForm,
    setCreateForm,
    createProduct: (payload: CreateProductPayload) => createMutation.mutate(payload),
    isCreating: createMutation.isPending,
    // Edit state & actions
    editingProduct,
    setEditingProduct,
    updateForm,
    setUpdateForm,
    updateProduct: (id: string, payload: UpdateProductPayload) =>
      updateMutation.mutate({ id, payload }),
    isUpdating: updateMutation.isPending,
    // Delete state & actions
    productToDelete,
    setProductToDelete,
    deleteProduct: (id: string) => deleteMutation.mutate(id),
    isDeleting: deleteMutation.isPending,
  };
}

