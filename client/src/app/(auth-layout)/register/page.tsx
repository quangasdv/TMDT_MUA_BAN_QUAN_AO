"use client";

import "./style/register.css";
import { ArrowRight, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import AuthLayout from "../layout";
import { useRegisterForm } from "./hooks/use-register";

export default function Register() {
  // Logic gọi API, xác thực form và phân nhánh lỗi được tách hoàn toàn vào hook useRegisterForm
  const {
    register,
    handleSubmit,
    formState: { errors },
    isSubmitting,
    errorMessage,
    successMessage,
  } = useRegisterForm();

  return (
    <AuthLayout>
      <div className="auth-frame">
        <section className="auth-form-panel" aria-labelledby="register-title">
          <header className="auth-topbar">
            <Link className="auth-brand" href="/" aria-label="Mở trang chủ Trendyfit">
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

            <form className="auth-form" onSubmit={handleSubmit} noValidate>
              {/* Alert thông báo lỗi tổng quan với màu đỏ rõ nét */}
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

              {/* Trường Họ và tên */}
              <div className="auth-field">
                <Label htmlFor="fullName">Họ và tên</Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Nguyễn Văn Khách Hàng"
                  autoComplete="name"
                  aria-invalid={!!errors.fullName}
                  style={{
                    borderColor: errors.fullName ? "#ef4444" : undefined,
                    backgroundColor: errors.fullName ? "#fffafb" : undefined,
                  }}
                  disabled={isSubmitting}
                  {...register("fullName")}
                />
                {errors.fullName && (
                  <p
                    className="auth-field-error"
                    style={{
                      color: "#dc2626",
                      fontSize: "12px",
                      fontWeight: 500,
                      marginTop: "4px",
                      marginBottom: "0",
                      lineHeight: "1.3",
                    }}
                  >
                    {errors.fullName.message}
                  </p>
                )}
              </div>

              {/* Trường Email */}
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
                      lineHeight: "1.3",
                    }}
                  >
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* Trường Số điện thoại (tùy chọn) */}
              <div className="auth-field">
                <Label htmlFor="phone">
                  Số điện thoại{" "}
                  <span style={{ fontSize: "11px", color: "#8b8b81", fontWeight: "normal" }}>
                    (Không bắt buộc)
                  </span>
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="0988888888"
                  autoComplete="tel"
                  aria-invalid={!!errors.phone}
                  style={{
                    borderColor: errors.phone ? "#ef4444" : undefined,
                    backgroundColor: errors.phone ? "#fffafb" : undefined,
                  }}
                  disabled={isSubmitting}
                  {...register("phone")}
                />
                {errors.phone && (
                  <p
                    className="auth-field-error"
                    style={{
                      color: "#dc2626",
                      fontSize: "12px",
                      fontWeight: 500,
                      marginTop: "4px",
                      marginBottom: "0",
                      lineHeight: "1.3",
                    }}
                  >
                    {errors.phone.message}
                  </p>
                )}
              </div>

              {/* Trường Mật khẩu */}
              <div className="auth-field">
                <Label htmlFor="password">Mật khẩu</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Tối thiểu 6 ký tự"
                  autoComplete="new-password"
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
                      lineHeight: "1.3",
                    }}
                  >
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* Trường Xác nhận mật khẩu */}
              <div className="auth-field">
                <Label htmlFor="confirmPassword">Xác nhận mật khẩu</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Nhập lại mật khẩu"
                  autoComplete="new-password"
                  aria-invalid={!!errors.confirmPassword}
                  style={{
                    borderColor: errors.confirmPassword ? "#ef4444" : undefined,
                    backgroundColor: errors.confirmPassword ? "#fffafb" : undefined,
                  }}
                  disabled={isSubmitting}
                  {...register("confirmPassword")}
                />
                {errors.confirmPassword && (
                  <p
                    className="auth-field-error"
                    style={{
                      color: "#dc2626",
                      fontSize: "12px",
                      fontWeight: 500,
                      marginTop: "4px",
                      marginBottom: "0",
                      lineHeight: "1.3",
                    }}
                  >
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>

              <p className="auth-signin">
                Đã có tài khoản? <Link href="/login">Đăng nhập ngay</Link>
              </p>

              <Button className="auth-submit" type="submit" disabled={isSubmitting}>
                <span className="auth-submit-label" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="animate-spin" size={16} />
                      Đang xử lý...
                    </>
                  ) : (
                    "Tạo tài khoản"
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
