import { baseAPI } from "@/api/axios.api";
import { AuthUser } from "@/api/auth.api";
import { useMutation, UseMutationOptions } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { ApiErrorResponse } from "@/lib/error";

/**
 * Payload gửi lên API POST /auth/login
 * Theo mục 2.1 API_DOCUMENTATION.md
 */
export interface LoginRequest {
  email: string;
  password: string;
  guestSessionId?: string | null;
}

/**
 * Cấu trúc Response thành công (200 OK) của POST /auth/login
 */
export interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    user: AuthUser;
    accessToken: string;
  };
}

/**
 * Hàm gọi API POST /auth/login bằng Axios baseAPI
 */
export const loginApi = async (payload: LoginRequest): Promise<LoginResponse> => {
  const response = await baseAPI.post<LoginResponse>("/auth/login", payload);
  return response.data;
};

/**
 * Hook useLoginMutation tích hợp TanStack React Query
 */
export const useLoginMutation = (
  options?: UseMutationOptions<LoginResponse, AxiosError<ApiErrorResponse>, LoginRequest>
) => {
  return useMutation({
    mutationFn: loginApi,
    ...options,
  });
};

