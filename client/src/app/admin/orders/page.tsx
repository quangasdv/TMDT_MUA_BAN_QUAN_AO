"use client";

import React from "react";
import { RoleGuard } from "@/components/auth/role-guard";
import { useAdminOrders } from "../hooks/use-admin-orders";
import {
  AdminOrder,
  ALLOWED_STATUS_TRANSITIONS,
  ORDER_STATUS_LABELS,
  PAYMENT_STATUS_LABELS,
} from "../validation/admin.validation";
import {
  Package,
  Search,
  RefreshCw,
  AlertCircle,
  Eye,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  User,
  X,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

const STATUS_FILTER_TABS = [
  { key: "ALL", label: "Tất cả" },
  { key: "PENDING_PAYMENT", label: "Chờ thanh toán" },
  { key: "PAID", label: "Đã thanh toán" },
  { key: "PROCESSING", label: "Đang xử lý" },
  { key: "SHIPPING", label: "Đang giao" },
  { key: "DELIVERED", label: "Đã giao" },
  { key: "CANCELLED", label: "Đã hủy" },
];

export default function AdminOrdersPage() {
  const {
    orders,
    pagination,
    page,
    setPage,
    selectedStatus,
    setSelectedStatus,
    searchQuery,
    setSearchQuery,
    isLoading,
    isError,
    error,
    refetch,
    selectedOrderForDetail,
    setSelectedOrderForDetail,
    orderToUpdateStatus,
    setOrderToUpdateStatus,
    targetStatus,
    setTargetStatus,
    isUpdating,
    updateStatus,
  } = useAdminOrders();

  const handleOpenStatusModal = (order: AdminOrder) => {
    setOrderToUpdateStatus(order);
    const validStates = ALLOWED_STATUS_TRANSITIONS[order.status] || [];
    setTargetStatus(validStates.length > 0 ? validStates[0] : "");
  };

  const handleConfirmStatusUpdate = () => {
    if (!orderToUpdateStatus || !targetStatus) return;
    updateStatus(orderToUpdateStatus.id, targetStatus);
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
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return iso;
    }
  };

  return (
    <RoleGuard allowedRoles={["ADMIN", "STAFF"]}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
              Quản lý Đơn hàng
            </h1>
            <p className="text-sm text-slate-600 mt-1 font-medium">
              Theo dõi toàn bộ đơn hàng, kiểm tra chi tiết thanh toán và điều phối quy trình vận chuyển.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading}
            className="self-start sm:self-auto gap-2 bg-white text-slate-800 border-slate-300 hover:bg-slate-100 font-semibold shadow-xs"
          >
            <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
            Làm mới
          </Button>
        </div>

        {/* Filters and Search Bar */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
          {/* Status Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs">
            {STATUS_FILTER_TABS.map((tab) => {
              const active = selectedStatus === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setSelectedStatus(tab.key)}
                  className={`px-3.5 py-2 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
                    active
                      ? "bg-slate-900 text-white shadow-xs"
                      : "text-slate-700 bg-slate-50 border border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Search box */}
          <div className="relative">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
            />
            <input
              type="text"
              placeholder="Tìm kiếm theo mã đơn hàng (#12345), tên người nhận hoặc số điện thoại..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 shadow-xs"
            />
          </div>
        </div>

        {/* Error State */}
        {isError && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-300 text-rose-900 flex items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-3">
              <AlertCircle size={20} className="shrink-0 text-rose-600" />
              <p className="text-sm font-semibold">{error || "Đã xảy ra lỗi khi tải đơn hàng."}</p>
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

        {/* Orders Table Container */}
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Mã Đơn</th>
                <th>Khách hàng & Người nhận</th>
                <th>Sản phẩm</th>
                <th>Tổng thanh toán</th>
                <th>Thanh toán</th>
                <th>Trạng thái đơn</th>
                <th>Thời gian</th>
                <th className="text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={idx}>
                    <td>
                      <Skeleton className="h-4 w-16 bg-slate-200" />
                    </td>
                    <td>
                      <div className="space-y-1">
                        <Skeleton className="h-4 w-28 bg-slate-200" />
                        <Skeleton className="h-3 w-20 bg-slate-200" />
                      </div>
                    </td>
                    <td>
                      <Skeleton className="h-4 w-36 bg-slate-200" />
                    </td>
                    <td>
                      <Skeleton className="h-4 w-20 bg-slate-200" />
                    </td>
                    <td>
                      <Skeleton className="h-6 w-24 rounded-full bg-slate-200" />
                    </td>
                    <td>
                      <Skeleton className="h-6 w-24 rounded-full bg-slate-200" />
                    </td>
                    <td>
                      <Skeleton className="h-4 w-24 bg-slate-200" />
                    </td>
                    <td className="text-right">
                      <Skeleton className="h-8 w-20 ml-auto bg-slate-200" />
                    </td>
                  </tr>
                ))
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-600">
                    <Package size={40} className="mx-auto text-slate-400 mb-2" />
                    <p className="font-bold text-slate-800 text-base">
                      Không tìm thấy đơn hàng nào
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Thử thay đổi bộ lọc trạng thái hoặc từ khóa tìm kiếm.
                    </p>
                  </td>
                </tr>
              ) : (
                orders.map((order) => {
                  const statusInfo =
                    ORDER_STATUS_LABELS[order.status] || {
                      label: order.status,
                      colorClass: "text-slate-800",
                      bgClass: "bg-slate-100 border-slate-300",
                    };
                  const paymentInfo =
                    PAYMENT_STATUS_LABELS[order.paymentStatus] || {
                      label: order.paymentStatus,
                      colorClass: "text-slate-800",
                      bgClass: "bg-slate-100 border-slate-300",
                    };
                  const validTransitions =
                    ALLOWED_STATUS_TRANSITIONS[order.status] || [];

                  return (
                    <tr key={order.id}>
                      {/* Mã đơn */}
                      <td className="font-black text-slate-900 font-mono text-sm">
                        #{order.orderCode}
                      </td>

                      {/* Khách hàng */}
                      <td>
                        <div className="font-bold text-slate-900 text-sm">
                          {order.recipientName}
                        </div>
                        <div className="text-xs text-slate-600 font-medium">
                          {order.recipientPhone}
                        </div>
                        {order.user && (
                          <div className="text-[11px] text-slate-500">
                            TK: {order.user.email}
                          </div>
                        )}
                      </td>

                      {/* Sản phẩm tóm tắt */}
                      <td>
                        <div className="text-xs text-slate-900 max-w-[200px] truncate font-semibold">
                          {order.items && order.items.length > 0 ? (
                            <>
                              {order.items[0].variant?.product?.name || "Sản phẩm TrendyFit"}{" "}
                              {order.items.length > 1 && (
                                <span className="text-slate-600 font-medium">
                                  (+{order.items.length - 1} món khác)
                                </span>
                              )}
                            </>
                          ) : (
                            "0 sản phẩm"
                          )}
                        </div>
                        <div className="text-[11px] text-slate-600 font-medium mt-0.5">
                          Tổng {order.items?.reduce((s, i) => s + i.quantity, 0) || 0} sản phẩm
                        </div>
                      </td>

                      {/* Tổng tiền */}
                      <td>
                        <div className="font-black text-slate-900 text-sm">
                          {formatVND(order.finalAmount)}
                        </div>
                        {Number(order.discountAmount) > 0 && (
                          <div className="text-[11px] text-emerald-800 font-bold">
                            Giảm: {formatVND(order.discountAmount)}
                          </div>
                        )}
                      </td>

                      {/* Trạng thái thanh toán */}
                      <td>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${paymentInfo.bgClass} ${paymentInfo.colorClass}`}
                        >
                          {paymentInfo.label}
                        </span>
                      </td>

                      {/* Trạng thái đơn hàng */}
                      <td>
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${statusInfo.bgClass} ${statusInfo.colorClass}`}
                        >
                          {statusInfo.label}
                        </span>
                      </td>

                      {/* Thời gian */}
                      <td className="text-xs text-slate-700 font-medium whitespace-nowrap">
                        {formatDate(order.createdAt)}
                      </td>

                      {/* Thao tác */}
                      <td className="text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedOrderForDetail(order)}
                            className="h-8 px-2.5 text-xs gap-1 bg-white text-slate-800 border-slate-300 hover:bg-slate-100 font-semibold"
                          >
                            <Eye size={13} />
                            Chi tiết
                          </Button>
                          {validTransitions.length > 0 && (
                            <Button
                              size="sm"
                              onClick={() => handleOpenStatusModal(order)}
                              className="h-8 px-3 text-xs bg-slate-900 hover:bg-slate-800 text-white font-bold shadow-xs cursor-pointer"
                            >
                              Đổi trạng thái
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

        {/* Pagination Bar */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-200 shadow-xs text-xs font-medium text-slate-700">
            <span>
              Trang <strong className="text-slate-900">{pagination.page}</strong> /{" "}
              <strong className="text-slate-900">{pagination.totalPages}</strong> (Tổng cộng{" "}
              <strong className="text-slate-900">{pagination.total}</strong> đơn)
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1 || isLoading}
                onClick={() => setPage(page - 1)}
                className="gap-1 h-8 px-3 bg-white text-slate-800 border-slate-300 hover:bg-slate-100 font-semibold"
              >
                <ChevronLeft size={14} /> Trước
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= pagination.totalPages || isLoading}
                onClick={() => setPage(page + 1)}
                className="gap-1 h-8 px-3 bg-white text-slate-800 border-slate-300 hover:bg-slate-100 font-semibold"
              >
                Sau <ChevronRight size={14} />
              </Button>
            </div>
          </div>
        )}

        {/* MODAL 1: CẬP NHẬT TRẠNG THÁI (Frosted Glass Backdrop) */}
        {orderToUpdateStatus && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-200">
            <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-2xl p-6 space-y-5 text-slate-900">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-900 flex items-center justify-center font-bold">
                    <RefreshCw size={16} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">
                      Cập nhật trạng thái đơn
                    </h3>
                    <p className="text-xs text-slate-600 font-medium">
                      Mã đơn: #{orderToUpdateStatus.orderCode}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setOrderToUpdateStatus(null)}
                  className="p-1 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition"
                >
                  <X size={18} />
                </button>
              </div>

              {/* State Transition Info */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-500 block mb-0.5 font-medium">Hiện tại:</span>
                  <span className="font-bold text-slate-900">
                    {ORDER_STATUS_LABELS[orderToUpdateStatus.status]?.label ||
                      orderToUpdateStatus.status}
                  </span>
                </div>
                <ArrowRight size={16} className="text-slate-500" />
                <div>
                  <span className="text-slate-500 block mb-0.5 font-medium">Chuyển sang:</span>
                  <span className="font-black text-slate-900">
                    {ORDER_STATUS_LABELS[targetStatus]?.label || targetStatus}
                  </span>
                </div>
              </div>

              {/* Transition Selection */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-800 block">
                  Chọn trạng thái hợp lệ tiếp theo:
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {(
                    ALLOWED_STATUS_TRANSITIONS[orderToUpdateStatus.status] || []
                  ).map((st) => {
                    const info = ORDER_STATUS_LABELS[st] || { label: st };
                    const isSelected = targetStatus === st;
                    return (
                      <button
                        key={st}
                        type="button"
                        onClick={() => setTargetStatus(st)}
                        className={`flex items-center justify-between p-3 rounded-xl border text-sm font-bold transition cursor-pointer ${
                          isSelected
                            ? "border-slate-900 bg-slate-900 text-white shadow-xs"
                            : "border-slate-300 bg-white hover:bg-slate-50 text-slate-800"
                        }`}
                      >
                        <span>{info.label}</span>
                        {isSelected && <CheckCircle size={16} className="text-primary" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Warning note for cancellation */}
              {targetStatus === "CANCELLED" && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs flex gap-2.5 font-medium">
                  <AlertTriangle size={18} className="shrink-0 text-amber-700" />
                  <div>
                    <p className="font-bold">Lưu ý khi Hủy đơn:</p>
                    <p className="mt-0.5 leading-relaxed">
                      Nếu đơn đang ở trạng thái Chờ thanh toán, toàn bộ số lượng tồn kho bị khóa sẽ tự động được hoàn trả lại cho hệ thống bán lẻ.
                    </p>
                  </div>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-200">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setOrderToUpdateStatus(null)}
                  disabled={isUpdating}
                  className="border-slate-300 text-slate-800 font-semibold"
                >
                  Đóng
                </Button>
                <Button
                  size="sm"
                  onClick={handleConfirmStatusUpdate}
                  disabled={!targetStatus || isUpdating}
                  className="bg-slate-900 hover:bg-slate-800 text-white font-bold min-w-[120px] shadow-xs cursor-pointer"
                >
                  {isUpdating ? (
                    <RefreshCw size={14} className="animate-spin mr-1" />
                  ) : null}
                  Xác nhận đổi
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL 2: CHI TIẾT ĐƠN HÀNG (Frosted Glass Backdrop) */}
        {selectedOrderForDetail && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-200">
            <div className="w-full max-w-2xl bg-white rounded-2xl border border-slate-200 shadow-2xl p-6 max-h-[90vh] overflow-y-auto space-y-6 text-slate-900">
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                <div>
                  <h3 className="font-black text-slate-900 text-lg">
                    Chi tiết Đơn hàng #{selectedOrderForDetail.orderCode}
                  </h3>
                  <p className="text-xs text-slate-600 font-medium mt-0.5">
                    Đặt lúc: {formatDate(selectedOrderForDetail.createdAt)}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedOrderForDetail(null)}
                  className="p-1 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Status and Summary badges */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-xs text-slate-600 font-semibold block mb-1">
                    Trạng thái Đơn hàng
                  </span>
                  <span
                    className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${
                      ORDER_STATUS_LABELS[selectedOrderForDetail.status]?.bgClass
                    } ${ORDER_STATUS_LABELS[selectedOrderForDetail.status]?.colorClass}`}
                  >
                    {ORDER_STATUS_LABELS[selectedOrderForDetail.status]?.label ||
                      selectedOrderForDetail.status}
                  </span>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-xs text-slate-600 font-semibold block mb-1">
                    Trạng thái Thanh toán
                  </span>
                  <span
                    className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${
                      PAYMENT_STATUS_LABELS[selectedOrderForDetail.paymentStatus]?.bgClass
                    } ${PAYMENT_STATUS_LABELS[selectedOrderForDetail.paymentStatus]?.colorClass}`}
                  >
                    {PAYMENT_STATUS_LABELS[selectedOrderForDetail.paymentStatus]?.label ||
                      selectedOrderForDetail.paymentStatus}
                  </span>
                </div>
              </div>

              {/* Recipient & Shipping Information */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                <div className="font-bold text-slate-900 flex items-center gap-2 text-sm">
                  <User size={15} className="text-slate-600" />
                  Thông tin người nhận
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-slate-700">
                  <div>
                    <span className="text-slate-500">Họ và tên:</span>{" "}
                    <strong className="text-slate-900">{selectedOrderForDetail.recipientName}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500">Số điện thoại:</span>{" "}
                    <strong className="text-slate-900">{selectedOrderForDetail.recipientPhone}</strong>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-slate-500">Địa chỉ nhận hàng:</span>{" "}
                    <strong className="text-slate-900">{selectedOrderForDetail.shippingAddress}</strong>
                  </div>
                  {selectedOrderForDetail.user && (
                    <div className="sm:col-span-2 text-slate-600">
                      Tài khoản đặt mua: <strong className="text-slate-900">{selectedOrderForDetail.user.fullName}</strong> ({selectedOrderForDetail.user.email})
                    </div>
                  )}
                </div>
              </div>

              {/* Order Items List */}
              <div className="space-y-3">
                <h4 className="font-bold text-slate-900 text-sm">
                  Danh sách sản phẩm ({selectedOrderForDetail.items?.length || 0})
                </h4>
                <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 bg-white">
                  {selectedOrderForDetail.items?.map((item) => (
                    <div
                      key={item.id}
                      className="p-3.5 flex items-center justify-between gap-4 text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 overflow-hidden border border-slate-200">
                          {item.variant?.imageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={item.variant.imageUrl}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Package size={20} className="text-slate-500" />
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-sm">
                            {item.variant?.product?.name || "Sản phẩm TrendyFit"}
                          </p>
                          <div className="flex items-center gap-2 text-slate-600 font-medium mt-0.5">
                            <span>Màu: {item.variant?.color || "Tiêu chuẩn"}</span>
                            <span>•</span>
                            <span>Size: {item.variant?.size || "F"}</span>
                            <span>•</span>
                            <span>SKU: {item.variant?.sku}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-black text-slate-900 text-sm">
                          {formatVND(Number(item.unitPrice) * item.quantity)}
                        </p>
                        <p className="text-slate-500 font-medium text-[11px]">
                          {formatVND(item.unitPrice)} × {item.quantity}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                <div className="flex justify-between text-slate-700 font-medium">
                  <span>Tổng tiền hàng:</span>
                  <span className="font-bold text-slate-900">{formatVND(selectedOrderForDetail.totalAmount)}</span>
                </div>
                {Number(selectedOrderForDetail.discountAmount) > 0 && (
                  <div className="flex justify-between text-emerald-800 font-bold">
                    <span>
                      Giảm giá voucher
                      {selectedOrderForDetail.voucher?.code &&
                        ` (${selectedOrderForDetail.voucher.code})`}
                      :
                    </span>
                    <span>-{formatVND(selectedOrderForDetail.discountAmount)}</span>
                  </div>
                )}
                <div className="pt-2 border-t border-slate-200 flex justify-between text-sm font-bold text-slate-900">
                  <span>Số tiền thực thu:</span>
                  <span className="text-base font-black text-slate-900">
                    {formatVND(selectedOrderForDetail.finalAmount)}
                  </span>
                </div>
              </div>

              {/* Close Button */}
              <div className="flex justify-end pt-2 border-t border-slate-200">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedOrderForDetail(null)}
                  className="border-slate-300 text-slate-800 font-bold hover:bg-slate-100"
                >
                  Đóng
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </RoleGuard>
  );
}
