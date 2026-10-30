"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { useAuthStore } from "@/stores/auth.store";
import { useCart, CHECKOUT_SELECTED_STORAGE_KEY } from "../../cart/hooks/use-cart";
import { getShippingRateByProvince, ShippingRate, FREE_SHIPPING_THRESHOLD } from "../data/vietnam-address.data";
import { CartItem } from "../../cart/validation/cart.validation";
import {
  checkoutFormSchema,
  CheckoutFormValues,
  ApplyVoucherData,
  CheckoutLockResponse,
} from "../validation/checkout.validation";
import { lockAndCheckoutApi, applyVoucherApi } from "../api/checkout.api";
import { getApiErrorCode, getApiErrorMessage } from "@/lib/error";

export function useCheckout(options?: { selectedProvinceId?: string; paymentMethod?: "VIETQR" | "COD" }) {
  const selectedProvinceId = options?.selectedProvinceId;
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, isAuthenticated, isInitialized } = useAuthStore();
  const { items: allCartItems, isLoading: isCartLoading } = useCart();

  // Chỉ lấy các sản phẩm đã được người dùng tick chọn trong giỏ hàng (nếu có)
  const items: CartItem[] = useMemo(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = sessionStorage.getItem(CHECKOUT_SELECTED_STORAGE_KEY);
        if (stored) {
          const selectedIds: string[] = JSON.parse(stored);
          if (Array.isArray(selectedIds) && selectedIds.length > 0) {
            const filtered = allCartItems.filter((it: CartItem) => selectedIds.includes(it.id));
            if (filtered.length > 0) {
              return filtered;
            }
          }
        }
      } catch {
        // Fallback to allCartItems
      }
    }
    return allCartItems;
  }, [allCartItems]);

  const subtotalPrice = useMemo(() => {
    return items.reduce((acc: number, it: CartItem) => {
      const base = Number(it.variant?.product?.basePrice) || 0;
      const adjust = Number(it.variant?.priceAdjustment) || 0;
      const unitPrice = base + adjust;
      return acc + unitPrice * (it.quantity || 0);
    }, 0);
  }, [items]);

  // State quản lý Voucher
  const [appliedVoucher, setAppliedVoucher] = useState<ApplyVoucherData | null>(null);
  const [isApplyingVoucher, setIsApplyingVoucher] = useState(false);
  const [voucherError, setVoucherError] = useState<string | null>(null);

  // State lỗi nghiệp vụ đặc thù
  const [pendingLimitError, setPendingLimitError] = useState<string | null>(null);
  const [stockError, setStockError] = useState<string | null>(null);
  // Thông tin Combo từ localStorage (nếu có)
  const [activeCombo] = useState<{
    outfitId: string;
    title: string;
    discountRate: number;
    clothingVariantIds: string[];
    clothingOriginalPrice?: number;
  } | null>(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("trendyfit_active_combo");
        if (stored) return JSON.parse(stored);
      } catch {
        // ignore
      }
    }
    return null;
  });

  // Form khởi tạo với Zod
  const form = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutFormSchema),
    defaultValues: {
      recipientName: user?.fullName || "",
      recipientPhone: user?.phone || "",
      shippingAddress: "",
      orderNote: "",
      voucherCode: "",
    },
  });

  // Tự động đồng bộ thông tin tài khoản vào form khi user tải xong
  useEffect(() => {
    if (user) {
      if (!form.getValues("recipientName") && user.fullName) {
        form.setValue("recipientName", user.fullName);
      }
      if (!form.getValues("recipientPhone") && user.phone) {
        form.setValue("recipientPhone", user.phone);
      }
    }
  }, [user, form]);

  // Tính toán phí vận chuyển động theo phân vùng địa lý và tổng tiền
  const shippingRate = useMemo(() => {
    return getShippingRateByProvince(selectedProvinceId, subtotalPrice);
  }, [selectedProvinceId, subtotalPrice]);

  const isFreeShipping = shippingRate.fee === 0;
  const shippingFee = items.length === 0 ? 0 : shippingRate.fee;
  const discountAmount = appliedVoucher?.discountAmount || 0;

  // Tính ưu đãi Combo thời trang (Dynamic Bundle Matching)
  const { eligibleComboCount, comboDiscountAmount, isComboApplied } = useMemo(() => {
    if (!activeCombo || !activeCombo.clothingVariantIds || activeCombo.clothingVariantIds.length === 0) {
      return { eligibleComboCount: 0, comboDiscountAmount: 0, isComboApplied: false };
    }

    const quantities = activeCombo.clothingVariantIds.map((vId) => {
      const it = items.find((item) => item.variantId === vId);
      return it ? (it.quantity || 0) : 0;
    });

    const minQty = Math.min(...quantities);

    if (minQty > 0) {
      let singleSetPrice = 0;
      for (const vId of activeCombo.clothingVariantIds) {
        const it = items.find((item) => item.variantId === vId);
        if (it) {
          const base = Number(it.variant?.product?.basePrice) || 0;
          const adjust = Number(it.variant?.priceAdjustment) || 0;
          singleSetPrice += base + adjust;
        }
      }
      const rate = Number(activeCombo.discountRate) || 0.15;
      const discount = Math.round(minQty * singleSetPrice * rate);
      return { eligibleComboCount: minQty, comboDiscountAmount: discount, isComboApplied: true };
    }

    return { eligibleComboCount: 0, comboDiscountAmount: 0, isComboApplied: false };
  }, [activeCombo, items]);

  const finalTotal = Math.max(0, subtotalPrice - discountAmount - comboDiscountAmount + shippingFee);

  // Thao tác áp dụng mã giảm giá
  const handleApplyVoucher = async (codeToApply?: string) => {
    const code = (codeToApply || form.getValues("voucherCode") || "").trim();
    if (!code) {
      setVoucherError("Vui lòng nhập mã giảm giá.");
      return;
    }

    if (subtotalPrice <= 0) {
      setVoucherError("Giỏ hàng của bạn chưa có sản phẩm để áp dụng mã giảm giá.");
      return;
    }

    setIsApplyingVoucher(true);
    setVoucherError(null);

    try {
      const res = await applyVoucherApi({
        voucherCode: code,
        totalAmount: subtotalPrice,
      });

      if (res.success && res.data) {
        setAppliedVoucher(res.data);
        form.setValue("voucherCode", res.data.code);
        toast.success(`Áp dụng thành công mã voucher: ${res.data.code}`);
      }
    } catch (err: unknown) {
      const msg = getApiErrorMessage(err, "Không thể áp dụng mã giảm giá này.");
      setVoucherError(msg);
      toast.error(msg);
      setAppliedVoucher(null);
    } finally {
      setIsApplyingVoucher(false);
    }
  };

  // Hủy áp dụng voucher
  const handleRemoveVoucher = () => {
    setAppliedVoucher(null);
    setVoucherError(null);
    form.setValue("voucherCode", "");
    toast.info("Đã gỡ mã giảm giá.");
  };

  // Mutation Khóa kho nguyên tử và tạo đơn hàng
  const lockMutation = useMutation({
    mutationFn: lockAndCheckoutApi,
    onSuccess: (data: CheckoutLockResponse) => {
      // 1. Dọn dẹp lưu trữ các món đã chọn và giỏ hàng cache phía frontend
      if (typeof window !== "undefined") {
        try {
          sessionStorage.removeItem("trendyfit_checkout_selected_item_ids");
        } catch {
          // ignore
        }
      }
      queryClient.invalidateQueries({ queryKey: ["cart"] });

      // 2. Chuyển hướng thông minh theo phương thức thanh toán
      const orderCode = data.data.order.orderCode;
      const isCod = (options?.paymentMethod === "COD") || Boolean((data.data as any)?.isCod);
      if (isCod) {
        if (typeof window !== "undefined") {
          try {
            localStorage.removeItem("trendyfit_active_combo");
          } catch {}
        }
        toast.success("Đặt hàng COD thành công! Đơn hàng đang được đóng gói chuẩn bị giao.");
        router.push(`/orders/${orderCode}?codSuccess=true`);
      } else {
        toast.success(
          data.message || "Tạo đơn hàng thành công! Đang chuyển đến màn hình thanh toán..."
        );
        router.push(`/checkout/payment/${orderCode}`);
      }
    },
    onError: (err: unknown) => {
      const code = getApiErrorCode(err);
      const msg = getApiErrorMessage(err, "Đặt hàng không thành công. Vui lòng thử lại!");

      if (code === "ORDER_PENDING_LIMIT_REACHED") {
        setPendingLimitError(msg);
        toast.warn(msg);
        return;
      }

      if (code === "INSUFFICIENT_STOCK") {
        setStockError(msg);
        toast.error(msg);
        // Refresh cart để lấy tồn kho mới nhất
        queryClient.invalidateQueries({ queryKey: ["cart"] });
        return;
      }

      toast.error(msg);
    },
  });

  // Submit Handler
  const onSubmit = form.handleSubmit((values: CheckoutFormValues) => {
    setPendingLimitError(null);
    setStockError(null);

    if (items.length === 0) {
      toast.error("Giỏ hàng đang trống. Vui lòng chọn sản phẩm trước khi thanh toán.");
      return;
    }

    const currentPaymentMethod = options?.paymentMethod || "VIETQR";
    const payload = {
      recipientName: values.recipientName.trim(),
      recipientPhone: values.recipientPhone.trim(),
      shippingAddress: values.shippingAddress.trim(),
      voucherCode: appliedVoucher?.code || undefined,
      outfitId: eligibleComboCount > 0 && activeCombo ? activeCombo.outfitId : undefined,
      paymentMethod: currentPaymentMethod === "COD" ? ("COD" as const) : ("QR" as const),
      items: items.map((it: CartItem) => ({
        variantId: it.variantId,
        quantity: it.quantity,
      })),
    };

    lockMutation.mutate(payload);
  });

  return {
    form,
    user,
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
    isSubmitting: lockMutation.isPending,
    applyVoucher: handleApplyVoucher,
    removeVoucher: handleRemoveVoucher,
    onSubmit,
  };
}
