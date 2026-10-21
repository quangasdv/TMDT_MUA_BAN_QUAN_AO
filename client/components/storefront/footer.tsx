import React from "react";
import Link from "next/link";
import { Sparkles, ShieldCheck, Truck, RotateCcw } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border bg-card text-card-foreground mt-auto">
      {/* Value Proposition Bar */}
      <div className="border-b border-border/60 bg-muted/20 py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-center sm:text-left">
            <div className="flex items-center gap-3 justify-center sm:justify-start">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/20 text-primary">
                <Truck size={20} />
              </div>
              <div>
                <h4 className="text-sm font-semibold">Giao hàng toàn quốc</h4>
                <p className="text-xs text-muted-foreground">Miễn phí cho đơn hàng từ 499.000 ₫</p>
              </div>
            </div>

            <div className="flex items-center gap-3 justify-center sm:justify-start">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/20 text-primary">
                <RotateCcw size={20} />
              </div>
              <div>
                <h4 className="text-sm font-semibold">Đổi trả trong 7 ngày</h4>
                <p className="text-xs text-muted-foreground">Thủ tục nhanh gọn, tận nơi</p>
              </div>
            </div>

            <div className="flex items-center gap-3 justify-center sm:justify-start">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/20 text-primary">
                <Sparkles size={20} />
              </div>
              <div>
                <h4 className="text-sm font-semibold">Smart Fit Advisor</h4>
                <p className="text-xs text-muted-foreground">Gợi ý kích cỡ vừa vặn chuẩn xác</p>
              </div>
            </div>

            <div className="flex items-center gap-3 justify-center sm:justify-start">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/20 text-primary">
                <ShieldCheck size={20} />
              </div>
              <div>
                <h4 className="text-sm font-semibold">Thanh toán an toàn</h4>
                <p className="text-xs text-muted-foreground">Hỗ trợ VietQR & Cổng PayOS</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <Link href="/" className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-black text-sm">
                TF
              </span>
              <span className="text-2xl font-black tracking-tight">
                Trendy<span className="text-primary-foreground bg-primary px-1 rounded ml-0.5">Fit</span>
              </span>
            </Link>
            <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">
              Nền tảng thương mại điện tử thời trang B2C thông minh theo kiến trúc Headless Commerce, tích hợp phòng phối đồ trực quan 2D và thuật toán đo size độc quyền.
            </p>
            <div className="text-xs text-muted-foreground pt-2">
              <p>Hotline: 1900 6868 (8:00 - 21:00 hàng ngày)</p>
              <p>Email: support@trendyfit.vn</p>
            </div>
          </div>

          {/* Cột 1: Mua sắm */}
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider mb-4">Mua sắm</h4>
            <ul className="space-y-2.5 text-sm text-muted-foreground">
              <li>
                <Link href="/products" className="hover:text-foreground transition-colors">
                  Tất cả sản phẩm
                </Link>
              </li>
              <li>
                <Link href="/products?category=ao-thun" className="hover:text-foreground transition-colors">
                  Áo Thun & Sơ Mi
                </Link>
              </li>
              <li>
                <Link href="/products?category=quan-jean" className="hover:text-foreground transition-colors">
                  Quần Jean & Kaki
                </Link>
              </li>
              <li>
                <Link href="/products?category=ao-khoac" className="hover:text-foreground transition-colors">
                  Áo Khoác Nam Nữ
                </Link>
              </li>
              <li>
                <Link href="/outfits" className="hover:text-foreground transition-colors">
                  Bộ phối đồ Lookbook
                </Link>
              </li>
            </ul>
          </div>

          {/* Cột 2: Hỗ trợ khách hàng */}
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider mb-4">Chăm sóc khách hàng</h4>
            <ul className="space-y-2.5 text-sm text-muted-foreground">
              <li>
                <Link href="/products" className="hover:text-foreground transition-colors">
                  Hướng dẫn chọn size
                </Link>
              </li>
              <li>
                <Link href="/orders" className="hover:text-foreground transition-colors">
                  Tra cứu đơn hàng
                </Link>
              </li>
              <li>
                <span className="hover:text-foreground transition-colors cursor-pointer">
                  Chính sách bảo hành & đổi trả
                </span>
              </li>
              <li>
                <span className="hover:text-foreground transition-colors cursor-pointer">
                  Chính sách giao hàng
                </span>
              </li>
              <li>
                <span className="hover:text-foreground transition-colors cursor-pointer">
                  Câu hỏi thường gặp (FAQ)
                </span>
              </li>
            </ul>
          </div>

          {/* Cột 3: Về TrendyFit */}
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider mb-4">Về chúng tôi</h4>
            <ul className="space-y-2.5 text-sm text-muted-foreground">
              <li>
                <span className="hover:text-foreground transition-colors cursor-pointer">
                  Câu chuyện thương hiệu
                </span>
              </li>
              <li>
                <span className="hover:text-foreground transition-colors cursor-pointer">
                  Tuyển dụng
                </span>
              </li>
              <li>
                <span className="hover:text-foreground transition-colors cursor-pointer">
                  Điều khoản dịch vụ
                </span>
              </li>
              <li>
                <span className="hover:text-foreground transition-colors cursor-pointer">
                  Chính sách bảo mật
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-border mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <p>© 2026 TrendyFit Inc. Toàn bộ bản quyền được bảo lưu.</p>
          <div className="flex items-center gap-4">
            <span>Next.js 16 (App Router)</span>
            <span>·</span>
            <span>Tailwind CSS</span>
            <span>·</span>
            <span>Headless Commerce</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

