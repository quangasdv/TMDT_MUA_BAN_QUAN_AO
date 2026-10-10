"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AuthLayout from "../layout";
import { baseAPI } from "@/api/axios.api";

const loginSchema = z.object({
  email: z.string().email("Email không hợp lệ"),
  password: z.string().min(6, "Mật khẩu tối thiểu 6 ký tự"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function Login() {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormValues) => {
    try {
      setErrorMessage(null);
      setSuccessMessage(null);

      const guestSessionId =
        typeof window !== "undefined"
          ? localStorage.getItem("trendyfit_session_id")
          : null;

      const res = await baseAPI.post("/auth/login", {
        email: data.email,
        password: data.password,
        guestSessionId,
      });

      if (res.data?.success) {
        const { user, accessToken } = res.data.data;
        localStorage.setItem("accessToken", accessToken);
        localStorage.setItem("user", JSON.stringify(user));
        setSuccessMessage(`Đăng nhập thành công! Xin chào ${user.fullName}`);

        setTimeout(() => {
          router.push("/");
        }, 1000);
      }
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin kết nối.";
      setErrorMessage(msg);
    }
  };

  return (
    <AuthLayout>
      <div className="auth-frame">
        <section className="auth-form-panel" aria-labelledby="login-title">
          <header className="auth-topbar">
            <Link className="auth-brand" href="/" aria-label="Mở trang chủ Nếp">
              <span className="auth-brand-mark" aria-hidden="true" />
              <span className="auth-brand-name">Trendyfit</span>
            </Link>
          </header>

          <div className="auth-form-content">
            <p className="auth-eyebrow">Chào mừng trở lại</p>
            <h1 className="auth-title" id="login-title">
              Đăng nhập
              <br />
              tài khoản
            </h1>
            <p className="auth-description">
              Tiếp tục hành trình khám phá phong cách của riêng bạn.
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
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="ten@email.com"
                  autoComplete="email"
                  {...register("email")}
                />
                {errors.email && (
                  <p className="text-sm text-red-500 mt-1">
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div className="auth-field">
                <Label htmlFor="password">Mật khẩu</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Nhập mật khẩu"
                  autoComplete="current-password"
                  {...register("password")}
                />
                {errors.password && (
                  <p className="text-sm text-red-500 mt-1">
                    {errors.password.message}
                  </p>
                )}
              </div>

              <p className="auth-signin">
                Chưa có tài khoản? <Link href="/register">Tạo tài khoản</Link>
              </p>

              <Button
                className="auth-submit"
                type="submit"
                disabled={isSubmitting}
              >
                <span className="auth-submit-label">Đăng nhập</span>
                <ArrowRight aria-hidden="true" size={16} />
              </Button>
            </form>

            <p className="auth-terms">
              Bằng việc tiếp tục, bạn đồng ý với{" "}
              <a href="#terms">Điều khoản sử dụng</a> và{" "}
              <a href="#privacy">Chính sách bảo mật</a> của nếp.
            </p>
          </div>

          <p className="auth-bottom-note">
            © 2026 nếp. Mọi lựa chọn đều có câu chuyện.
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
              Tìm thấy những món đồ yêu thích, từ những thương hiệu bạn chưa
              từng biết.
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
