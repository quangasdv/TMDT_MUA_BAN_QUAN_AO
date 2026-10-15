import { z } from "zod";

/**
 * Regex kiểm tra số điện thoại Việt Nam:
 * - Bắt đầu bằng 0 hoặc +84 kết hợp với các đầu số 3, 5, 7, 8, 9
 * - Tổng cộng 10 chữ số (hoặc định dạng quốc tế +84...)
 */
const VIETNAM_PHONE_REGEX = /^(0|\+84)(3|5|7|8|9)[0-9]{8}$/;

/**
 * Validation schema theo đúng đặc tả mục 2.1 của API_DOCUMENTATION.md:
 * - fullName: Bắt buộc, tối thiểu 2 ký tự (min(2))
 * - email: Bắt buộc, đúng định dạng email chuẩn (name@domain.com)
 * - phone: Tùy chọn (không bắt buộc). Nếu nhập thì kiểm tra đúng chuẩn SĐT
 * - password: Bắt buộc, tối thiểu 6 ký tự (min(6))
 * - confirmPassword: Bắt buộc, phải trùng khớp với password
 */
export const registerSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(1, "Vui lòng nhập họ và tên")
      .min(2, "Họ và tên tối thiểu 2 ký tự"),
    email: z
      .string()
      .trim()
      .min(1, "Vui lòng nhập email")
      .email("Email không đúng định dạng tiêu chuẩn (name@domain.com)"),
    phone: z
      .string()
      .trim()
      .optional()
      .refine(
        (val) => !val || VIETNAM_PHONE_REGEX.test(val),
        "Số điện thoại không hợp lệ (10 chữ số, ví dụ: 0988888888)",
      ),
    password: z
      .string()
      .min(1, "Vui lòng nhập mật khẩu")
      .min(6, "Mật khẩu tối thiểu 6 ký tự"),
    confirmPassword: z.string().min(1, "Vui lòng xác nhận lại mật khẩu"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Mật khẩu xác nhận không trùng khớp",
    path: ["confirmPassword"],
  });

export type RegisterFormValues = z.infer<typeof registerSchema>;
