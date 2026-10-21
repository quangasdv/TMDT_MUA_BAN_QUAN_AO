"use client";

import { Suspense } from "react";
import "./style/login.css";
import { ArrowRight, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useLoginForm } from "./hooks/use-login";

function LoginFormContent() {
  const {
    register,
    handleSubmit,
    formState: { errors },
    isSubmitting,
    errorMessage,
    successMessage,
  } = useLoginForm();

  return (
    <div className="auth-frame">
      <section className="auth-form-panel" aria-labelledby="login-title">
        <header className="auth-topbar">
          <Link className="auth-brand" href="/" aria-label="Mở trang chủ Trendyfit">
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
            Tiếp tục hành trình khám phá phong cách thời trang của riêng bạn.
          </p>

          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            {/* Alert thông báo lỗi tổng quan */}
            {errorMessage && (
              <div
                role="alert"
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "10px",
                  padding: "11px 14px",
                  backgroundColor: "#fef2f2",
                  color: "#dc2626",
                  border: "1px solid #fecaca",
                  borderRadius: "8px",
                  fontSize: "13px",
                  lineHeight: "1.45",
                }}
              >
                <AlertCircle
                  style={{
                    width: "16px",
                    height: "16px",
                    minWidth: "16px",
                    color: "#dc2626",
                    marginTop: "2px",
                  }}
                />
                <span style={{ color: "#dc2626", fontWeight: 500 }}>
                  {errorMessage}
                </span>
              </div>
            )}

            {/* Alert thông báo thành công */}
            {successMessage && (
              <div
                role="status"
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "10px",
                  padding: "11px 14px",
                  backgroundColor: "#f0fdf4",
                  color: "#16a34a",
                  border: "1px solid #bbf7d0",
                  borderRadius: "8px",
                  fontSize: "13px",
                  lineHeight: "1.45",
                }}
              >
                <CheckCircle2
                  style={{
                    width: "16px",
                    height: "16px",
                    minWidth: "16px",
                    color: "#16a34a",
                    marginTop: "2px",
                  }}
                />
                <span style={{ color: "#15803d", fontWeight: 500 }}>
                  {successMessage}
                </span>
              </div>
            )}

            {/* Ô nhập Email */}
            <div className="auth-field">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="customer@gmail.com"
                autoComplete="email"
                aria-invalid={!!errors.email}
                style={{
                  borderColor: errors.email ? "#ef4444" : undefined,
                  backgroundColor: errors.email ? "#fffafb" : undefined,
                }}
                disabled={isSubmitting}
                {...register("email")}
              />
              {errors.email && (
                <p
                  className="auth-field-error"
                  style={{
                    color: "#dc2626",
                    fontSize: "12px",
                    fontWeight: 500,
                    marginTop: "4px",
                    marginBottom: "0",
                  }}
                >
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Ô nhập Mật khẩu */}
            <div className="auth-field">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Label htmlFor="password">Mật khẩu</Label>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="Nhập mật khẩu"
                autoComplete="current-password"
                aria-invalid={!!errors.password}
                style={{
                  borderColor: errors.password ? "#ef4444" : undefined,
                  backgroundColor: errors.password ? "#fffafb" : undefined,
                }}
                disabled={isSubmitting}
                {...register("password")}
              />
              {errors.password && (
                <p
                  className="auth-field-error"
                  style={{
                    color: "#dc2626",
                    fontSize: "12px",
                    fontWeight: 500,
                    marginTop: "4px",
                    marginBottom: "0",
                  }}
                >
                  {errors.password.message}
                </p>
              )}
            </div>

            <p className="auth-signin">
              Chưa có tài khoản? <Link href="/register">Tạo tài khoản mới</Link>
            </p>

            <Button className="auth-submit" type="submit" disabled={isSubmitting}>
              <span className="auth-submit-label" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="animate-spin" size={16} />
                    Đang đăng nhập...
                  </>
                ) : (
                  "Đăng nhập"
                )}
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
          © 2026 Trendyfit. Nền tảng TMĐT thời trang thông minh.
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
            Tìm thấy những món đồ yêu thích, phối trang phục trực quan và trải nghiệm gợi ý kích cỡ vừa vặn hoàn hảo.
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
  );
}

export default function Login() {
  return (
    <Suspense
      fallback={
        <div style={{ display: "grid", placeItems: "center", minHeight: "60vh", color: "#71717a" }}>
          <Loader2 className="animate-spin" size={32} />
        </div>
      }
    >
      <LoginFormContent />
    </Suspense>
  );
}
