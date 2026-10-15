import { baseAPI } from "@/api/axios.api";
import { useMutation, UseMutationOptions } from "@tanstack/react-query";
import { AxiosError } from "axios";

/**
 * Cấu trúc dữ liệu Request gửi lên API POST /auth/register
 * Theo mục 2.1 API_DOCUMENTATION.md
 */
export interface RegisterRequest {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
}

/**
 * Thông tin người dùng trả về trong response đăng ký
 */
export interface RegisteredUser {
  id: string;
  email: string;
  fullName: string;
  role: string;
  phone?: string | null;
  createdAt?: string;
}

/**
 * Cấu trúc Response thành công (201 Created)
 * Theo mục 2.1 API_DOCUMENTATION.md
 */
export interface RegisterResponse {
  success: boolean;
  message: string;
  data: {
    user: RegisteredUser;
  };
}

/**
 * Chi tiết lỗi từng trường dữ liệu trả về khi gặp lỗi kiểm tra hợp lệ
 */
export interface ApiFieldError {
  field: string;
  message: string;
}

/**
 * Các mã lỗi định danh (errorCode) trả về theo quy chuẩn mục 3.1 & 3.2
 */
export type RegisterErrorCode =
  | "AUTH_EMAIL_EXISTS"
  | "VALIDATION_ERROR"
  | "RATE_LIMIT_EXCEEDED"
  | "INTERNAL_SERVER_ERROR"
  | (string & {});

/**
 * Cấu trúc Response lỗi chuẩn (Standard Error Response)
 * Theo mục 3.1 API_DOCUMENTATION.md
 */
export interface ApiErrorResponse {
  success: false;
  errorCode: RegisterErrorCode;
  message: string;
  errors?: ApiFieldError[];
}

/**
 * Hàm gọi API POST /auth/register bằng Axios baseAPI
 */
export const registerApi = async (
  payload: RegisterRequest
): Promise<RegisterResponse> => {
  const response = await baseAPI.post<RegisterResponse>("/auth/register", payload);
  return response.data;
};

/**
 * Hook useRegisterMutation tích hợp TanStack React Query
 */
export const useRegisterMutation = (
  options?: UseMutationOptions<
    RegisterResponse,
    AxiosError<ApiErrorResponse>,
    RegisterRequest
  >
) => {
  return useMutation({
    mutationFn: registerApi,
    ...options,
  });
};

