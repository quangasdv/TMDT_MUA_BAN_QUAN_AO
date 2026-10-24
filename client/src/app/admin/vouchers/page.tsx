"use client";

import React, { useState } from "react";
import { RoleGuard } from "@/components/auth/role-guard";
import { useAdminVouchers } from "../hooks/use-admin-vouchers";
import { AdminVoucher, UpdateVoucherPayload } from "../validation/admin.validation";
import {
  TicketPercent,
  Plus,
  RefreshCw,
  AlertCircle,
  Percent,
  DollarSign,
  X,
  Clock,
  Search,
  Edit3,
  Ban,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "react-toastify";

export default function AdminVouchersPage() {
  const {
    vouchers,
    totalCount,
    searchQuery,
    setSearchQuery,
    isLoading,
    isError,
    error,
    refetch,
    // Create
    isCreateModalOpen,
    setIsCreateModalOpen,
    createForm,
    setCreateForm,
    createVoucher,
    isCreating,
    // Edit
    isEditModalOpen,
    setIsEditModalOpen,
    voucherToEdit,
    editForm,
    setEditForm,
    openEditModal,
    updateVoucher,
    isUpdating,
    // Deactivate
    isConfirmDeactivateOpen,
    setIsConfirmDeactivateOpen,
    voucherToDeactivate,
    openDeactivateModal,
    confirmDeactivate,
    isDeleting,
  } = useAdminVouchers();

  // Lazy state initializer to ensure component render purity
  const [currentTimestamp] = useState(() => Date.now());

  const handleSubmitCreate = (e: React.FormEvent) => {
    e.preventDefault();

    const code = createForm.code.trim().toUpperCase();
    if (!code || code.length < 3) {
      toast.error("Mã voucher cần tối thiểu 3 ký tự.");
      return;
    }

    const val = Number(createForm.discountValue);
    if (!Number.isFinite(val) || val <= 0) {
      toast.error("Mức giảm giá phải lớn hơn 0.");
      return;
    }

    if (createForm.discountType === "PERCENT" && val > 100) {
      toast.error("Giảm theo phần trăm không được vượt quá 100%.");
      return;
    }

    if (!createForm.expiresAt) {
      toast.error("Vui lòng chọn ngày hết hạn cho voucher.");
      return;
    }

    createVoucher({
      code,
      discountType: createForm.discountType,
      discountValue: val,
      minOrderValue: Number(createForm.minOrderValue || 0),
      usageLimit: Number(createForm.usageLimit || 100),
      expiresAt: new Date(createForm.expiresAt).toISOString(),
    });
  };

  const handleSubmitEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!voucherToEdit) return;

    const payload: UpdateVoucherPayload = {};

    if (editForm.code && editForm.code.trim()) {
      payload.code = editForm.code.trim().toUpperCase();
    }

    if (editForm.discountType) {
      payload.discountType = editForm.discountType;
    }

    if (editForm.discountValue !== undefined) {
      const val = Number(editForm.discountValue);
      if (!Number.isFinite(val) || val <= 0) {
        toast.error("Mức giảm giá phải lớn hơn 0.");
        return;
      }
      if (editForm.discountType === "PERCENT" && val > 100) {
        toast.error("Giảm theo phần trăm không được vượt quá 100%.");
        return;
      }
      payload.discountValue = val;
    }

    if (editForm.minOrderValue !== undefined) {
      payload.minOrderValue = Number(editForm.minOrderValue || 0);
    }

    if (editForm.usageLimit !== undefined) {
      payload.usageLimit = Number(editForm.usageLimit || 100);
    }

    if (editForm.expiresAt) {
      payload.expiresAt = new Date(editForm.expiresAt).toISOString();
    }

    if (editForm.isActive !== undefined) {
      payload.isActive = editForm.isActive;
    }

    updateVoucher(voucherToEdit.id, payload);
  };

  const formatVND = (val: number | string) => {
    const num = typeof val === "string" ? parseFloat(val) : val;
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(num || 0);
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

  const getVoucherStatus = (v: AdminVoucher) => {
    if (v.isActive === false) {
      return {
        label: "Đã vô hiệu hóa",
        colorClass: "bg-slate-100 text-slate-700 border-slate-300",
      };
    }

    const isExpired = new Date(v.expiresAt).getTime() < currentTimestamp;
    const isExhausted = v.usedCount >= v.usageLimit;

    if (isExpired) {
      return {
        label: "Đã hết hạn",
        colorClass: "bg-rose-50 text-rose-900 border-rose-300",
      };
    }
    if (isExhausted) {
      return {
        label: "Đã hết lượt",
        colorClass: "bg-amber-50 text-amber-900 border-amber-300",
      };
    }
    return {
      label: "Còn hiệu lực",
      colorClass: "bg-emerald-50 text-emerald-900 border-emerald-300",
    };
  };

  return (
    <RoleGuard allowedRoles={["ADMIN"]}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
              Quản lý Mã giảm giá (Vouchers)
            </h1>
            <p className="text-sm text-slate-600 mt-1 font-medium">
              Khởi tạo các chương trình ưu đãi, kiểm soát tỷ lệ giảm và giới hạn lượt sử dụng trên hệ thống.
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
              <Plus size={16} />
              Tạo voucher mới
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
          <div className="relative w-full sm:max-w-md">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
            />
            <input
              type="text"
              placeholder="Tìm kiếm theo mã voucher (VD: WELCOME, FREESHIP)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 shadow-xs"
            />
          </div>
          <div className="text-xs text-slate-600 font-medium hidden sm:block">
            Tổng cộng: <strong className="text-slate-900">{totalCount}</strong> voucher
          </div>
        </div>

        {/* Error Notice */}
        {isError && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-300 text-rose-900 flex items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-3">
              <AlertCircle size={20} className="shrink-0 text-rose-600" />
              <p className="text-sm font-semibold">{error || "Đã xảy ra lỗi khi tải voucher."}</p>
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

        {/* Vouchers Table */}
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Mã Voucher</th>
                <th>Mức Giảm</th>
                <th>Đơn tối thiểu</th>
                <th>Tiến độ sử dụng</th>
                <th>Hạn sử dụng</th>
                <th>Trạng thái</th>
                <th className="text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 4 }).map((_, idx) => (
                  <tr key={idx}>
                    <td>
                      <Skeleton className="h-6 w-28 rounded-lg bg-slate-200" />
                    </td>
                    <td>
                      <Skeleton className="h-4 w-20 bg-slate-200" />
                    </td>
                    <td>
                      <Skeleton className="h-4 w-24 bg-slate-200" />
                    </td>
                    <td>
                      <Skeleton className="h-4 w-32 bg-slate-200" />
                    </td>
                    <td>
                      <Skeleton className="h-4 w-24 bg-slate-200" />
                    </td>
                    <td>
                      <Skeleton className="h-6 w-20 rounded-full bg-slate-200" />
                    </td>
                    <td className="text-right">
                      <Skeleton className="h-8 w-16 ml-auto bg-slate-200" />
                    </td>
                  </tr>
                ))
              ) : vouchers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-600">
                    <TicketPercent size={40} className="mx-auto text-slate-400 mb-2" />
                    <p className="font-bold text-slate-800 text-base">
                      Không tìm thấy voucher nào
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Hãy bấm &quot;Tạo voucher mới&quot; để phát hành mã ưu đãi cho khách hàng.
                    </p>
                  </td>
                </tr>
              ) : (
                vouchers.map((voucher) => {
                  const status = getVoucherStatus(voucher);
                  const usagePercent = Math.min(
                    100,
                    Math.round((voucher.usedCount / voucher.usageLimit) * 100)
                  );
                  const isDeactivated = voucher.isActive === false;

                  return (
                    <tr key={voucher.id} className={isDeactivated ? "opacity-60 bg-slate-50/50" : ""}>
                      {/* Code */}
                      <td>
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-100 text-slate-900 border border-slate-300 font-mono font-black text-sm tracking-wide shadow-xs">
                          <TicketPercent size={14} className="text-slate-700" />
                          {voucher.code}
                        </span>
                      </td>

                      {/* Discount Value */}
                      <td className="font-black text-slate-900 text-sm">
                        {voucher.discountType === "PERCENT" ? (
                          <span>Giảm {voucher.discountValue}%</span>
                        ) : (
                          <span>Giảm {formatVND(voucher.discountValue)}</span>
                        )}
                      </td>

                      {/* Min Order Value */}
                      <td className="text-xs text-slate-700 font-medium">
                        {Number(voucher.minOrderValue) > 0 ? (
                          formatVND(voucher.minOrderValue)
                        ) : (
                          <span className="text-slate-500">Không yêu cầu</span>
                        )}
                      </td>

                      {/* Usage Progress */}
                      <td>
                        <div className="space-y-1.5 min-w-[140px]">
                          <div className="flex justify-between text-xs font-semibold">
                            <span className="text-slate-800">
                              {voucher.usedCount} / {voucher.usageLimit}
                            </span>
                            <span className="text-slate-600">{usagePercent}%</span>
                          </div>
                          <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                            <div
                              className="bg-slate-900 h-full rounded-full transition-all"
                              style={{ width: `${usagePercent}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Expiration date */}
                      <td className="text-xs text-slate-700 font-medium whitespace-nowrap">
                        <span className="inline-flex items-center gap-1">
                          <Clock size={12} className="text-slate-500" />
                          {formatDate(voucher.expiresAt)}
                        </span>
                      </td>

                      {/* Status */}
                      <td>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${status.colorClass}`}
                        >
                          {status.label}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="text-right">
                        <div className="inline-flex items-center justify-end gap-1.5">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditModal(voucher)}
                            className="h-8 px-2.5 text-xs font-semibold text-slate-800 border-slate-300 hover:bg-slate-100 gap-1"
                            title="Chỉnh sửa voucher"
                          >
                            <Edit3 size={13} />
                            <span>Sửa</span>
                          </Button>
                          {!isDeactivated && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openDeactivateModal(voucher)}
                              className="h-8 px-2.5 text-xs font-semibold text-rose-700 border-rose-200 hover:bg-rose-50 gap-1"
                              title="Vô hiệu hóa voucher"
                            >
                              <Ban size={13} />
                              <span className="hidden sm:inline">Vô hiệu hóa</span>
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* MODAL: TẠO VOUCHER MỚI (Frosted Glass Backdrop) */}
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-200">
            <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-2xl p-6 space-y-5 text-slate-900">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-900 flex items-center justify-center font-bold">
                    <Plus size={18} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">
                      Tạo Voucher Khuyến mãi
                    </h3>
                    <p className="text-xs text-slate-600 font-medium">
                      Cung cấp mã giảm giá cho khách mua sắm tại TrendyFit
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
                {/* Voucher code */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-800">
                    Mã Voucher *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="VD: WELCOME2026, SUMMER50..."
                    value={createForm.code}
                    onChange={(e) =>
                      setCreateForm((prev) => ({
                        ...prev,
                        code: e.target.value.toUpperCase(),
                      }))
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-mono font-black tracking-wider text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 uppercase"
                  />
                </div>

                {/* Discount type selection */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-800 block">
                    Hình thức giảm giá *
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setCreateForm((prev) => ({
                          ...prev,
                          discountType: "PERCENT",
                          discountValue: 10,
                        }))
                      }
                      className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border text-xs font-bold transition cursor-pointer ${
                        createForm.discountType === "PERCENT"
                          ? "border-slate-900 bg-slate-900 text-white shadow-xs"
                          : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <Percent size={14} />
                      Theo phần trăm (%)
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setCreateForm((prev) => ({
                          ...prev,
                          discountType: "FIXED",
                          discountValue: 30000,
                        }))
                      }
                      className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border text-xs font-bold transition cursor-pointer ${
                        createForm.discountType === "FIXED"
                          ? "border-slate-900 bg-slate-900 text-white shadow-xs"
                          : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <DollarSign size={14} />
                      Số tiền cố định (VND)
                    </button>
                  </div>
                </div>

                {/* Discount Value */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-800">
                    Mức giảm ({createForm.discountType === "PERCENT" ? "%" : "VND"}) *
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    max={createForm.discountType === "PERCENT" ? 100 : undefined}
                    step={createForm.discountType === "PERCENT" ? 1 : 1000}
                    value={createForm.discountValue || ""}
                    onChange={(e) =>
                      setCreateForm((prev) => ({
                        ...prev,
                        discountValue: Number(e.target.value),
                      }))
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {/* Min order value */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-800">
                      Đơn tối thiểu (VND)
                    </label>
                    <input
                      type="number"
                      min={0}
                      step={1000}
                      placeholder="0"
                      value={createForm.minOrderValue || ""}
                      onChange={(e) =>
                        setCreateForm((prev) => ({
                          ...prev,
                          minOrderValue: Number(e.target.value),
                        }))
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
                    />
                  </div>

                  {/* Usage limit */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-800">
                      Lượt dùng tối đa *
                    </label>
                    <input
                      type="number"
                      required
                      min={1}
                      placeholder="100"
                      value={createForm.usageLimit || ""}
                      onChange={(e) =>
                        setCreateForm((prev) => ({
                          ...prev,
                          usageLimit: Number(e.target.value),
                        }))
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
                    />
                  </div>
                </div>

                {/* Expiration date */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-800">
                    Thời hạn hiệu lực *
                  </label>
                  <input
                    type="date"
                    required
                    value={createForm.expiresAt}
                    onChange={(e) =>
                      setCreateForm((prev) => ({
                        ...prev,
                        expiresAt: e.target.value,
                      }))
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
                    Tạo voucher
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: CHỈNH SỬA VOUCHER (PUT /api/admin/vouchers/:id) */}
        {isEditModalOpen && voucherToEdit && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-200">
            <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-2xl p-6 space-y-5 text-slate-900">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-900 flex items-center justify-center font-bold">
                    <Edit3 size={18} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">
                      Chỉnh sửa Voucher
                    </h3>
                    <p className="text-xs text-slate-600 font-medium">
                      Cập nhật thông tin mã voucher {voucherToEdit.code}
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
                {/* Voucher code */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-800">
                    Mã Voucher
                  </label>
                  <input
                    type="text"
                    required
                    value={editForm.code || ""}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        code: e.target.value.toUpperCase(),
                      }))
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-mono font-black tracking-wider text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 uppercase"
                  />
                </div>

                {/* Discount type selection */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-800 block">
                    Hình thức giảm giá
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setEditForm((prev) => ({
                          ...prev,
                          discountType: "PERCENT",
                        }))
                      }
                      className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border text-xs font-bold transition cursor-pointer ${
                        editForm.discountType === "PERCENT"
                          ? "border-slate-900 bg-slate-900 text-white shadow-xs"
                          : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <Percent size={14} />
                      Theo phần trăm (%)
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setEditForm((prev) => ({
                          ...prev,
                          discountType: "FIXED",
                        }))
                      }
                      className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border text-xs font-bold transition cursor-pointer ${
                        editForm.discountType === "FIXED"
                          ? "border-slate-900 bg-slate-900 text-white shadow-xs"
                          : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <DollarSign size={14} />
                      Số tiền cố định (VND)
                    </button>
                  </div>
                </div>

                {/* Discount Value */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-800">
                    Mức giảm ({editForm.discountType === "PERCENT" ? "%" : "VND"})
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    max={editForm.discountType === "PERCENT" ? 100 : undefined}
                    step={editForm.discountType === "PERCENT" ? 1 : 1000}
                    value={editForm.discountValue ?? ""}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        discountValue: Number(e.target.value),
                      }))
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {/* Min order value */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-800">
                      Đơn tối thiểu (VND)
                    </label>
                    <input
                      type="number"
                      min={0}
                      step={1000}
                      value={editForm.minOrderValue ?? ""}
                      onChange={(e) =>
                        setEditForm((prev) => ({
                          ...prev,
                          minOrderValue: Number(e.target.value),
                        }))
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
                    />
                  </div>

                  {/* Usage limit */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-800">
                      Lượt dùng tối đa
                    </label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={editForm.usageLimit ?? ""}
                      onChange={(e) =>
                        setEditForm((prev) => ({
                          ...prev,
                          usageLimit: Number(e.target.value),
                        }))
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
                    />
                  </div>
                </div>

                {/* Expiration date */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-800">
                    Thời hạn hiệu lực
                  </label>
                  <input
                    type="date"
                    required
                    value={editForm.expiresAt || ""}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        expiresAt: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
                  />
                </div>

                {/* Active toggle */}
                <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50">
                  <div>
                    <p className="text-xs font-bold text-slate-900">Kích hoạt mã giảm giá</p>
                    <p className="text-[11px] text-slate-600">Cho phép người mua áp dụng khi thanh toán</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editForm.isActive ?? true}
                      onChange={(e) =>
                        setEditForm((prev) => ({
                          ...prev,
                          isActive: e.target.checked,
                        }))
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-slate-900"></div>
                  </label>
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

        {/* MODAL: XÁC NHẬN VÔ HIỆU HÓA VOUCHER (DELETE /api/admin/vouchers/:id) */}
        {isConfirmDeactivateOpen && voucherToDeactivate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-200">
            <div className="w-full max-w-sm bg-white rounded-2xl border border-slate-200 shadow-2xl p-6 space-y-4 text-slate-900">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold shrink-0">
                  <AlertTriangle size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    Vô hiệu hóa Voucher?
                  </h3>
                  <p className="text-xs text-slate-600 font-medium mt-0.5">
                    Hành động này sẽ ẩn mã giảm giá và ngăn khách hàng tiếp tục sử dụng.
                  </p>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-600">Mã voucher:</span>
                  <span className="font-mono font-bold text-slate-900">{voucherToDeactivate.code}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Mức giảm:</span>
                  <span className="font-semibold text-slate-900">
                    {voucherToDeactivate.discountType === "PERCENT"
                      ? `${voucherToDeactivate.discountValue}%`
                      : formatVND(voucherToDeactivate.discountValue)}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsConfirmDeactivateOpen(false)}
                  disabled={isDeleting}
                  className="border-slate-300 text-slate-800 font-semibold"
                >
                  Hủy
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => confirmDeactivate(voucherToDeactivate.id)}
                  disabled={isDeleting}
                  className="bg-rose-600 hover:bg-rose-700 text-white font-bold shadow-xs cursor-pointer"
                >
                  {isDeleting ? (
                    <RefreshCw size={14} className="animate-spin mr-1.5" />
                  ) : null}
                  Xác nhận vô hiệu hóa
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </RoleGuard>
  );
}
