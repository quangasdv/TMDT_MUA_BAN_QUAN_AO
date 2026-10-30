"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCheckout } from "./hooks/use-checkout";
import { formatPrice } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  ShieldCheck,
  Truck,
  Tag,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Loader2,
  QrCode,
  Banknote,
  Sparkles,
  X,
  ShoppingBag,
  PackageOpen,
  MapPin,
} from "lucide-react";
import { VIETNAM_ADDRESSES } from "./data/vietnam-address.data";
import { CartItem } from "../cart/validation/cart.validation";
import { useQuery } from "@tanstack/react-query";
import { getActiveVouchersApi } from "./api/checkout.api";
import "./style/checkout.css";

export default function CheckoutPage() {
  const router = useRouter();

  // Cascading Address Select Boxes state
  const [selectedProvinceId, setSelectedProvinceId] = React.useState<string>("hcm");
  const [selectedDistrictId, setSelectedDistrictId] = React.useState<string>("q1");
  const [selectedWardId, setSelectedWardId] = React.useState<string>("bn");
  const [streetDetail, setStreetDetail] = React.useState<string>("");
  const [paymentMethod, setPaymentMethod] = React.useState<"VIETQR" | "COD">("VIETQR");

  // Load danh sách Voucher đang kích hoạt từ Database
  const { data: activeVouchersData } = useQuery({
    queryKey: ["active-vouchers"],
    queryFn: getActiveVouchersApi,
    staleTime: 30 * 1000,
  });
  const activeVouchers = activeVouchersData?.data?.vouchers || [];

  const {
    form,
    isAuthenticated,
    isInitialized,
    items,
    isCartLoading,
    subtotalPrice,
    isFreeShipping,
    shippingFee,
    shippingRate,
    discountAmount,
    comboDiscountAmount,
    eligibleComboCount,
    isComboApplied,
    activeCombo,
    finalTotal,
    appliedVoucher,
    isApplyingVoucher,
    voucherError,
    pendingLimitError,
    stockError,
    isSubmitting,
    applyVoucher,
    removeVoucher,
    onSubmit,
  } = useCheckout({ selectedProvinceId, paymentMethod });

  const {
    register,
    formState: { errors },
    watch,
  } = form;

  const shippingAddressValue = watch("shippingAddress");

  const currentProvince = VIETNAM_ADDRESSES.find((p) => p.id === selectedProvinceId);
  const availableDistricts = currentProvince?.districts || [];
  const currentDistrict = availableDistricts.find((d) => d.id === selectedDistrictId);
  const availableWards = currentDistrict?.wards || [];

  const updateFullAddress = React.useCallback(
    (
      pId: string,
      dId: string,
      wId: string,
      street: string
    ) => {
      const prov = VIETNAM_ADDRESSES.find((p) => p.id === pId);
      const dist = prov?.districts.find((d) => d.id === dId);
      const ward = dist?.wards.find((w) => w.id === wId);

      const parts: string[] = [];
      if (street.trim()) parts.push(street.trim());
      if (ward?.name) parts.push(ward.name);
      if (dist?.name) parts.push(dist.name);
      if (prov?.name) parts.push(prov.name);

      const fullStr = parts.join(", ");
      form.setValue("shippingAddress", fullStr, { shouldValidate: true, shouldDirty: true });
    },
    [form]
  );

  const handleProvinceChange = (pId: string) => {
    setSelectedProvinceId(pId);
    const prov = VIETNAM_ADDRESSES.find((p) => p.id === pId);
    const firstDist = prov?.districts[0]?.id || "";
    setSelectedDistrictId(firstDist);
    const firstDistObj = prov?.districts[0];
    const firstWard = firstDistObj?.wards[0]?.id || "";
    setSelectedWardId(firstWard);
    updateFullAddress(pId, firstDist, firstWard, streetDetail);
  };

  const handleDistrictChange = (dId: string) => {
    setSelectedDistrictId(dId);
    const dist = availableDistricts.find((d) => d.id === dId);
    const firstWard = dist?.wards[0]?.id || "";
    setSelectedWardId(firstWard);
    updateFullAddress(selectedProvinceId, dId, firstWard, streetDetail);
  };

  const handleWardChange = (wId: string) => {
    setSelectedWardId(wId);
    updateFullAddress(selectedProvinceId, selectedDistrictId, wId, streetDetail);
  };

  const handleStreetChange = (val: string) => {
    setStreetDetail(val);
    updateFullAddress(selectedProvinceId, selectedDistrictId, selectedWardId, val);
  };

  useEffect(() => {
    if (!form.getValues("shippingAddress")) {
      updateFullAddress(selectedProvinceId, selectedDistrictId, selectedWardId, streetDetail);
    }
  }, [form, selectedProvinceId, selectedDistrictId, selectedWardId, streetDetail, updateFullAddress]);

  // 1. Kiểm tra trạng thái Authentication
  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      router.push("/login?returnUrl=" + encodeURIComponent("/checkout"));
    }
  }, [isInitialized, isAuthenticated, router]);

  // Loading Skeleton khi kiểm tra session hoặc tải giỏ hàng
  if (!isInitialized || isCartLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
        <div className="space-y-4 mb-8">
          <Skeleton className="h-4 w-36 rounded" />
          <Skeleton className="h-8 w-64 rounded" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-7 space-y-6">
            <Skeleton className="h-64 w-full rounded-2xl" />
            <Skeleton className="h-48 w-full rounded-2xl" />
          </div>
          <div className="lg:col-span-5">
            <Skeleton className="h-96 w-full rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  // Nếu chưa đăng nhập, hiển thị thông báo chuyển hướng
  if (!isAuthenticated) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/10 text-amber-600 mb-4">
          <ShoppingBag size={32} />
        </div>
        <h1 className="text-xl font-bold text-foreground">Yêu cầu đăng nhập</h1>
        <p className="text-sm text-muted-foreground mt-2 mb-6">
          Vui lòng đăng nhập để hệ thống bảo lưu giỏ hàng và tiến hành tạo đơn an toàn.
        </p>
        <Link
          href={`/login?returnUrl=${encodeURIComponent("/checkout")}`}
          className={cn(buttonVariants(), "w-full gap-2")}
        >
          Đăng nhập ngay
          <ArrowRight size={16} />
        </Link>
      </div>
    );
  }

  // 2. Kiểm tra nếu giỏ hàng trống
  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-muted border-2 border-dashed border-border mb-6">
          <ShoppingBag size={36} className="text-muted-foreground" />
        </div>
        <h1 className="text-2xl font-black text-foreground">Giỏ hàng của bạn đang trống</h1>
        <p className="text-sm text-muted-foreground mt-2 mb-6">
          Bạn chưa chọn sản phẩm nào để tiến hành thanh toán. Hãy thêm đồ vào giỏ nhé!
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/products" className={cn(buttonVariants(), "gap-2")}>
            <ArrowLeft size={16} />
            Khám phá sản phẩm
          </Link>
          <Link href="/cart" className={cn(buttonVariants({ variant: "outline" }))}>
            Quay lại giỏ hàng
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-page-container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Breadcrumb & Tiêu đề */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
          <Link href="/cart" className="hover:text-primary transition-colors flex items-center gap-1">
            <ArrowLeft size={12} />
            Giỏ hàng
          </Link>
          <span>/</span>
          <span className="text-foreground">Thanh toán</span>
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
            Thông tin thanh toán
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Kiểm tra thông tin giao nhận và hoàn tất đơn hàng của bạn.
          </p>
        </div>
      </div>

      {/* Cảnh báo lỗi giới hạn đơn PENDING (Mục 8.5 & TH-11) */}
      {pendingLimitError && (
        <div className="mb-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-foreground flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-sm text-amber-700 dark:text-amber-300">
                Giới hạn đơn hàng chờ thanh toán
              </p>
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{pendingLimitError}</p>
            </div>
          </div>
          <Link
            href="/orders"
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "border-amber-500/40 text-amber-700 dark:text-amber-300 hover:bg-amber-500/10 shrink-0 font-bold"
            )}
          >
            Quản lý đơn hàng
            <ArrowRight size={14} className="ml-1" />
          </Link>
        </div>
      )}

      {/* Cảnh báo lỗi hết hàng (INSUFFICIENT_STOCK) */}
      {stockError && (
        <div className="mb-6 p-4 rounded-2xl bg-destructive/10 border border-destructive/30 text-foreground flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-sm text-destructive">Hết hàng hoặc không đủ tồn kho</p>
            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{stockError}</p>
          </div>
        </div>
      )}

      <form onSubmit={onSubmit} noValidate>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* CỘT TRÁI (7 CỘT): FORM THÔNG TIN GIAO HÀNG & PHƯƠNG THỨC */}
          <div className="lg:col-span-7 space-y-6">
            {/* 1. THÔNG TIN NGƯỜI NHẬN */}
            <div className="p-6 rounded-2xl border border-border bg-card shadow-sm space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-border">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary font-black text-xs">
                  1
                </div>
                <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">
                  Thông tin người nhận hàng
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="recipientName" className="text-xs font-semibold">
                    Họ và tên người nhận <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="recipientName"
                    placeholder="Nguyễn Văn A"
                    {...register("recipientName")}
                    className={cn(
                      "h-11 rounded-xl text-sm",
                      errors.recipientName && "border-destructive focus-visible:ring-destructive"
                    )}
                  />
                  {errors.recipientName && (
                    <p className="text-[11px] text-destructive font-medium flex items-center gap-1 mt-1">
                      <AlertCircle size={12} />
                      {errors.recipientName.message}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="recipientPhone" className="text-xs font-semibold">
                    Số điện thoại liên hệ <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="recipientPhone"
                    type="tel"
                    placeholder="0912345678"
                    {...register("recipientPhone")}
                    className={cn(
                      "h-11 rounded-xl text-sm",
                      errors.recipientPhone && "border-destructive focus-visible:ring-destructive"
                    )}
                  />
                  {errors.recipientPhone && (
                    <p className="text-[11px] text-destructive font-medium flex items-center gap-1 mt-1">
                      <AlertCircle size={12} />
                      {errors.recipientPhone.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Cascading Address Select Boxes */}
              <div className="space-y-3 pt-1">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold text-slate-900 flex items-center gap-1.5">
                    <MapPin size={14} className="text-primary" />
                    Địa chỉ nhận hàng (Chọn khu vực) <span className="text-destructive">*</span>
                  </Label>
                  <span className="text-[11px] text-muted-foreground font-normal">
                    Chọn Tỉnh/Thành, Quận/Huyện và Phường/Xã
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {/* Tỉnh / Thành phố */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-700">
                      Tỉnh / Thành phố
                    </label>
                    <select
                      value={selectedProvinceId}
                      onChange={(e) => handleProvinceChange(e.target.value)}
                      className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs sm:text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary shadow-2xs cursor-pointer hover:border-slate-400 transition-all"
                    >
                      <option value="">-- Chọn Tỉnh / TP --</option>
                      {VIETNAM_ADDRESSES.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Quận / Huyện */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-700">
                      Quận / Huyện
                    </label>
                    <select
                      value={selectedDistrictId}
                      onChange={(e) => handleDistrictChange(e.target.value)}
                      disabled={!selectedProvinceId}
                      className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs sm:text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary shadow-2xs cursor-pointer disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed hover:border-slate-400 transition-all"
                    >
                      <option value="">-- Chọn Quận / Huyện --</option>
                      {availableDistricts.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Phường / Xã */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-700">
                      Phường / Xã
                    </label>
                    <select
                      value={selectedWardId}
                      onChange={(e) => handleWardChange(e.target.value)}
                      disabled={!selectedDistrictId}
                      className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs sm:text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary shadow-2xs cursor-pointer disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed hover:border-slate-400 transition-all"
                    >
                      <option value="">-- Chọn Phường / Xã --</option>
                      {availableWards.map((w) => (
                        <option key={w.id} value={w.id}>
                          {w.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Số nhà / Tên đường chi tiết */}
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-700">
                    Số nhà, tên đường, tòa nhà (tùy chọn để hoàn thiện địa chỉ)
                  </label>
                  <Input
                    type="text"
                    placeholder="Ví dụ: Số 123 Đường Nguyễn Huệ hoặc Landmark 81..."
                    value={streetDetail}
                    onChange={(e) => handleStreetChange(e.target.value)}
                    className="h-11 rounded-xl text-sm bg-white text-slate-900 border-slate-300 placeholder:text-slate-400"
                  />
                </div>

                {/* Live Address Preview Badge */}
                {shippingAddressValue && (
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-start gap-2.5 text-slate-700 animate-in fade-in duration-150">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/20 text-slate-900 font-bold mt-0.5">
                      <MapPin size={13} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="font-bold text-slate-900 block text-[11px] uppercase tracking-wide">
                        Địa chỉ giao hàng hoàn chỉnh:
                      </span>
                      <span className="text-slate-800 font-medium text-xs break-words">
                        {shippingAddressValue}
                      </span>
                    </div>
                  </div>
                )}

                {errors.shippingAddress && (
                  <p className="text-[11px] text-destructive font-medium flex items-center gap-1 mt-1">
                    <AlertCircle size={12} />
                    {errors.shippingAddress.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="orderNote" className="text-xs font-semibold text-muted-foreground">
                  Ghi chú đơn hàng (Tùy chọn)
                </Label>
                <Input
                  id="orderNote"
                  placeholder="Ví dụ: Giao giờ hành chính, gọi trước khi giao..."
                  {...register("orderNote")}
                  className="h-11 rounded-xl text-sm"
                />
              </div>
            </div>

            {/* 2. PHƯƠNG THỨC THANH TOÁN */}
            <div className="p-6 rounded-2xl border border-border bg-card shadow-sm space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-border">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary font-black text-xs">
                  2
                </div>
                <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">
                  Phương thức thanh toán
                </h2>
              </div>

              <div className="space-y-3">
                {/* Lựa chọn 1: VietQR Chuyển khoản tức thời */}
                <div
                  onClick={() => setPaymentMethod("VIETQR")}
                  className={cn(
                    "relative p-4 rounded-xl border-2 transition-all cursor-pointer space-y-2",
                    paymentMethod === "VIETQR"
                      ? "border-primary bg-primary/5 shadow-2xs"
                      : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-2xs shrink-0">
                        <QrCode size={22} />
                      </div>
                      <div>
                        <div className="font-bold text-sm text-foreground flex items-center gap-2">
                          <span>Quét mã VietQR chuẩn Napas 24/7</span>
                          <Badge variant="default" className="text-[10px] px-1.5 py-0 h-4 bg-emerald-600">
                            Khuyên dùng
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Tự động xác nhận giao dịch trong 3 giây qua PayOS Webhook
                        </p>
                      </div>
                    </div>
                    <div
                      className={cn(
                        "h-5 w-5 rounded-full border-2 flex items-center justify-center transition-all shrink-0",
                        paymentMethod === "VIETQR" ? "border-primary" : "border-slate-300"
                      )}
                    >
                      {paymentMethod === "VIETQR" && <div className="h-2.5 w-2.5 rounded-full bg-primary" />}
                    </div>
                  </div>

                  <div className="pt-2 text-[11px] text-muted-foreground border-t border-primary/20 flex items-center gap-1.5">
                    <ShieldCheck size={12} className="text-primary shrink-0" />
                    <span>
                      Sau khi bấm đặt hàng, hệ thống sẽ tạo mã VietQR có sẵn số tài khoản và nội dung chuyển khoản tự động.
                    </span>
                  </div>
                </div>

                {/* Lựa chọn 2: Thanh toán tiền mặt khi nhận hàng (COD) */}
                <div
                  onClick={() => setPaymentMethod("COD")}
                  className={cn(
                    "relative p-4 rounded-xl border-2 transition-all cursor-pointer space-y-2",
                    paymentMethod === "COD"
                      ? "border-primary bg-primary/5 shadow-2xs"
                      : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white shadow-2xs shrink-0">
                        <Banknote size={22} className="text-primary" />
                      </div>
                      <div>
                        <div className="font-bold text-sm text-foreground flex items-center gap-2">
                          <span>Thanh toán tiền mặt khi nhận hàng (COD)</span>
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 border-slate-300 text-slate-700 bg-slate-50">
                            Tiền mặt
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Thanh toán trực tiếp bằng tiền mặt cho shipper khi nhận và kiểm tra hàng
                        </p>
                      </div>
                    </div>
                    <div
                      className={cn(
                        "h-5 w-5 rounded-full border-2 flex items-center justify-center transition-all shrink-0",
                        paymentMethod === "COD" ? "border-primary" : "border-slate-300"
                      )}
                    >
                      {paymentMethod === "COD" && <div className="h-2.5 w-2.5 rounded-full bg-primary" />}
                    </div>
                  </div>

                  {paymentMethod === "COD" && (
                    <div className="pt-2 text-[11px] text-slate-600 border-t border-primary/20 flex items-center gap-1.5 animate-in fade-in duration-150">
                      <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
                      <span>
                        Quý khách được quyền đồng kiểm tra hàng trước khi nhận. Vui lòng chuẩn bị sẵn tiền mặt khi shipper giao tới.
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 3. MÃ GIẢM GIÁ (VOUCHER) */}
            <div className="p-6 rounded-2xl border border-border bg-card shadow-sm space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-border">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary font-black text-xs">
                  3
                </div>
                <h2 className="text-sm font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
                  <Tag size={16} />
                  Mã giảm giá (Voucher)
                </h2>
              </div>

              {appliedVoucher ? (
                <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 size={18} className="text-emerald-600 dark:text-emerald-400" />
                    <div>
                      <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 block">
                        Đã áp dụng mã: {appliedVoucher.code}
                      </span>
                      <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                        Giảm {formatPrice(appliedVoucher.discountAmount)}
                      </span>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={removeVoucher}
                    className="h-8 text-xs text-destructive hover:bg-destructive/10 cursor-pointer"
                  >
                    <X size={14} className="mr-1" />
                    Gỡ bỏ
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Nhập mã voucher (VD: WELCOME2026)"
                      {...register("voucherCode")}
                      className="h-11 rounded-xl text-sm"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      disabled={isApplyingVoucher}
                      onClick={() => applyVoucher()}
                      className="h-11 px-5 rounded-xl font-bold text-xs shrink-0 cursor-pointer"
                    >
                      {isApplyingVoucher ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        "Áp dụng"
                      )}
                    </Button>
                  </div>

                  {voucherError && (
                    <p className="text-[11px] text-destructive font-medium flex items-center gap-1">
                      <AlertCircle size={12} />
                      {voucherError}
                    </p>
                  )}

                  {/* Dynamic Suggestion Chips từ Database */}
                  <div className="flex items-center gap-2 flex-wrap pt-1">
                    <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                      <Sparkles size={12} className="text-amber-500" /> Gợi ý voucher:
                    </span>
                    {activeVouchers.length > 0 ? (
                      activeVouchers.map((v) => {
                        const discountLabel =
                          v.discountType === "PERCENT"
                            ? `-${v.discountValue}%`
                            : `-${Number(v.discountValue) >= 1000 ? `${Math.round(Number(v.discountValue) / 1000)}k` : `${v.discountValue}đ`}`;
                        const minOrder = Number(v.minOrderValue) > 0 ? ` (Đơn từ ${Math.round(Number(v.minOrderValue) / 1000)}k)` : "";
                        return (
                          <button
                            key={v.id}
                            type="button"
                            onClick={() => applyVoucher(v.code)}
                            className="text-[11px] px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 font-semibold border border-amber-200 cursor-pointer transition-colors flex items-center gap-1 shadow-xs"
                            title={`Hết hạn: ${new Date(v.expiresAt).toLocaleDateString("vi-VN")}${minOrder}`}
                          >
                            <span className="font-bold text-amber-800">{v.code}</span>
                            <span className="text-[10px] text-amber-600">({discountLabel})</span>
                          </button>
                        );
                      })
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => applyVoucher("WELCOME2026")}
                          className="text-[11px] px-2.5 py-1 rounded-lg bg-muted hover:bg-muted/80 text-foreground font-semibold border border-border cursor-pointer transition-colors"
                        >
                          WELCOME2026 (-20%)
                        </button>
                        <button
                          type="button"
                          onClick={() => applyVoucher("FREESHIP")}
                          className="text-[11px] px-2.5 py-1 rounded-lg bg-muted hover:bg-muted/80 text-foreground font-semibold border border-border cursor-pointer transition-colors"
                        >
                          FREESHIP (-30k)
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* CỘT PHẢI (5 CỘT): TÓM TẮT ĐƠN HÀNG VÀ XÁC NHẬN */}
          <div className="lg:col-span-5">
            <div className="checkout-summary-sticky p-6 rounded-2xl border border-border bg-card shadow-sm space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-border">
                <h2 className="text-base font-black text-foreground uppercase tracking-wider">
                  Đơn hàng ({items.length} món)
                </h2>
                <Link
                  href="/cart"
                  className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
                >
                  Sửa giỏ hàng
                </Link>
              </div>

              {/* Danh sách sản phẩm thu gọn - FIX HIỂN THỊ ẢNH */}
              <div className="max-h-64 overflow-y-auto space-y-3 pr-1">
                {items.map((item: CartItem) => {
                  const product = item.variant?.product;
                  const unitPrice =
                    (Number(product?.basePrice) || 0) + (Number(item.variant?.priceAdjustment) || 0);
                  const imageUrl =
                    item.variant?.imageUrl ||
                    (product?.images && product.images.length > 0 ? product.images[0] : "");

                  return (
                    <div key={item.id} className="flex gap-3 items-center py-1">
                      <div className="relative h-14 w-12 rounded-lg overflow-hidden bg-muted border border-border/80 shrink-0 flex items-center justify-center">
                        {imageUrl ? (
                          <img
                            src={imageUrl}
                            alt={product?.name || "Sản phẩm thời trang"}
                            className="h-full w-full object-cover object-center"
                            onError={(e) => {
                              // Fallback ẩn ảnh lỗi nếu load thất bại
                              (e.target as HTMLElement).style.display = "none";
                            }}
                          />
                        ) : (
                          <PackageOpen size={18} className="text-muted-foreground/60" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-foreground truncate">
                          {product?.name || "Sản phẩm thời trang"}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {item.variant?.color} / {item.variant?.size} • SL: {item.quantity}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-xs font-bold text-foreground">
                          {formatPrice(unitPrice * item.quantity)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Tính toán chi tiết */}
              <div className="space-y-3 pt-4 border-t border-border text-xs">
                <div className="flex justify-between text-muted-foreground">
                  <span>Tạm tính</span>
                  <span className="font-bold text-foreground">{formatPrice(subtotalPrice)}</span>
                </div>

                {appliedVoucher && (
                  <div className="flex justify-between text-emerald-600 font-semibold">
                    <span>Mã giảm giá ({appliedVoucher.code})</span>
                    <span>-{formatPrice(discountAmount)}</span>
                  </div>
                )}

                  {/* Ưu đãi Combo Thời Trang */}
                  {isComboApplied && comboDiscountAmount > 0 && (
                    <div className="flex justify-between text-emerald-600 font-semibold text-xs bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/20">
                      <div className="flex items-center gap-1.5">
                        <Sparkles size={14} className="text-emerald-600 shrink-0" />
                        <span>Ưu đãi Combo {activeCombo?.title ? `(${activeCombo.title})` : ""} {eligibleComboCount > 1 ? `x${eligibleComboCount}` : ""}</span>
                      </div>
                      <span className="font-bold shrink-0">-{formatPrice(comboDiscountAmount)}</span>
                    </div>
                  )}

                <div className="flex justify-between text-muted-foreground">
                  <div>
                    <span className="block font-medium">Phí giao hàng</span>
                    {!isFreeShipping && shippingRate && (
                      <span className="text-[11px] text-slate-500 font-medium block">
                        {shippingRate.zoneName} • {shippingRate.estimatedDelivery}
                      </span>
                    )}
                  </div>
                  <span className="font-bold text-foreground self-start">
                    {isFreeShipping ? (
                      <span className="text-emerald-600">Miễn phí (Đơn ≥ 499k)</span>
                    ) : (
                      formatPrice(shippingFee)
                    )}
                  </span>
                </div>
              </div>

              {/* Tổng thanh toán */}
              <div className="pt-4 border-t border-border flex justify-between items-baseline">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                    Tổng thanh toán
                  </span>
                  <span className="text-[10px] text-muted-foreground">Đã bao gồm thuế GTGT</span>
                </div>
                <span className="text-2xl font-black text-foreground tracking-tight text-primary">
                  {formatPrice(finalTotal)}
                </span>
              </div>

              {/* Nút Đặt hàng */}
              <Button
                type="submit"
                size="lg"
                disabled={isSubmitting || items.length === 0}
                className="w-full h-12 text-sm font-bold gap-2 rounded-xl shadow-md cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Đang xử lý đặt hàng...
                  </>
                ) : paymentMethod === "COD" ? (
                  <>
                    <span>Đặt hàng (Thanh toán tiền mặt - COD)</span>
                    <ArrowRight size={16} />
                  </>
                ) : (
                  <>
                    <span>Tiến hành thanh toán VietQR</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </Button>

              {/* Thông tin bảo đảm */}
              <div className="space-y-2 pt-3 border-t border-border/70 text-[11px] text-muted-foreground">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={13} className="text-emerald-600 shrink-0" />
                  <span>Tự động xác nhận giao dịch qua cổng VietQR 24/7</span>
                </div>
                <div className="flex items-center gap-2">
                  <Truck size={13} className="text-foreground shrink-0" />
                  <span>Giao hàng tiêu chuẩn toàn quốc từ 2 đến 4 ngày</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
