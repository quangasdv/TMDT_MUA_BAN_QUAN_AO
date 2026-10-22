"use client";

import React from "react";
import Link from "next/link";
import { RoleGuard } from "@/components/auth/role-guard";
import { useAdminStats } from "./hooks/use-admin-stats";
import {
  DollarSign,
  ShoppingBag,
  CheckCircle2,
  Users,
  Shirt,
  RefreshCw,
  AlertCircle,
  ArrowRight,
  TrendingUp,
  Package,
  TicketPercent,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminDashboardPage() {
  const { stats, isLoading, isError, error, refetch } = useAdminStats();

  const formatVND = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  return (
    <RoleGuard allowedRoles={["ADMIN"]}>
      <div className="space-y-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Tổng quan Hệ thống
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Số liệu thống kê thực tế được cập nhật trực tiếp từ cơ sở dữ liệu TrendyFit.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading}
            className="self-start sm:self-auto gap-2 text-slate-700 dark:text-slate-300"
          >
            <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
            Làm mới số liệu
          </Button>
        </div>

        {/* Error State */}
        {isError && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 dark:bg-rose-950/40 dark:border-rose-900 dark:text-rose-300 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <AlertCircle size={20} className="shrink-0 text-rose-600" />
              <p className="text-sm font-medium">{error || "Đã xảy ra lỗi khi tải số liệu thống kê."}</p>
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

        {/* KPI Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {/* 1. Tổng doanh thu thực tế */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Doanh thu (Đã thanh toán)
              </span>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <DollarSign size={20} />
              </div>
            </div>
            <div className="mt-3">
              {isLoading ? (
                <Skeleton className="h-8 w-32" />
              ) : (
                <p className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                  {formatVND(stats?.totalRevenue ?? 0)}
                </p>
              )}
            </div>
            <div className="mt-2 flex items-center text-xs text-emerald-600 dark:text-emerald-400 font-medium gap-1">
              <TrendingUp size={14} />
              <span>Dựa trên các đơn hàng đã thanh toán</span>
            </div>
          </div>

          {/* 2. Đơn hàng đã thanh toán */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Đơn đã thanh toán
              </span>
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <CheckCircle2 size={20} />
              </div>
            </div>
            <div className="mt-3">
              {isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <p className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                  {stats?.paidOrdersCount?.toLocaleString("vi-VN") ?? 0}
                </p>
              )}
            </div>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              Đơn hàng thành công
            </p>
          </div>

          {/* 3. Tổng số đơn hàng */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Tổng số đơn hàng
              </span>
              <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <ShoppingBag size={20} />
              </div>
            </div>
            <div className="mt-3">
              {isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <p className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                  {stats?.totalOrders?.toLocaleString("vi-VN") ?? 0}
                </p>
              )}
            </div>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              Tất cả trạng thái
            </p>
          </div>

          {/* 4. Tổng số khách hàng */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Khách hàng
              </span>
              <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <Users size={20} />
              </div>
            </div>
            <div className="mt-3">
              {isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <p className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                  {stats?.totalUsers?.toLocaleString("vi-VN") ?? 0}
                </p>
              )}
            </div>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              Tài khoản CUSTOMER đã đăng ký
            </p>
          </div>

          {/* 5. Sản phẩm đang hoạt động */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Sản phẩm mở bán
              </span>
              <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                <Shirt size={20} />
              </div>
            </div>
            <div className="mt-3">
              {isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <p className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                  {stats?.totalProducts?.toLocaleString("vi-VN") ?? 0}
                </p>
              )}
            </div>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              Trạng thái isActive = true
            </p>
          </div>
        </div>

        {/* Quick Management Navigation Cards */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Phím tắt Quản lý Nhanh
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Orders shortcut */}
            <Link
              href="/admin/orders"
              className="group p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-600 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Package size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">
                    Quản lý Đơn hàng
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                    Xem danh sách đơn hàng, lọc theo trạng thái và cập nhật trạng thái đơn hàng theo đúng quy trình State Machine.
                  </p>
                </div>
              </div>
              <div className="mt-5 flex items-center text-xs font-semibold text-indigo-600 dark:text-indigo-400 gap-1.5 group-hover:gap-2.5 transition-all">
                <span>Đi đến đơn hàng</span>
                <ArrowRight size={14} />
              </div>
            </Link>

            {/* Products shortcut */}
            <Link
              href="/admin/products"
              className="group p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-purple-400 dark:hover:border-purple-600 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Shirt size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">
                    Quản lý Sản phẩm
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                    Thêm sản phẩm mới kèm biến thể màu sắc, size, cập nhật giá gốc hoặc ẩn sản phẩm khỏi hệ thống storefront.
                  </p>
                </div>
              </div>
              <div className="mt-5 flex items-center text-xs font-semibold text-purple-600 dark:text-purple-400 gap-1.5 group-hover:gap-2.5 transition-all">
                <span>Đi đến sản phẩm</span>
                <ArrowRight size={14} />
              </div>
            </Link>

            {/* Vouchers shortcut */}
            <Link
              href="/admin/vouchers"
              className="group p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-amber-400 dark:hover:border-amber-600 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <TicketPercent size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">
                    Quản lý Mã giảm giá (Vouchers)
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                    Tạo voucher khuyến mãi theo % hoặc số tiền cố định, giới hạn lượt dùng và theo dõi tiến độ sử dụng thực tế.
                  </p>
                </div>
              </div>
              <div className="mt-5 flex items-center text-xs font-semibold text-amber-600 dark:text-amber-400 gap-1.5 group-hover:gap-2.5 transition-all">
                <span>Đi đến mã giảm giá</span>
                <ArrowRight size={14} />
              </div>
            </Link>
          </div>
        </div>
      </div>
    </RoleGuard>
  );
}

