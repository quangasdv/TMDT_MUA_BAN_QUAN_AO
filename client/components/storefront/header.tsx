"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { getCategoriesApi } from "@/api/products.api";
import { useAuthStore } from "@/stores/auth.store";
import { useCart } from "@/app/(storefront)/cart/hooks/use-cart";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn, useIsMounted } from "@/lib/utils";
import {
  Search,
  ShoppingBag,
  Menu,
  X,
  LogOut,
  Shield,
  Layers,
  ChevronDown,
} from "lucide-react";

export function Header() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const mounted = useIsMounted();

  const { user, isAuthenticated, logout } = useAuthStore();
  const { totalItemCount } = useCart();

  // Lấy danh mục sản phẩm từ API
  const { data: categoriesData } = useQuery({
    queryKey: ["categories"],
    queryFn: getCategoriesApi,
    staleTime: 5 * 60 * 1000,
  });

  const categories = categoriesData?.data?.categories || [];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/products?q=${encodeURIComponent(searchQuery.trim())}`);
      setMobileMenuOpen(false);
    }
  };

  const handleLogout = async () => {
    setUserMenuOpen(false);
    await logout();
    router.push("/");
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/70 bg-background/90 backdrop-blur-md transition-all">
      {/* Top Banner Thông Báo */}
      <div className="hidden sm:block bg-muted/60 py-1.5 text-center text-xs text-muted-foreground border-b border-border/40 font-medium">
        <span>
          Miễn phí giao hàng cho đơn từ 499.000 ₫ · Đổi trả miễn phí trong 7
          ngày
        </span>
      </div>

      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8 h-16 sm:h-20">
        {/* Mobile menu toggle & Logo */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="md:hidden p-1.5 text-muted-foreground hover:text-foreground"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Mở menu"
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>

          <Link href="/" className="flex items-center gap-2 group">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-extrabold text-sm tracking-tight shadow-sm transition-transform group-hover:scale-105">
              TF
            </span>
            <span className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
              Trendy
              <span className="text-primary-foreground bg-primary px-1 rounded ml-0.5">
                Fit
              </span>
            </span>
          </Link>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 lg:gap-8 text-sm font-medium">
          <Link
            href="/products"
            className="text-foreground/80 hover:text-foreground transition-colors hover:font-semibold"
          >
            Tất cả sản phẩm
          </Link>

          {/* Quick Categories */}
          {categories.slice(0, 4).map((cat) => (
            <Link
              key={cat.id}
              href={`/products?category=${cat.slug}`}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              {cat.name}
            </Link>
          ))}

          <Link
            href="/outfits"
            className="flex items-center gap-1.5 text-primary-foreground font-semibold bg-primary/20 hover:bg-primary/30 px-2.5 py-1 rounded-full text-xs transition-colors"
          >
            <Layers size={13} />
            Combo thời trang
          </Link>
        </nav>

        {/* Search Bar & Action Buttons */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Desktop Search Form */}
          <form
            onSubmit={handleSearchSubmit}
            className="relative hidden lg:block w-48 xl:w-64"
          >
            <Input
              type="search"
              placeholder="Tìm kiếm thời trang..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 pr-8 text-xs bg-muted/40 focus:bg-background border-border"
            />
            <button
              type="submit"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label="Tìm kiếm"
            >
              <Search size={15} />
            </button>
          </form>

          {/* Mobile Search Button (Quick Jump) */}
          <Link
            href="/products"
            className="lg:hidden p-2 text-muted-foreground hover:text-foreground"
            aria-label="Tìm kiếm"
          >
            <Search size={20} />
          </Link>

          {/* User Account Menu */}
          <div className="relative">
            {mounted && isAuthenticated && user ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 rounded-full border border-slate-200 bg-white pl-1.5 pr-2.5 sm:pr-3 py-1 text-xs font-semibold text-slate-800 hover:border-slate-300 hover:bg-slate-50 transition-all shadow-xs"
                >
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground font-black text-[11px] shadow-xs">
                    {user.fullName
                      ? user.fullName.charAt(0).toUpperCase()
                      : "U"}
                  </span>
                  <span className="hidden sm:inline-block max-w-[120px] truncate text-slate-900 font-bold">
                    {user.fullName}
                  </span>
                  <ChevronDown
                    size={13}
                    className={cn(
                      "text-slate-400 transition-transform duration-200",
                      userMenuOpen && "rotate-180 text-slate-800",
                    )}
                  />
                </button>

                {userMenuOpen && (
                  <>
                    {/* Backdrop to close menu on click outside */}
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setUserMenuOpen(false)}
                      aria-hidden="true"
                    />

                    {/* Dropdown Menu Container */}
                    <div className="absolute right-0 mt-2.5 w-64 rounded-2xl border border-slate-200 bg-white p-2.5 shadow-2xl z-50 text-xs animate-in fade-in-0 zoom-in-95 slide-in-from-top-2 duration-150">
                      {/* User Header Profile Card */}
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 mb-2">
                        <div className="flex items-center gap-2.5">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-black text-sm shadow-xs">
                            {user.fullName
                              ? user.fullName.charAt(0).toUpperCase()
                              : "U"}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="font-bold text-slate-900 truncate text-xs">
                              {user.fullName}
                            </p>
                            <p className="text-[11px] text-slate-500 truncate">
                              {user.email}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-slate-200/70 text-[10px]">
                          <span className="text-slate-500 font-medium">
                            Vai trò:
                          </span>
                          <span
                            className={cn(
                              "font-bold px-2 py-0.5 rounded-full uppercase tracking-wider text-[10px]",
                              user.role === "ADMIN"
                                ? "bg-purple-100 text-purple-900 border border-purple-300"
                                : user.role === "STAFF"
                                  ? "bg-blue-100 text-blue-900 border border-blue-300"
                                  : "bg-primary/30 text-slate-900 border border-primary/50",
                            )}
                          >
                            {user.role === "ADMIN"
                              ? "Quản trị viên"
                              : user.role === "STAFF"
                                ? "Nhân viên"
                                : "Khách hàng"}
                          </span>
                        </div>
                      </div>

                      {/* Navigation Actions */}
                      <div className="space-y-1">
                        {(user.role === "ADMIN" || user.role === "STAFF") && (
                          <Link
                            href="/admin/orders"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-800 hover:bg-slate-100 hover:text-slate-950 font-semibold transition-all group"
                          >
                            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-slate-900 text-primary">
                              <Shield size={13} />
                            </div>
                            <span>Trang quản trị ({user.role})</span>
                          </Link>
                        )}

                        <Link
                          href="/orders"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-800 hover:bg-slate-100 hover:text-slate-950 font-semibold transition-all group"
                        >
                          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-slate-100 text-slate-700 group-hover:bg-slate-200">
                            <ShoppingBag size={13} />
                          </div>
                          <span>Đơn hàng của tôi</span>
                        </Link>

                        <Link
                          href="/outfits"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-800 hover:bg-slate-100 hover:text-slate-950 font-semibold transition-all group"
                        >
                          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-slate-100 text-slate-700 group-hover:bg-slate-200">
                            <Layers size={13} />
                          </div>
                          <span>Combo thời trang ưu đãi</span>
                        </Link>
                      </div>

                      <div className="h-px bg-slate-100 my-1.5" />

                      {/* Logout */}
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-rose-600 hover:bg-rose-50 hover:text-rose-700 font-semibold transition-all cursor-pointer text-left"
                      >
                        <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-rose-100/60 text-rose-600">
                          <LogOut size={13} />
                        </div>
                        <span>Đăng xuất</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-1 sm:gap-2">
                <Link
                  href="/login"
                  className={cn(
                    buttonVariants({ variant: "ghost", size: "sm" }),
                    "text-xs h-8 px-2.5",
                  )}
                >
                  Đăng nhập
                </Link>
                <Link
                  href="/register"
                  className={cn(
                    buttonVariants({ size: "sm" }),
                    "hidden sm:inline-flex text-xs h-8 px-3",
                  )}
                >
                  Đăng ký
                </Link>
              </div>
            )}
          </div>

          {/* Cart Icon */}
          <Link
            href="/cart"
            className="relative flex items-center justify-center p-2 rounded-full border border-border/80 hover:bg-muted/50 transition-colors"
            aria-label="Giỏ hàng"
          >
            <ShoppingBag size={18} />
            {mounted && totalItemCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-black text-primary-foreground shadow-sm animate-in zoom-in-50 duration-150">
                {totalItemCount > 99 ? "99+" : totalItemCount}
              </span>
            )}
          </Link>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-background px-4 py-4 space-y-4 shadow-lg animate-in slide-in-from-top-2 duration-200">
          <form onSubmit={handleSearchSubmit} className="relative">
            <Input
              type="search"
              placeholder="Tìm kiếm sản phẩm..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-10 pr-10 text-sm"
            />
            <button
              type="submit"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            >
              <Search size={18} />
            </button>
          </form>

          <div className="flex flex-col gap-2.5 pt-2 text-sm font-medium">
            <Link
              href="/products"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1.5 text-foreground hover:text-primary"
            >
              Tất cả sản phẩm
            </Link>
            <Link
              href="/cart"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between py-1.5 text-foreground hover:text-primary"
            >
              <span className="flex items-center gap-2">
                <ShoppingBag size={16} />
                Giỏ hàng
              </span>
              {mounted && totalItemCount > 0 && (
                <Badge variant="default" className="text-[10px] px-2 py-0.5">
                  {totalItemCount} món
                </Badge>
              )}
            </Link>

            <div className="border-t border-border pt-2">
              <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-1">
                Danh mục nổi bật
              </p>
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/products?category=${cat.slug}`}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block py-1.5 text-foreground/80 hover:text-primary pl-2"
                >
                  {cat.name}
                </Link>
              ))}
            </div>

            <Link
              href="/outfits"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 py-2 text-primary-foreground font-semibold bg-primary/20 px-3 rounded-lg mt-2"
            >
              <Layers size={16} />
              Combo thời trang ưu đãi
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
