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
                  </tr>
                ))
              ) : vouchers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-600">
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

                  return (
                    <tr key={voucher.id}>
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
      </div>
    </RoleGuard>
  );
}
