import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { useSyncExternalStore } from "react";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Định dạng tiền tệ VND chuẩn Việt Nam (ví dụ: 249.000 ₫)
 */
export function formatPrice(price: number | string | undefined | null): string {
  if (price === undefined || price === null || price === "") return "0 ₫";
  const num = typeof price === "string" ? parseFloat(price) : Number(price);
  if (isNaN(num)) return "0 ₫";
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(num);
}

const emptySubscribe = () => () => {};

/**
 * Hook kiểm tra trạng thái Client-side Hydration an toàn (Chuẩn React 19)
 * Trả về false trên Server và true ngay sau khi Hydrate trên Client mà không gây cascading render
 */
export function useIsMounted(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}
