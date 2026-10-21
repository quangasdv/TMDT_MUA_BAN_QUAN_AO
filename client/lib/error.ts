import { AxiosError } from "axios";

/**
 * Cấu trúc lỗi chi tiết theo từng trường (Validation field error)
 * Theo mục 3.1 & 3.2 của API_DOCUMENTATION.md
 */
export interface ApiFieldError {
  field: string;
  message: string;
}

/**
 * Cấu trúc Response lỗi chuẩn (Standard Error Response Format)
 * Trả về từ Backend khi mã HTTP >= 400
 */
export interface ApiErrorResponse {
  success: false;
  errorCode?: string;
  message: string;
  errors?: ApiFieldError[];
}

/**
 * Bảng dịch thông điệp mã lỗi chuẩn hoá sang tiếng Việt thân thiện với người dùng
 * Dựa trên danh mục mã lỗi định danh tại mục 3.2 API_DOCUMENTATION.md
 */
export const ERROR_CODE_MESSAGES: Record<string, string> = {
  AUTH_INVALID_CREDENTIALS: "Email hoặc mật khẩu không chính xác.",
  AUTH_EMAIL_EXISTS: "Email này đã được sử dụng. Vui lòng chọn email khác hoặc đăng nhập.",
  AUTH_UNAUTHORIZED: "Phiên đăng nhập đã hết hạn hoặc không hợp lệ. Vui lòng đăng nhập lại.",
  TOKEN_EXPIRED: "Phiên làm việc đã hết hạn. Hệ thống đang tự động làm mới...",
  FORBIDDEN_ACCESS: "Bạn không có quyền thực hiện hành động này.",
  ORDER_PENDING_LIMIT_REACHED: "Bạn đang có 2 đơn hàng chờ thanh toán. Vui lòng thanh toán đơn cũ hoặc chờ sau 10 phút!",
  INSUFFICIENT_STOCK: "Rất tiếc! Một số sản phẩm trong giỏ đã hết hàng hoặc không đủ số lượng.",
  PRODUCT_INACTIVE: "Sản phẩm đã bị ẩn hoặc ngừng kinh doanh.",
  PRODUCT_NOT_FOUND: "Không tìm thấy sản phẩm yêu cầu.",
  CART_INVALID_QUANTITY: "Số lượng sản phẩm trong giỏ phải là số nguyên dương (tối thiểu là 1).",
  CART_ITEM_NOT_FOUND: "Món đồ không tồn tại trong giỏ hàng.",
  VOUCHER_EXPIRED: "Mã giảm giá đã hết hạn sử dụng.",
  VOUCHER_USAGE_LIMIT: "Mã giảm giá đã hết lượt sử dụng.",
  VOUCHER_MIN_ORDER_VALUE: "Đơn hàng chưa đạt giá trị tối thiểu để áp dụng mã giảm giá.",
  VOUCHER_NOT_FOUND: "Mã giảm giá không tồn tại.",
  RATE_LIMIT_EXCEEDED: "Bạn thao tác quá nhanh. Vui lòng chờ 1 phút rồi thử lại.",
  VALIDATION_ERROR: "Dữ liệu gửi lên chưa hợp lệ. Vui lòng kiểm tra lại các trường thông tin.",
  INTERNAL_SERVER_ERROR: "Hệ thống đang bận hoặc gián đoạn kết nối. Vui lòng thử lại sau ít phút!",
};

/**
 * Kiểm tra xem một đối tượng lỗi có phải là lỗi API Axios chuẩn không
 */
export function isApiError(error: unknown): error is AxiosError<ApiErrorResponse> {
  return (
    typeof error === "object" &&
    error !== null &&
    "isAxiosError" in error &&
    (error as AxiosError).isAxiosError === true
  );
}

/**
 * Trích xuất mã lỗi định danh (errorCode) từ API Error
 */
export function getApiErrorCode(error: unknown): string | undefined {
  if (isApiError(error)) {
    return error.response?.data?.errorCode;
  }
  return undefined;
}

/**
 * Trích xuất thông điệp lỗi thân thiện với người dùng
 */
export function getApiErrorMessage(
  error: unknown,
  fallbackMessage = "Đã có lỗi xảy ra. Vui lòng thử lại sau."
): string {
  if (isApiError(error)) {
    const data = error.response?.data;
    const errorCode = data?.errorCode;

    if (errorCode && ERROR_CODE_MESSAGES[errorCode]) {
      return ERROR_CODE_MESSAGES[errorCode];
    }

    if (data?.message) {
      return data.message;
    }

    const status = error.response?.status;
    if (status === 429) {
      return "Bạn thao tác quá nhanh. Vui lòng chờ 1 phút rồi thử lại.";
    }
    if (status && status >= 500) {
      return "Máy chủ đang gặp sự cố. Vui lòng thử lại sau!";
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallbackMessage;
}

/**
 * Trích xuất danh sách lỗi chi tiết từng trường (Zod Validation Errors)
 */
export function getApiFieldErrors(error: unknown): ApiFieldError[] {
  if (isApiError(error)) {
    const errors = error.response?.data?.errors;
    if (Array.isArray(errors)) {
      return errors;
    }
  }
  return [];
}

