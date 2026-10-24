"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getAdminUsersApi,
  createAdminUserApi,
  updateAdminUserApi,
} from "../api/admin.api";
import {
  AdminUser,
  CreateUserPayload,
  UpdateUserPayload,
} from "../validation/admin.validation";
import { useAuthStore } from "@/stores/auth.store";
import { toast } from "react-toastify";

export function useAdminUsers() {
  const { user: currentUser, isAuthenticated } = useAuthStore();
  const queryClient = useQueryClient();
  const isAdmin = isAuthenticated && currentUser?.role === "ADMIN";

  // Filter & Search states
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [page, setPage] = useState<number>(1);
  const limit = 10;

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<AdminUser | null>(null);

  // Form states
  const [createForm, setCreateForm] = useState<CreateUserPayload>({
    email: "",
    password: "",
    fullName: "",
    phone: "",
    role: "STAFF",
  });

  const [editForm, setEditForm] = useState<UpdateUserPayload>({
    fullName: "",
    phone: "",
    role: "STAFF",
    password: "",
  });

  const {
    data: usersResponse,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["admin-users", roleFilter, searchQuery, page, limit],
    queryFn: () =>
      getAdminUsersApi({
        role: roleFilter,
        q: searchQuery,
        page,
        limit,
      }),
    enabled: isAdmin,
    staleTime: 15 * 1000,
  });

  const users = useMemo(() => usersResponse?.data?.users || [], [usersResponse]);
  const pagination = useMemo(
    () =>
      usersResponse?.data?.pagination || {
        page: 1,
        limit,
        total: 0,
        totalPages: 1,
      },
    [usersResponse, limit]
  );

  const createMutation = useMutation({
    mutationFn: (payload: CreateUserPayload) => createAdminUserApi(payload),
    onSuccess: (res, variables) => {
      toast.success(res.message || `Đã tạo tài khoản cho "${variables.email}" thành công!`);
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      setIsCreateModalOpen(false);
      setCreateForm({
        email: "",
        password: "",
        fullName: "",
        phone: "",
        role: "STAFF",
      });
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Lỗi khi tạo tài khoản người dùng.";
      toast.error(msg);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateUserPayload }) =>
      updateAdminUserApi(id, payload),
    onSuccess: (res) => {
      toast.success(res.message || "Cập nhật tài khoản thành công!");
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      setIsEditModalOpen(false);
      setUserToEdit(null);
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Lỗi khi cập nhật tài khoản người dùng.";
      toast.error(msg);
    },
  });

  const openEditModal = (userItem: AdminUser) => {
    setUserToEdit(userItem);
    setEditForm({
      fullName: userItem.fullName,
      phone: userItem.phone || "",
      role: userItem.role,
      password: "",
    });
    setIsEditModalOpen(true);
  };

  const handleRoleChange = (role: string) => {
    setRoleFilter(role);
    setPage(1);
  };

  const handleSearchChange = (q: string) => {
    setSearchQuery(q);
    setPage(1);
  };

  return {
    users,
    pagination,
    roleFilter,
    handleRoleChange,
    searchQuery,
    handleSearchChange,
    page,
    setPage,
    isLoading,
    isError,
    error: error instanceof Error ? error.message : null,
    refetch,
    // Create
    isCreateModalOpen,
    setIsCreateModalOpen,
    createForm,
    setCreateForm,
    createUser: (payload: CreateUserPayload) => createMutation.mutate(payload),
    isCreating: createMutation.isPending,
    // Edit
    isEditModalOpen,
    setIsEditModalOpen,
    userToEdit,
    editForm,
    setEditForm,
    openEditModal,
    updateUser: (id: string, payload: UpdateUserPayload) =>
      updateMutation.mutate({ id, payload }),
    isUpdating: updateMutation.isPending,
  };
}

