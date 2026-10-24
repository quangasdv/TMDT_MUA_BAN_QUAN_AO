"use client";

import React from "react";
import { RoleGuard } from "@/components/auth/role-guard";
import { useAdminUsers } from "../hooks/use-admin-users";
import {
  USER_ROLE_LABELS,
  AdminUser,
} from "../validation/admin.validation";
import {
  Users,
  UserPlus,
  RefreshCw,
  Search,
  AlertCircle,
  X,
  Edit3,
  Shield,
  UserCheck,
  User,
  ShoppingBag,
  Calendar,
  Phone,
  Mail,
  ChevronLeft,
  ChevronRight,
  KeyRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "react-toastify";

const ROLE_FILTERS = [
  { key: "ALL", label: "Tất cả" },
  { key: "CUSTOMER", label: "Khách hàng" },
  { key: "STAFF", label: "Nhân viên" },
  { key: "ADMIN", label: "Quản trị viên" },
];

export default function AdminUsersPage() {
  const {
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
    error,
    refetch,
    // Create
    isCreateModalOpen,
    setIsCreateModalOpen,
    createForm,
    setCreateForm,
    createUser,
    isCreating,
    // Edit
    isEditModalOpen,
    setIsEditModalOpen,
    userToEdit,
    editForm,
    setEditForm,
    openEditModal,
    updateUser,
    isUpdating,
  } = useAdminUsers();

  const handleSubmitCreate = (e: React.FormEvent) => {
    e.preventDefault();

    if (!createForm.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(createForm.email.trim())) {
      toast.error("Vui lòng nhập email hợp lệ.");
      return;
    }

    if (!createForm.password || createForm.password.length < 6) {
      toast.error("Mật khẩu tối thiểu 6 ký tự.");
      return;
    }

    if (!createForm.fullName || createForm.fullName.trim().length < 2) {
      toast.error("Họ và tên tối thiểu 2 ký tự.");
      return;
    }

    if (createForm.phone && createForm.phone.trim()) {
      const phoneRegex = /^0[35789][0-9]{8}$/;
      if (!phoneRegex.test(createForm.phone.trim())) {
        toast.error("Số điện thoại phải có 10 chữ số và bắt đầu bằng 03, 05, 07, 08, 09.");
        return;
      }
    }

    createUser({
      email: createForm.email.trim().toLowerCase(),
      password: createForm.password,
      fullName: createForm.fullName.trim(),
      phone: createForm.phone ? createForm.phone.trim() : undefined,
      role: createForm.role || "STAFF",
    });
  };

  const handleSubmitEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userToEdit) return;

    if (!editForm.fullName || editForm.fullName.trim().length < 2) {
      toast.error("Họ và tên tối thiểu 2 ký tự.");
      return;
    }

    if (editForm.phone && editForm.phone.trim()) {
      const phoneRegex = /^0[35789][0-9]{8}$/;
      if (!phoneRegex.test(editForm.phone.trim())) {
        toast.error("Số điện thoại phải có 10 chữ số và bắt đầu bằng 03, 05, 07, 08, 09.");
        return;
      }
    }

    if (editForm.password && editForm.password.length < 6) {
      toast.error("Mật khẩu mới tối thiểu 6 ký tự.");
      return;
    }

    updateUser(userToEdit.id, {
      fullName: editForm.fullName.trim(),
      phone: editForm.phone ? editForm.phone.trim() : null,
      role: editForm.role,
      password: editForm.password ? editForm.password : undefined,
    });
  };

  const formatDate = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch {
      return iso;
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "ADMIN":
        return <Shield size={14} className="text-purple-700" />;
      case "STAFF":
        return <UserCheck size={14} className="text-blue-700" />;
      default:
        return <User size={14} className="text-slate-600" />;
    }
  };

  return (
    <RoleGuard allowedRoles={["ADMIN"]}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
              Quản lý Tài khoản (Users & Staff)
            </h1>
            <p className="text-sm text-slate-600 mt-1 font-medium">
              Kiểm soát tài khoản khách hàng, phân quyền nhân viên và quản trị viên trong hệ thống TrendyFit.
            </p>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isLoading}
              className="gap-2 bg-white text-slate-800 border-slate-300 hover:bg-slate-100 font-semibold shadow-xs"
            >
              <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
              Làm mới
            </Button>
            <Button
              size="sm"
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-primary text-primary-foreground font-black hover:bg-primary/90 gap-1.5 shadow-xs cursor-pointer px-4"
            >
              <UserPlus size={16} />
              Thêm tài khoản
            </Button>
          </div>
        </div>

        {/* Filters and Search Bar */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Filter Tabs */}
            <div className="flex flex-wrap items-center gap-1.5">
              {ROLE_FILTERS.map((f) => {
                const active = roleFilter === f.key;
                return (
                  <button
                    key={f.key}
                    type="button"
                    onClick={() => handleRoleChange(f.key)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                      active
                        ? "bg-slate-900 text-white shadow-xs"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200/80"
                    }`}
                  >
                    {f.label}
                  </button>
                );
              })}
            </div>

            {/* Search Box */}
            <div className="relative w-full md:w-80">
              <Search
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
              />
              <input
                type="text"
                placeholder="Tìm theo tên, email, SĐT..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 shadow-xs"
              />
            </div>
          </div>

          <div className="text-xs text-slate-600 font-medium flex items-center justify-between pt-2 border-t border-slate-100">
            <span>
              Tổng số tài khoản: <strong className="text-slate-900">{pagination.total}</strong>
            </span>
            <span>
              Trang {pagination.page} / {pagination.totalPages || 1}
            </span>
          </div>
        </div>

        {/* Error Notice */}
        {isError && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-300 text-rose-900 flex items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-3">
              <AlertCircle size={20} className="shrink-0 text-rose-600" />
              <p className="text-sm font-semibold">{error || "Đã xảy ra lỗi khi tải danh sách người dùng."}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              className="bg-white hover:bg-rose-100 border-rose-400 text-rose-900 font-bold"
            >
              Thử lại
            </Button>
          </div>
        )}

        {/* Users Table */}
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Người dùng</th>
                <th>Số điện thoại</th>
                <th>Vai trò</th>
                <th>Đơn hàng</th>
                <th>Ngày tham gia</th>
                <th className="text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={idx}>
                    <td>
                      <div className="flex items-center gap-3">
                        <Skeleton className="w-9 h-9 rounded-full bg-slate-200" />
                        <div className="space-y-1">
                          <Skeleton className="h-4 w-32 bg-slate-200" />
                          <Skeleton className="h-3 w-40 bg-slate-200" />
                        </div>
                      </div>
                    </td>
                    <td>
                      <Skeleton className="h-4 w-24 bg-slate-200" />
                    </td>
                    <td>
                      <Skeleton className="h-6 w-24 rounded-full bg-slate-200" />
                    </td>
                    <td>
                      <Skeleton className="h-4 w-12 bg-slate-200" />
                    </td>
                    <td>
                      <Skeleton className="h-4 w-20 bg-slate-200" />
                    </td>
                    <td className="text-right">
                      <Skeleton className="h-8 w-16 ml-auto bg-slate-200" />
                    </td>
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-600">
                    <Users size={40} className="mx-auto text-slate-400 mb-2" />
                    <p className="font-bold text-slate-800 text-base">
                      Không tìm thấy tài khoản phù hợp
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Thử điều chỉnh lại bộ lọc hoặc từ khóa tìm kiếm.
                    </p>
                  </td>
                </tr>
              ) : (
                users.map((item: AdminUser) => {
                  const roleStyle = USER_ROLE_LABELS[item.role] || {
                    label: item.role,
                    colorClass: "text-slate-800",
                    bgClass: "bg-slate-100 border-slate-300",
                  };
                  const orderCount = item._count?.orders ?? 0;

                  return (
                    <tr key={item.id}>
                      {/* User identity */}
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-slate-900 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-xs">
                            {item.fullName.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-slate-900 text-sm truncate">
                              {item.fullName}
                            </p>
                            <p className="text-xs text-slate-600 truncate flex items-center gap-1">
                              <Mail size={12} className="text-slate-400 shrink-0" />
                              {item.email}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Phone */}
                      <td className="text-xs font-medium text-slate-700 whitespace-nowrap">
                        {item.phone ? (
                          <span className="inline-flex items-center gap-1 text-slate-800">
                            <Phone size={12} className="text-slate-500" />
                            {item.phone}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">Chưa cập nhật</span>
                        )}
                      </td>

                      {/* Role Badge */}
                      <td>
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${roleStyle.bgClass} ${roleStyle.colorClass}`}
                        >
                          {getRoleIcon(item.role)}
                          {roleStyle.label}
                        </span>
                      </td>

                      {/* Orders count */}
                      <td>
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-800">
                          <ShoppingBag size={12} className="text-slate-500" />
                          {orderCount} đơn
                        </span>
                      </td>

                      {/* Created date */}
                      <td className="text-xs font-medium text-slate-600 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1">
                          <Calendar size={12} className="text-slate-400" />
                          {formatDate(item.createdAt)}
                        </span>
                      </td>

                      {/* Action */}
                      <td className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditModal(item)}
                          className="h-8 px-2.5 text-xs font-semibold text-slate-800 border-slate-300 hover:bg-slate-100 gap-1"
                          title="Sửa thông tin hoặc đổi vai trò"
                        >
                          <Edit3 size={13} />
                          <span>Sửa</span>
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
            <div className="text-xs text-slate-600 font-medium">
              Hiển thị trang <strong className="text-slate-900">{pagination.page}</strong> /{" "}
              {pagination.totalPages}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page <= 1 || isLoading}
                className="gap-1 border-slate-300 text-slate-800 font-semibold"
              >
                <ChevronLeft size={14} />
                Trước
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(Math.min(pagination.totalPages, page + 1))}
                disabled={page >= pagination.totalPages || isLoading}
                className="gap-1 border-slate-300 text-slate-800 font-semibold"
              >
                Sau
                <ChevronRight size={14} />
              </Button>
            </div>
          </div>
        )}

        {/* MODAL: TẠO TÀI KHOẢN MỚI (POST /api/admin/users) */}
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-200">
            <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-2xl p-6 space-y-5 text-slate-900">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-900 flex items-center justify-center font-bold">
                    <UserPlus size={18} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">
                      Tạo tài khoản mới
                    </h3>
                    <p className="text-xs text-slate-600 font-medium">
                      Cấp tài khoản Nhân viên hoặc Khách hàng vào hệ thống
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsCreateModalOpen(false)}
                  className="p-1 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSubmitCreate} className="space-y-4">
                {/* Full name */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-800">
                    Họ và tên *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Nguyễn Văn A"
                    value={createForm.fullName}
                    onChange={(e) =>
                      setCreateForm((prev) => ({ ...prev, fullName: e.target.value }))
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
                  />
                </div>

                {/* Email */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-800">
                    Địa chỉ Email *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="user@example.com"
                    value={createForm.email}
                    onChange={(e) =>
                      setCreateForm((prev) => ({ ...prev, email: e.target.value }))
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
                  />
                </div>

                {/* Password */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-800">
                    Mật khẩu khởi tạo *
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    placeholder="Tối thiểu 6 ký tự"
                    value={createForm.password}
                    onChange={(e) =>
                      setCreateForm((prev) => ({ ...prev, password: e.target.value }))
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
                  />
                </div>

                {/* Phone */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-800">
                    Số điện thoại (tùy chọn)
                  </label>
                  <input
                    type="tel"
                    placeholder="0912345678"
                    value={createForm.phone || ""}
                    onChange={(e) =>
                      setCreateForm((prev) => ({ ...prev, phone: e.target.value }))
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
                  />
                </div>

                {/* Role selection */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-800 block">
                    Vai trò tài khoản *
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(["STAFF", "ADMIN", "CUSTOMER"] as const).map((r) => {
                      const isSelected = createForm.role === r;
                      const label =
                        r === "STAFF"
                          ? "Nhân viên"
                          : r === "ADMIN"
                          ? "Quản trị"
                          : "Khách";
                      return (
                        <button
                          key={r}
                          type="button"
                          onClick={() => setCreateForm((prev) => ({ ...prev, role: r }))}
                          className={`flex items-center justify-center gap-1 py-2 px-2 rounded-xl border text-xs font-bold transition cursor-pointer ${
                            isSelected
                              ? "border-slate-900 bg-slate-900 text-white shadow-xs"
                              : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                          }`}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsCreateModalOpen(false)}
                    disabled={isCreating}
                    className="border-slate-300 text-slate-800 font-semibold"
                  >
                    Hủy bỏ
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={isCreating}
                    className="bg-slate-900 hover:bg-slate-800 text-white font-bold min-w-[120px] shadow-xs cursor-pointer"
                  >
                    {isCreating ? (
                      <RefreshCw size={14} className="animate-spin mr-1.5" />
                    ) : null}
                    Tạo tài khoản
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: CHỈNH SỬA TÀI KHOẢN (PUT /api/admin/users/:id) */}
        {isEditModalOpen && userToEdit && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-200">
            <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-2xl p-6 space-y-5 text-slate-900">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-900 flex items-center justify-center font-bold">
                    <Edit3 size={18} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">
                      Chỉnh sửa tài khoản
                    </h3>
                    <p className="text-xs text-slate-600 font-medium">
                      {userToEdit.email}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  className="p-1 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSubmitEdit} className="space-y-4">
                {/* Full name */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-800">
                    Họ và tên *
                  </label>
                  <input
                    type="text"
                    required
                    value={editForm.fullName || ""}
                    onChange={(e) =>
                      setEditForm((prev) => ({ ...prev, fullName: e.target.value }))
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
                  />
                </div>

                {/* Phone */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-800">
                    Số điện thoại
                  </label>
                  <input
                    type="tel"
                    placeholder="0912345678"
                    value={editForm.phone || ""}
                    onChange={(e) =>
                      setEditForm((prev) => ({ ...prev, phone: e.target.value }))
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
                  />
                </div>

                {/* Role selection */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-800 block">
                    Phân quyền vai trò *
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(["STAFF", "ADMIN", "CUSTOMER"] as const).map((r) => {
                      const isSelected = editForm.role === r;
                      const label =
                        r === "STAFF"
                          ? "Nhân viên"
                          : r === "ADMIN"
                          ? "Quản trị"
                          : "Khách";
                      return (
                        <button
                          key={r}
                          type="button"
                          onClick={() => setEditForm((prev) => ({ ...prev, role: r }))}
                          className={`flex items-center justify-center gap-1 py-2 px-2 rounded-xl border text-xs font-bold transition cursor-pointer ${
                            isSelected
                              ? "border-slate-900 bg-slate-900 text-white shadow-xs"
                              : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                          }`}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* New password (optional) */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1">
                    <KeyRound size={12} className="text-slate-500" />
                    Đổi mật khẩu mới (tùy chọn)
                  </label>
                  <input
                    type="password"
                    minLength={6}
                    placeholder="Để trống nếu không muốn đổi mật khẩu"
                    value={editForm.password || ""}
                    onChange={(e) =>
                      setEditForm((prev) => ({ ...prev, password: e.target.value }))
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
                  />
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditModalOpen(false)}
                    disabled={isUpdating}
                    className="border-slate-300 text-slate-800 font-semibold"
                  >
                    Hủy bỏ
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={isUpdating}
                    className="bg-slate-900 hover:bg-slate-800 text-white font-bold min-w-[120px] shadow-xs cursor-pointer"
                  >
                    {isUpdating ? (
                      <RefreshCw size={14} className="animate-spin mr-1.5" />
                    ) : null}
                    Lưu thay đổi
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </RoleGuard>
  );
}

