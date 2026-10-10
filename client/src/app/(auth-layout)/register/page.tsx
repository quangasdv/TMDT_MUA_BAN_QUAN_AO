"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AuthLayout from "../layout";
import { baseAPI } from "@/api/axios.api";

const registerSchema = z
  .object({
    fullName: z.string().min(2, "Họ và tên tối thiểu 2 ký tự"),
    email: z.string().email("Email không hợp lệ"),
    password: z.string().min(6, "Mật khẩu tối thiểu 6 ký tự"),
    confirmPassword: z.string().min(6, "Vui lòng nhập lại mật khẩu"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Mật khẩu xác nhận không trùng khớp",
    path: ["confirmPassword"],
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function Register() {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormValues) => {
    try {
      setErrorMessage(null);
      setSuccessMessage(null);

      const res = await baseAPI.post("/auth/register", {
        fullName: data.fullName,
        email: data.email,
        password: data.password,
      });

      if (res.data?.success) {
        setSuccessMessage("Đăng ký tài khoản thành công! Đang chuyển hướng sang đăng nhập...");
        setTimeout(() => {
          router.push("/login");
        }, 1200);
      }
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Đăng ký thất bại. Vui lòng kiểm tra lại thông tin đăng ký.";
      setErrorMessage(msg);
    }
  };

  return (
    <AuthLayout>
      <div className="auth-frame">
        <section className="auth-form-panel" aria-labelledby="register-title">
          <header className="auth-topbar">
            <Link className="auth-brand" href="/" aria-label="Mở trang chủ Nếp">
              <span className="auth-brand-mark" aria-hidden="true" />
              <span className="auth-brand-name">Trendyfit</span>
            </Link>
          </header>

          <div className="auth-form-content">
            <p className="auth-eyebrow">Bắt đầu hành trình của bạn</p>
            <h1 className="auth-title" id="register-title">
              Tạo tài khoản
              <br />
              mới
            </h1>
            <p className="auth-description">
              Khám phá những lựa chọn mang dấu ấn riêng và lưu lại điều bạn yêu thích.
            </p>

            <form className="auth-form" onSubmit={handleSubmit(onSubmit)}>
              {errorMessage && (
                <div
                  style={{
                    padding: "10px 14px",
                    backgroundColor: "#fef2f2",
                    color: "#dc2626",
                    border: "1px solid #fecaca",
                    borderRadius: "8px",
                    fontSize: "14px",
                  }}
                >
                  {errorMessage}
                </div>
              )}
              {successMessage && (
                <div
                  style={{
                    padding: "10px 14px",
                    backgroundColor: "#f0fdf4",
                    color: "#16a34a",
                    border: "1px solid #bbf7d0",
                    borderRadius: "8px",
                    fontSize: "14px",
                  }}
                >
                  {successMessage}
                </div>
              )}

              <div className="auth-field">
                <Label htmlFor="fullName">Họ và tên</Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Nguyễn Văn A"
                  autoComplete="name"
                  {...register("fullName")}
                />
                {errors.fullName && (
                  <p className="text-sm text-red-500 mt-1">{errors.fullName.message}</p>
                )}
              </div>

              <div className="auth-field">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="ten@email.com"
                  autoComplete="email"
                  {...register("email")}
                />
                {errors.email && (
                  <p className="text-sm text-red-500 mt-1">{errors.email.message}</p>
                )}
              </div>

              <div className="auth-field">
                <Label htmlFor="password">Mật khẩu</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Tối thiểu 6 ký tự"
                  autoComplete="new-password"
                  {...register("password")}
                />
                {errors.password && (
                  <p className="text-sm text-red-500 mt-1">{errors.password.message}</p>
                )}
              </div>

              <div className="auth-field">
                <Label htmlFor="confirmPassword">Xác nhận mật khẩu</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Nhập lại mật khẩu"
                  autoComplete="new-password"
                  {...register("confirmPassword")}
                />
                {errors.confirmPassword && (
                  <p className="text-sm text-red-500 mt-1">{errors.confirmPassword.message}</p>
                )}
              </div>

              <p className="auth-signin">
                Đã có tài khoản? <Link href="/login">Đăng nhập</Link>
              </p>

              <Button className="auth-submit" type="submit" disabled={isSubmitting}>
                <span className="auth-submit-label">
                  {isSubmitting ? "Đang xử lý..." : "Tạo tài khoản"}
                </span>
                <ArrowRight aria-hidden="true" size={16} />
              </Button>
            </form>

            <p className="auth-terms">
              Bằng việc tiếp tục, bạn đồng ý với{" "}
              <a href="#terms">Điều khoản sử dụng</a> và{" "}
              <a href="#privacy">Chính sách bảo mật</a> của Trendyfit.
            </p>
          </div>

          <p className="auth-bottom-note">
            © 2026 Trendyfit. Mọi lựa chọn đều có câu chuyện.
          </p>
        </section>

        <aside className="auth-banner" aria-label="Cảm hứng phong cách">
          <div className="auth-banner-kicker">
            <span aria-hidden="true" />
            Chọn điều khiến bạn rung động
          </div>

          <div className="auth-banner-copy">
            <p className="auth-banner-index">01 / Phong cách là của bạn</p>
            <h2 className="auth-banner-title">
              Điều bạn chọn, kể câu chuyện của bạn.
            </h2>
            <p className="auth-banner-text">
              Tìm thấy những món đồ yêu thích, từ những thương hiệu bạn chưa từng biết.
            </p>
            <div className="auth-banner-footer">
              <p className="auth-banner-caption">
                Khám phá theo cách riêng của bạn
              </p>
              <div className="auth-banner-dots" aria-hidden="true">
                <span />
                <span />
                <span />
              </div>
            </div>
          </div>
        </aside>
      </div>
    </AuthLayout>
  );
}
