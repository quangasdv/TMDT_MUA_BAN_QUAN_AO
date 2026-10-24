"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { RoleGuard } from "@/components/auth/role-guard";
import { useAuthStore } from "@/stores/auth.store";
import {
  LayoutDashboard,
  Package,
  Shirt,
  TicketPercent,
  Users,
  ExternalLink,
  LogOut,
  Menu,
  X,
  Shield,
  UserCheck,
} from "lucide-react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isAdmin = user?.role === "ADMIN";

  const navItems = [
    ...(isAdmin
      ? [
          {
            label: "Dashboard",
            href: "/admin",
            icon: LayoutDashboard,
            exact: true,
          },
        ]
      : []),
    {
      label: "Đơn hàng",
      href: "/admin/orders",
      icon: Package,
      exact: false,
    },
    ...(isAdmin
      ? [
          {
            label: "Sản phẩm",
            href: "/admin/products",
            icon: Shirt,
            exact: false,
          },
          {
            label: "Mã giảm giá",
            href: "/admin/vouchers",
            icon: TicketPercent,
            exact: false,
          },
          {
            label: "Tài khoản",
            href: "/admin/users",
            icon: Users,
            exact: false,
          },
        ]
      : []),
  ];

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  const isActive = (item: (typeof navItems)[0]) => {
    if (item.exact) {
      return pathname === item.href;
    }
    return pathname.startsWith(item.href);
  };

  return (
    <RoleGuard allowedRoles={["ADMIN", "STAFF"]}>
      <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row text-slate-900 font-sans antialiased">
        {/* Mobile Top Header */}
        <div className="lg:hidden flex items-center justify-between p-4 bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-black text-sm tracking-tight shadow-xs">
              TF
            </span>
            <div>
              <span className="font-black tracking-tight text-slate-900 text-base">
                Trendy<span className="text-primary-foreground bg-primary px-1 rounded ml-0.5">Fit</span>
              </span>
              <span className="ml-2 text-[10px] px-2 py-0.5 rounded-full font-bold bg-slate-100 text-slate-800 border border-slate-300">
                {user?.role}
              </span>
            </div>
          </div>
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-2 rounded-lg text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Sidebar */}
        <aside
          className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 flex flex-col justify-between transition-transform duration-200 lg:static lg:translate-x-0 ${
            mobileOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div>
            {/* Brand Logo & Portal Header */}
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-white">
              <Link href="/admin" className="flex items-center gap-3 group">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground font-black text-sm tracking-tight shadow-xs transition-transform group-hover:scale-105">
                  TF
                </span>
                <div>
                  <h1 className="font-black text-lg leading-tight tracking-tight text-slate-900">
                    Trendy<span className="text-primary-foreground bg-primary px-1 rounded ml-0.5">Fit</span>
                  </h1>
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mt-0.5">
                    {isAdmin ? "Admin Portal" : "Staff Operations"}
                  </p>
                </div>
              </Link>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  isAdmin
                    ? "bg-slate-900 text-white border-slate-900"
                    : "bg-amber-100 text-amber-900 border-amber-300"
                }`}
              >
                {user?.role}
              </span>
            </div>

            {/* Navigation links */}
            <div className="p-3">
              <div className="px-3.5 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Menu Quản lý
              </div>
              <nav className="space-y-1">
                {navItems.map((item) => {
                  const active = isActive(item);
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                        active
                          ? "bg-slate-900 text-white shadow-sm"
                          : "text-slate-700 hover:text-slate-900 hover:bg-slate-100/80"
                      }`}
                    >
                      <Icon
                        size={18}
                        className={active ? "text-primary shrink-0" : "text-slate-500 shrink-0"}
                      />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Footer User Profile & Quick Actions */}
          <div className="p-3 border-t border-slate-200 space-y-2 bg-white">
            <Link
              href="/"
              target="_blank"
              className="flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition border border-transparent hover:border-slate-200"
            >
              <span className="flex items-center gap-2">
                <ExternalLink size={14} className="text-slate-500" />
                Vào trang bán hàng
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/20 text-primary-foreground font-bold">
                Storefront
              </span>
            </Link>

            <div className="pt-2 border-t border-slate-200">
              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <div className="w-8 h-8 rounded-full bg-slate-900 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                    {isAdmin ? <Shield size={14} /> : <UserCheck size={14} />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold truncate text-slate-900">
                      {user?.fullName || "Quản trị viên"}
                    </p>
                    <p className="text-[11px] font-medium truncate text-slate-600">
                      {user?.email}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  title="Đăng xuất"
                  className="p-1.5 text-slate-500 hover:text-rose-600 rounded-lg hover:bg-white transition shrink-0"
                >
                  <LogOut size={16} />
                </button>
              </div>
            </div>
          </div>
        </aside>

        {/* Mobile backdrop */}
        {mobileOpen && (
          <div
            className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-md lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 bg-slate-50">
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
            {children}
          </main>
        </div>
      </div>
    </RoleGuard>
  );
}
