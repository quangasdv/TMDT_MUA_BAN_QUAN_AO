"use client";

import { useEffect, type ReactNode } from "react";
import { useAuthStore } from "@/stores/auth.store";
import { ToastContainer } from "react-toastify";

export function AuthProvider({ children }: { children: ReactNode }) {
  const initializeAuth = useAuthStore((state) => state.initializeAuth);

  useEffect(() => {
    // Khởi tạo và re-hydrate thông tin tài khoản từ localStorage và GET /api/auth/me
    initializeAuth();
  }, [initializeAuth]);

  return (
    <>
      {children}
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </>
  );
}

