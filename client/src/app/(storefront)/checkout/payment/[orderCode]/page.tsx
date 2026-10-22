"use client";

import React, { use } from "react";
import Link from "next/link";
import { usePayment } from "./hooks/use-payment";
import { formatPrice } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  CheckCircle2,
  Copy,
  Check,
  AlertTriangle,
  Zap,
  ShoppingBag,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  RotateCcw,
  PackageOpen,
} from "lucide-react";
import "./style/payment.css";

interface PaymentPageProps {
  params: Promise<{
    orderCode: string;
  }>;
}

export default function PaymentPage({ params }: PaymentPageProps) {
  const resolvedParams = use(params);
  const orderCode = resolvedParams.orderCode;

  const {
    order,
    paymentData,
    isOrderLoading,
    isQrLoading,
    isOrderError,
    isPaid,
    copiedField,
    copyToClipboard,
    isSimulatingMock,
    simulateMockPayment,
    refetchOrder,
  } = usePayment(orderCode);

  // 1. Loading Skeleton
  if (isOrderLoading) {
    return (
      <div className="payment-page-container mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="space-y-4 mb-8 text-center max-w-md mx-auto">
          <Skeleton className="h-8 w-48 mx-auto rounded" />
          <Skeleton className="h-4 w-72 mx-auto rounded" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          <div className="md:col-span-7">
            <Skeleton className="h-[460px] w-full rounded-2xl" />
          </div>
          <div className="md:col-span-5">
            <Skeleton className="h-[360px] w-full rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  // 2. Error State (404 Not Found or 403 Forbidden)
  if (isOrderError || !order) {
    return (
      <div className="payment-page-container mx-auto max-w-md px-4 py-24 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 text-destructive mb-4">
          <AlertTriangle size={32} />
        </div>
        <h1 className="text-xl font-bold text-foreground">Không tìm thấy đơn hàng</h1>
        <p className="text-sm text-muted-foreground mt-2 mb-6">
          Đơn hàng #{orderCode} không tồn tại hoặc bạn không có quyền truy cập vào thông tin thanh toán này.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button variant="outline" onClick={() => refetchOrder()} className="gap-2">
            <RefreshCw size={14} />
            Thử lại
          </Button>
          <Link href="/orders" className={cn(buttonVariants(), "gap-2")}>
            Xem danh sách đơn hàng
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    );
  }

  // 3. Trạng thái ĐÃ THANH TOÁN THÀNH CÔNG (PAID)
  if (isPaid) {
    return (
      <div className="payment-page-container mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="payment-success-card p-8 sm:p-10 rounded-3xl border border-emerald-500/30 bg-card shadow-xl text-center space-y-6">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 size={44} className="stroke-[2.5]" />
          </div>

          <div className="space-y-2">
            <Badge variant="default" className="bg-emerald-600 text-white font-bold text-xs px-3 py-1">
              Giao dịch thành công
            </Badge>
            <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
              Thanh toán thành công!
            </h1>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Hệ thống TrendyFit đã nhận được khoản thanh toán cho đơn hàng{" "}
              <strong className="text-foreground">#{order.orderCode}</strong>.
            </p>
          </div>

          {/* Chi tiết xác nhận */}
          <div className="max-w-md mx-auto p-5 rounded-2xl bg-muted/40 border border-border text-left space-y-3 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Mã đơn hàng:</span>
              <span className="font-bold text-foreground">#{order.orderCode}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tổng số tiền đã trả:</span>
              <span className="font-black text-emerald-600 dark:text-emerald-400 text-sm">
                {formatPrice(order.finalAmount)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Người nhận:</span>
              <span className="font-semibold text-foreground">{order.recipientName} ({order.recipientPhone})</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Địa chỉ nhận hàng:</span>
              <span className="font-semibold text-foreground text-right max-w-[200px] truncate">
                {order.shippingAddress}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Phương thức:</span>
              <span className="font-semibold text-foreground">Chuyển khoản VietQR (PayOS)</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <Link href="/orders" className={cn(buttonVariants({ size: "lg" }), "gap-2 rounded-xl")}>
              <ShoppingBag size={16} />
              Theo dõi đơn hàng của tôi
            </Link>
            <Link
              href="/products"
              className={cn(buttonVariants({ variant: "outline", size: "lg" }), "rounded-xl")}
            >
              Tiếp tục mua sắm
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 4. Trạng thái CHỜ THANH TOÁN (PENDING_PAYMENT)
  const transferMemo = `TRENDYFIT ${order.orderCode}`;
  const bankAccount = "0987654321";
  const bankName = "MBBank (Ngân hàng Quân Đội)";
  const accountHolder = "CONG TY CP TRENDYFIT";

  return (
    <div className="payment-page-container mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Tiêu đề trang */}
      <div className="text-center max-w-lg mx-auto mb-8 space-y-2">
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
          Quét mã thanh toán VietQR
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Mở ứng dụng ngân hàng bất kỳ để quét mã QR hoặc chuyển khoản đúng số tiền bên dưới.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* CỘT TRÁI (7 CỘT): MÃ VIETQR & THÔNG TIN CHUYỂN KHOẢN */}
        <div className="lg:col-span-7 space-y-6">
          <div className="payment-qr-card p-6 sm:p-8 rounded-3xl border border-border bg-card space-y-6">
            {/* Mã QR Code Container */}
            <div className="flex flex-col items-center">
              <div className="relative p-3 rounded-2xl bg-white shadow-md border border-border/80 flex items-center justify-center">
                {isQrLoading || !paymentData?.vietQrUrl ? (
                  <Skeleton className="h-64 w-64 rounded-xl" />
                ) : (
                  <div className="relative h-64 w-64 sm:h-72 sm:w-72 flex items-center justify-center">
                    <img
                      src={paymentData.vietQrUrl}
                      alt="VietQR Napas TrendyFit"
                      className="h-full w-full object-contain rounded-lg"
                    />
                  </div>
                )}
              </div>

              {/* Status Live Pulse */}
              <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
                </span>
                <span>Đang chờ chuyển khoản... (Tự động nhận diện mỗi 3s)</span>
              </div>
            </div>

            {/* Thông tin chuyển khoản chi tiết với nút Sao chép */}
            <div className="space-y-3 pt-4 border-t border-border">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Thông tin tài khoản thụ hưởng
              </h3>

              {/* Ngân hàng */}
              <div className="p-3 rounded-xl bg-muted/40 border border-border flex items-center justify-between text-xs">
                <div>
                  <span className="text-muted-foreground block text-[10px]">Ngân hàng:</span>
                  <span className="font-bold text-foreground">{bankName}</span>
                </div>
              </div>

              {/* Tên chủ tài khoản */}
              <div className="p-3 rounded-xl bg-muted/40 border border-border flex items-center justify-between text-xs">
                <div>
                  <span className="text-muted-foreground block text-[10px]">Chủ tài khoản:</span>
                  <span className="font-bold text-foreground">{accountHolder}</span>
                </div>
              </div>

              {/* Số tài khoản */}
              <div className="p-3 rounded-xl bg-muted/40 border border-border flex items-center justify-between text-xs">
                <div>
                  <span className="text-muted-foreground block text-[10px]">Số tài khoản:</span>
                  <span className="font-bold font-mono text-sm text-foreground">{bankAccount}</span>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(bankAccount, "account")}
                  className="h-8 text-xs gap-1 cursor-pointer"
                >
                  {copiedField === "account" ? (
                    <Check size={13} className="text-emerald-600" />
                  ) : (
                    <Copy size={13} />
                  )}
                  Sao chép
                </Button>
              </div>

              {/* Số tiền chính xác */}
              <div className="p-3 rounded-xl bg-muted/40 border border-border flex items-center justify-between text-xs">
                <div>
                  <span className="text-muted-foreground block text-[10px]">Số tiền cần chuyển:</span>
                  <span className="font-black text-sm text-primary">
                    {formatPrice(order.finalAmount)}
                  </span>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(order.finalAmount.toString(), "amount")}
                  className="h-8 text-xs gap-1 cursor-pointer"
                >
                  {copiedField === "amount" ? (
                    <Check size={13} className="text-emerald-600" />
                  ) : (
                    <Copy size={13} />
                  )}
                  Sao chép
                </Button>
              </div>

              {/* Nội dung chuyển khoản */}
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between text-xs">
                <div>
                  <span className="text-amber-700 dark:text-amber-300 block text-[10px] font-bold">
                    Nội dung chuyển khoản (Bắt buộc chính xác):
                  </span>
                  <span className="font-black font-mono text-sm text-amber-900 dark:text-amber-100">
                    {transferMemo}
                  </span>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(transferMemo, "memo")}
                  className="h-8 text-xs gap-1 border-amber-500/50 hover:bg-amber-500/20 cursor-pointer text-amber-900 dark:text-amber-100 font-bold"
                >
                  {copiedField === "memo" ? (
                    <Check size={13} className="text-emerald-600" />
                  ) : (
                    <Copy size={13} />
                  )}
                  Sao chép
                </Button>
              </div>
            </div>

            {/* Mock Payment Simulator Button (Cho Môi Trường Dev/Demo) */}
            {(paymentData?.isMockMode || process.env.NODE_ENV !== "production") && (
              <div className="pt-4 border-t border-dashed border-border space-y-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="lg"
                  disabled={isSimulatingMock}
                  onClick={() => simulateMockPayment()}
                  className="w-full h-11 text-xs font-bold gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-md cursor-pointer"
                >
                  <Zap size={14} className="fill-amber-300 text-amber-300" />
                  {isSimulatingMock
                    ? "Đang gửi tín hiệu Webhook HMAC-SHA256..."
                    : "⚡ Giả lập thanh toán PayOS (Mock Payment Engine)"}
                </Button>
                <p className="text-[10px] text-center text-muted-foreground">
                  Phục vụ kiểm thử: Tự động ký HMAC-SHA256 chuẩn PayOS và cập nhật trạng thái đơn thành công.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* CỘT PHẢI (5 CỘT): TÓM TẮT ĐƠN HÀNG */}
        <div className="lg:col-span-5 space-y-6">
          <div className="p-6 rounded-3xl border border-border bg-card shadow-sm space-y-5 text-xs">
            <div className="pb-3 border-b border-border flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">
                Đơn hàng #{order.orderCode}
              </h2>
              <Badge variant="outline" className="text-[10px] border-amber-500/50 text-amber-600">
                Chờ thanh toán
              </Badge>
            </div>

            {/* Thông tin nhận hàng */}
            <div className="space-y-1.5 text-muted-foreground">
              <p>
                <strong className="text-foreground">Người nhận:</strong> {order.recipientName}
              </p>
              <p>
                <strong className="text-foreground">Điện thoại:</strong> {order.recipientPhone}
              </p>
              <p className="line-clamp-2">
                <strong className="text-foreground">Địa chỉ:</strong> {order.shippingAddress}
              </p>
            </div>

            {/* Sản phẩm trong đơn kèm ảnh minh họa */}
            <div className="pt-3 border-t border-border space-y-2.5">
              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                Sản phẩm ({order.items.length})
              </p>
              <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
                {order.items.map((item) => {
                  const product = item.variant?.product;
                  const imageUrl =
                    item.variant?.imageUrl ||
                    (product?.images && product.images.length > 0 ? product.images[0] : "");

                  return (
                    <div key={item.id} className="flex gap-2.5 items-center py-1">
                      <div className="relative h-12 w-10 rounded-lg overflow-hidden bg-muted border border-border/80 shrink-0 flex items-center justify-center">
                        {imageUrl ? (
                          <img
                            src={imageUrl}
                            alt={product?.name || "Sản phẩm"}
                            className="h-full w-full object-cover object-center"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = "none";
                            }}
                          />
                        ) : (
                          <PackageOpen size={16} className="text-muted-foreground/60" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-foreground truncate">
                          {product?.name || "Sản phẩm thời trang"}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {item.variant?.color} / {item.variant?.size} • SL: {item.quantity}
                        </p>
                      </div>
                      <span className="font-bold text-foreground shrink-0">
                        {formatPrice(Number(item.unitPrice) * item.quantity)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Tổng tiền */}
            <div className="pt-3 border-t border-border space-y-2">
              <div className="flex justify-between text-muted-foreground">
                <span>Tạm tính</span>
                <span className="font-bold text-foreground">{formatPrice(order.totalAmount)}</span>
              </div>
              {Number(order.discountAmount) > 0 && (
                <div className="flex justify-between text-emerald-600 font-semibold">
                  <span>Mã giảm giá</span>
                  <span>-{formatPrice(order.discountAmount)}</span>
                </div>
              )}
              <div className="pt-2 border-t border-border flex justify-between items-baseline">
                <span className="font-bold text-foreground uppercase tracking-wider">
                  Cần thanh toán
                </span>
                <span className="text-xl font-black text-primary">
                  {formatPrice(order.finalAmount)}
                </span>
              </div>
            </div>

            {/* Trust Badges */}
            <div className="pt-3 border-t border-border/70 space-y-2 text-[11px] text-muted-foreground">
              <div className="flex items-center gap-2">
                <ShieldCheck size={13} className="text-emerald-600 shrink-0" />
                <span>Bảo mật giao dịch mã hóa Napas 24/7</span>
              </div>
              <div className="flex items-center gap-2">
                <RotateCcw size={13} className="text-foreground shrink-0" />
                <span>Đổi trả dễ dàng trong vòng 7 ngày</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
