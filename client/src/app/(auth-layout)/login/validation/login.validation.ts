import { z } from "zod";

/**
 * Validation schema cho đăng nhập theo mục 2.1 API_DOCUMENTATION.md:
 * - email: Bắt buộc, đúng định dạng email
 * - password: Bắt buộc, tối thiểu 6 ký tự
 */
export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Vui lòng nhập email đăng nhập")
    .email("Email không đúng định dạng tiêu chuẩn (name@domain.com)"),
  password: z
    .string()
    .min(1, "Vui lòng nhập mật khẩu")
    .min(6, "Mật khẩu tối thiểu 6 ký tự"),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

