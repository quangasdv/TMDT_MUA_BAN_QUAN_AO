"use client";

import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import {
  createPaymentQrApi,
  simulateMockPaymentApi,
  getPaymentOrderByCodeApi,
  CreatePaymentResponse,
} from "../api/payment.api";
import { Order } from "@/app/(storefront)/orders/validation/orders.validation";
import { getApiErrorMessage } from "@/lib/error";

export function usePayment(orderCodeParam: string | number) {
  const queryClient = useQueryClient();
  const orderCode = typeof orderCodeParam === "string" ? parseInt(orderCodeParam, 10) : orderCodeParam;

  const [copiedField, setCopiedField] = useState<string | null>(null);

  // 1. Query: Chi tiết đơn hàng (Polling 3 giây liên tục nếu PENDING_PAYMENT)
  const {
    data: orderResponse,
    isLoading: isOrderLoading,
    isError: isOrderError,
    refetch: refetchOrder,
  } = useQuery({
    queryKey: ["order", orderCode],
    queryFn: () => getPaymentOrderByCodeApi(orderCode),
    enabled: !isNaN(orderCode) && orderCode > 0,
    refetchInterval: (query) => {
      const order = query.state.data?.data?.order;
      if (order?.status === "PENDING_PAYMENT") {
        return 3000; // Poll mỗi 3 giây
      }
      return false;
    },
    staleTime: 2000,
  });

  const order: Order | undefined = orderResponse?.data?.order;

  // 2. Query: Thông tin mã VietQR
  const {
    data: paymentQrResponse,
    isLoading: isQrLoading,
    isError: isQrError,
    error: qrError,
  } = useQuery({
    queryKey: ["payment-qr", orderCode],
    queryFn: () => createPaymentQrApi(orderCode),
    enabled: !isNaN(orderCode) && orderCode > 0 && order?.status === "PENDING_PAYMENT",
    staleTime: 60 * 1000,
  });

  const paymentData: CreatePaymentResponse["data"] | undefined = paymentQrResponse?.data;

  // 3. Mutation: Giả lập thanh toán Dev Mock Payment Engine
  const mockMutation = useMutation({
    mutationFn: () => simulateMockPaymentApi(orderCode),
    onSuccess: (res) => {
      toast.success(
        res.message || "Giả lập thanh toán thành công! Webhook PayOS đã xác thực."
      );
      // Làm mới trạng thái đơn hàng ngay lập tức
      queryClient.invalidateQueries({ queryKey: ["order", orderCode] });
    },
    onError: (err: unknown) => {
      const msg = getApiErrorMessage(err, "Không thể giả lập thanh toán lúc này.");
      toast.error(msg);
    },
  });

  // 4. Utility: Copy clipboard với visual cue & toast
  const copyToClipboard = useCallback((text: string, fieldName: string) => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        setCopiedField(fieldName);
        toast.info(`Đã sao chép: ${text}`);
        setTimeout(() => setCopiedField(null), 2000);
      });
    }
  }, []);

  const isPaid = order?.status === "PAID" || order?.paymentStatus === "PAID";

  return {
    orderCode,
    order,
    paymentData,
    isOrderLoading,
    isQrLoading,
    isOrderError,
    isQrError,
    qrError,
    isPaid,
    copiedField,
    copyToClipboard,
    isSimulatingMock: mockMutation.isPending,
    simulateMockPayment: mockMutation.mutate,
    refetchOrder,
  };
}
