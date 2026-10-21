import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";

export const baseAPI = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api",
  withCredentials: true,
});

/**
 * Trích xuất hoặc khởi tạo Session ID cho khách vãng lai
 * Bảo đảm session guest luôn được bảo toàn xuyên suốt
 */
export const getOrCreateSessionId = (): string => {
  if (typeof window === "undefined") return "";
  let sessionId = localStorage.getItem("trendyfit_session_id");
  if (!sessionId) {
    sessionId = "guest_" + Math.random().toString(36).substring(2, 12) + "_" + Date.now();
    localStorage.setItem("trendyfit_session_id", sessionId);
  }
  return sessionId;
};

// Request Interceptor: Tự động đính kèm Bearer token và session id
baseAPI.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("accessToken");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      const sessionId = getOrCreateSessionId();
      if (sessionId) {
        config.headers["x-session-id"] = sessionId;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Hàng đợi lưu các request đang chờ cấp token mới (chống race condition khi nhiều request 401 đồng thời)
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else if (token) {
      promise.resolve(token);
    }
  });
  failedQueue = [];
};

// Response Interceptor: Tự động làm mới token nếu gặp 401 và chặn vòng lặp vô tận
baseAPI.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (!originalRequest) {
      return Promise.reject(error);
    }

    const url = originalRequest.url || "";
    const isAuthRoute =
      url.includes("/auth/login") ||
      url.includes("/auth/refresh") ||
      url.includes("/auth/register");

    // Chỉ thử làm mới token nếu gặp 401, không phải route auth và chưa từng retry
    if (error.response?.status === 401 && !originalRequest._retry && !isAuthRoute) {
      if (isRefreshing) {
        // Đã có 1 request đang thực hiện refresh -> đẩy request này vào hàng đợi chờ token mới
        return new Promise<string>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((newToken) => {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return baseAPI(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshRes = await baseAPI.post<{
          success: boolean;
          data: { accessToken: string };
        }>("/auth/refresh");

        if (refreshRes.data?.success && refreshRes.data?.data?.accessToken) {
          const newToken = refreshRes.data.data.accessToken;
          if (typeof window !== "undefined") {
            localStorage.setItem("accessToken", newToken);
          }
          processQueue(null, newToken);
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return baseAPI(originalRequest);
        } else {
          throw new Error("Không nhận được token mới từ /auth/refresh");
        }
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        if (typeof window !== "undefined") {
          localStorage.removeItem("accessToken");
          localStorage.removeItem("user");
          // Phát sự kiện toàn cục để auth store cập nhật đồng bộ
          window.dispatchEvent(new CustomEvent("auth:expired"));
        }
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);
