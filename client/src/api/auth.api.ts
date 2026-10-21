import { baseAPI } from "./axios.api";

/**
 * Các vai trò người dùng trong hệ thống TrendyFit
 * Khớp chuẩn hóa 100% với enum Role trong schema.prisma và API_DOCUMENTATION.md
 */
export type UserRole = "CUSTOMER" | "ADMIN" | "STAFF";

/**
 * Cấu trúc thông tin tài khoản người dùng
 */
export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  phone?: string | null;
  createdAt?: string;
}

/**
 * Response của API GET /auth/me
 */
export interface GetMeResponse {
  success: boolean;
  data: {
    user: AuthUser;
  };
}

/**
 * Response của API POST /auth/logout
 */
export interface LogoutResponse {
  success: boolean;
  message: string;
}

/**
 * Response của API POST /auth/refresh
 */
export interface RefreshResponse {
  success: boolean;
  data: {
    accessToken: string;
  };
}

/**
 * Lấy thông tin tài khoản đang đăng nhập
 * GET /api/auth/me (Yêu cầu Bearer Token)
 */
export const getMeApi = async (): Promise<GetMeResponse> => {
  const response = await baseAPI.get<GetMeResponse>("/auth/me");
  return response.data;
};

/**
 * Đăng xuất tài khoản và xóa Refresh Token cookie trên máy chủ
 * POST /api/auth/logout (Yêu cầu Bearer Token)
 */
export const logoutApi = async (): Promise<LogoutResponse> => {
  const response = await baseAPI.post<LogoutResponse>("/auth/logout");
  return response.data;
};

/**
 * Cấp mới Access Token thông qua Refresh Token HttpOnly Cookie
 * POST /api/auth/refresh
 */
export const refreshApi = async (): Promise<RefreshResponse> => {
  const response = await baseAPI.post<RefreshResponse>("/auth/refresh");
  return response.data;
};

