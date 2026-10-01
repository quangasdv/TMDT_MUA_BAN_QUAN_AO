import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import AuthLayout from "../layout";

export default function Register() {
  return (
    <AuthLayout>
      <div className="auth-frame">
        <section className="auth-form-panel" aria-labelledby="register-title">
          <header className="auth-topbar">
            <a className="auth-brand" href="#" aria-label="Mở trang chủ Nếp">
              <span className="auth-brand-mark" aria-hidden="true" />
              <span className="auth-brand-name">Trendyfit</span>
            </a>
          </header>

          <div className="auth-form-content">
            <p className="auth-eyebrow">Bắt đầu hành trình của bạn</p>
            <h1 className="auth-title" id="register-title">
              Tạo tài khoản
              <br />
              mới
            </h1>
            <p className="auth-description">
              Khám phá những lựa chọn mang dấu ấn riêng và lưu lại điều bạn yêu
              thích.
            </p>

            <form className="auth-form">
              <div className="auth-field">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="ten@email.com"
                  autoComplete="email"
                  required
                />
              </div>

              <div className="auth-field">
                <Label htmlFor="password">Mật khẩu</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Tối thiểu 8 ký tự"
                  autoComplete="new-password"
                  minLength={8}
                  required
                />
              </div>

              <div className="auth-field">
                <Label htmlFor="confirm-password">Xác nhận mật khẩu</Label>
                <Input
                  id="confirm-password"
                  name="confirmPassword"
                  type="password"
                  placeholder="Nhập lại mật khẩu"
                  autoComplete="new-password"
                  minLength={8}
                  required
                />
              </div>
              <p className="auth-signin">
                Đã có tài khoản? <a href="#signin">Đăng nhập</a>
              </p>
              <Button className="auth-submit" type="button">
                <span className="auth-submit-label">Tạo tài khoản</span>
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
