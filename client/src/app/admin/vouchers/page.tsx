"use client";

import React, { useState } from "react";
import { RoleGuard } from "@/components/auth/role-guard";
import { useAdminVouchers } from "../hooks/use-admin-vouchers";
import { AdminVoucher } from "../validation/admin.validation";
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
    isCreateModalOpen,
    setIsCreateModalOpen,
    createForm,
    setCreateForm,
    createVoucher,
    isCreating,
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
    const isExpired = new Date(v.expiresAt).getTime() < currentTimestamp;
    const isExhausted = v.usedCount >= v.usageLimit;

    if (isExpired) {
      return {
        label: "Đã hết hạn",
        colorClass: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900",
      };
    }
    if (isExhausted) {
      return {
        label: "Đã hết lượt",
        colorClass: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900",
      };
    }
    return {
      label: "Còn hiệu lực",
      colorClass: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800",
    };
  };

  return (
    <RoleGuard allowedRoles={["ADMIN"]}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Quản lý Mã giảm giá (Vouchers)
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Khởi tạo các chương trình ưu đãi, kiểm soát tỷ lệ giảm và giới hạn lượt sử dụng trên hệ thống.
            </p>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isLoading}
              className="gap-2"
            >
              <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
              Làm mới
            </Button>
            <Button
              size="sm"
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5 shadow-sm"
            >
              <Plus size={16} />
              Tạo voucher mới
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div className="relative w-full sm:max-w-md">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder="Tìm kiếm theo mã voucher (VD: WELCOME, FREESHIP)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>
          <div className="text-xs text-slate-400 hidden sm:block">
            Tổng cộng: <strong>{totalCount}</strong> voucher
          </div>
        </div>

        {/* Error Notice */}
        {isError && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 dark:bg-rose-950/40 dark:border-rose-900 dark:text-rose-300 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <AlertCircle size={20} className="shrink-0 text-rose-600" />
              <p className="text-sm font-medium">{error || "Đã xảy ra lỗi khi tải voucher."}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              className="bg-white hover:bg-rose-50 border-rose-300 text-rose-700"
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
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 4 }).map((_, idx) => (
                  <tr key={idx}>
                    <td>
                      <Skeleton className="h-6 w-28 rounded-lg" />
                    </td>
                    <td>
                      <Skeleton className="h-4 w-20" />
                    </td>
                    <td>
                      <Skeleton className="h-4 w-24" />
                    </td>
                    <td>
                      <Skeleton className="h-4 w-32" />
                    </td>
                    <td>
                      <Skeleton className="h-4 w-24" />
                    </td>
                    <td>
                      <Skeleton className="h-5 w-20 rounded-full" />
                    </td>
                  </tr>
                ))
              ) : vouchers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-500">
                    <TicketPercent size={40} className="mx-auto text-slate-300 mb-2" />
                    <p className="font-medium text-slate-700 dark:text-slate-300">
                      Không tìm thấy voucher nào
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
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

                  return (
                    <tr key={voucher.id}>
                      {/* Code */}
                      <td>
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800 font-mono font-bold text-sm tracking-wide">
                          <TicketPercent size={14} />
                          {voucher.code}
                        </span>
                      </td>

                      {/* Discount Value */}
                      <td className="font-bold text-slate-900 dark:text-white text-sm">
                        {voucher.discountType === "PERCENT" ? (
                          <span className="text-indigo-600 dark:text-indigo-400">
                            Giảm {voucher.discountValue}%
                          </span>
                        ) : (
                          <span className="text-emerald-600 dark:text-emerald-400">
                            Giảm {formatVND(voucher.discountValue)}
                          </span>
                        )}
                      </td>

                      {/* Min Order Value */}
                      <td className="text-xs text-slate-600 dark:text-slate-300">
                        {Number(voucher.minOrderValue) > 0 ? (
                          formatVND(voucher.minOrderValue)
                        ) : (
                          <span className="text-slate-400">Không yêu cầu</span>
                        )}
                      </td>

                      {/* Usage Progress */}
                      <td>
                        <div className="space-y-1.5 min-w-[140px]">
                          <div className="flex justify-between text-xs font-medium">
                            <span className="text-slate-700 dark:text-slate-300">
                              {voucher.usedCount} / {voucher.usageLimit}
                            </span>
                            <span className="text-slate-400">{usagePercent}%</span>
                          </div>
                          <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                            <div
                              className="bg-indigo-600 h-full rounded-full transition-all"
                              style={{ width: `${usagePercent}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Expiration date */}
                      <td className="text-xs text-slate-600 dark:text-slate-300 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1">
                          <Clock size={12} className="text-slate-400" />
                          {formatDate(voucher.expiresAt)}
                        </span>
                      </td>

                      {/* Status */}
                      <td>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${status.colorClass}`}
                        >
                          {status.label}
                        </span>
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/25 dark:bg-black/40 backdrop-blur-md animate-in fade-in duration-200">
            <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 flex items-center justify-center">
                    <Plus size={18} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-base">
                      Tạo Voucher Khuyến mãi
                    </h3>
                    <p className="text-xs text-slate-500">
                      Cung cấp mã giảm giá cho khách mua sắm tại TrendyFit
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsCreateModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSubmitCreate} className="space-y-4">
                {/* Voucher code */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
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
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-mono font-bold tracking-wider text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 uppercase"
                  />
                </div>

                {/* Discount type selection */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
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
                      className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border text-xs font-semibold transition ${
                        createForm.discountType === "PERCENT"
                          ? "border-indigo-600 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:border-indigo-500 dark:text-indigo-300"
                          : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400"
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
                      className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border text-xs font-semibold transition ${
                        createForm.discountType === "FIXED"
                          ? "border-indigo-600 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:border-indigo-500 dark:text-indigo-300"
                          : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400"
                      }`}
                    >
                      <DollarSign size={14} />
                      Số tiền cố định (VND)
                    </button>
                  </div>
                </div>

                {/* Discount Value */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
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
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {/* Min order value */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
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
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>

                  {/* Usage limit */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
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
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                </div>

                {/* Expiration date */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
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
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsCreateModalOpen(false)}
                    disabled={isCreating}
                  >
                    Hủy bỏ
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={isCreating}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white min-w-[120px]"
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
      </div>
    </RoleGuard>
  );
}

