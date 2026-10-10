import axios from "axios";

export const baseAPI = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api",
  withCredentials: true,
});

// Request Interceptor: Tự động đính kèm Bearer token và session id (sinh tự động nếu chưa có)
baseAPI.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("accessToken");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      let sessionId = localStorage.getItem("trendyfit_session_id");
      if (!sessionId) {
        sessionId = "guest_" + Math.random().toString(36).substring(2, 12) + "_" + Date.now();
        localStorage.setItem("trendyfit_session_id", sessionId);
      }
      config.headers["x-session-id"] = sessionId;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Tự động làm mới token nếu gặp 401
baseAPI.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes("/auth/login") &&
      !originalRequest.url?.includes("/auth/refresh")
    ) {
      originalRequest._retry = true;
      try {
        const refreshRes = await baseAPI.post("/auth/refresh");
        if (refreshRes.data?.success && refreshRes.data?.data?.accessToken) {
          const newToken = refreshRes.data.data.accessToken;
          localStorage.setItem("accessToken", newToken);
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return baseAPI(originalRequest);
        }
      } catch {
        if (typeof window !== "undefined") {
          localStorage.removeItem("accessToken");
          localStorage.removeItem("user");
        }
      }
    }
    return Promise.reject(error);
  }
);
