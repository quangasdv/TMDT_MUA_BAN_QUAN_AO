"use client";

import { create } from "zustand";
import { AuthUser, getMeApi, logoutApi } from "@/api/auth.api";

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;

  setAuth: (user: AuthUser, token: string) => void;
  clearAuth: () => void;
  initializeAuth: () => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isLoading: false,
  isInitialized: false,

  setAuth: (user: AuthUser, accessToken: string) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("accessToken", accessToken);
      localStorage.setItem("user", JSON.stringify(user));
    }
    set({
      user,
      accessToken,
      isAuthenticated: true,
      isLoading: false,
      isInitialized: true,
    });
  },

  clearAuth: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("user");
    }
    set({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: false,
      isInitialized: true,
    });
  },

  initializeAuth: async () => {
    if (typeof window === "undefined") return;

    const token = localStorage.getItem("accessToken");
    const cachedUserStr = localStorage.getItem("user");

    let initialUser: AuthUser | null = null;
    if (cachedUserStr) {
      try {
        initialUser = JSON.parse(cachedUserStr);
      } catch {
        localStorage.removeItem("user");
      }
    }

    if (!token) {
      set({
        user: null,
        accessToken: null,
        isAuthenticated: false,
        isLoading: false,
        isInitialized: true,
      });
      return;
    }

    // Tạm thời nạp token và user đã cache trong lúc đợi verify với server
    set({
      accessToken: token,
      user: initialUser,
      isAuthenticated: true,
      isLoading: true,
    });

    try {
      const res = await getMeApi();
      if (res.success && res.data?.user) {
        const verifiedUser = res.data.user;
        localStorage.setItem("user", JSON.stringify(verifiedUser));
        set({
          user: verifiedUser,
          isAuthenticated: true,
          isLoading: false,
          isInitialized: true,
        });
      }
    } catch {
      // Nếu token không còn hợp lệ (kể cả sau khi refresh thất bại), dọn sạch auth
      get().clearAuth();
    }
  },

  logout: async () => {
    set({ isLoading: true });
    try {
      await logoutApi();
    } catch {
      // Dù API logout có lỗi mạng thì vẫn xóa phiên phía client
    } finally {
      get().clearAuth();
    }
  },
}));

// Lắng nghe sự kiện token hết hạn từ Axios Interceptor để đồng bộ trạng thái lập tức
if (typeof window !== "undefined") {
  window.addEventListener("auth:expired", () => {
    useAuthStore.getState().clearAuth();
  });
}

