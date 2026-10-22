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
  ExternalLink,
  LogOut,
  Menu,
  X,
  Sparkles,
  Shield,
  UserCheck,
} from "lucide-react";
import "./style/admin.css";

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
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col lg:flex-row text-slate-800 dark:text-slate-100 font-sans">
        {/* Mobile Header */}
        <div className="lg:hidden flex items-center justify-between p-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
              TF
            </div>
            <div>
              <span className="font-bold tracking-tight text-slate-900 dark:text-white">
                TrendyFit
              </span>
              <span className="ml-1.5 text-xs px-2 py-0.5 rounded-full font-medium bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                {user?.role}
              </span>
            </div>
          </div>
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-2 rounded-lg text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Sidebar */}
        <aside
          className={`fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between transition-transform duration-200 lg:static lg:translate-x-0 ${
            mobileOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div>
            {/* Brand Logo & Portal Header */}
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-white flex items-center justify-center font-bold shadow-md shadow-indigo-500/20">
                  <Sparkles size={18} />
                </div>
                <div>
                  <h1 className="font-bold text-base leading-tight tracking-tight text-slate-900 dark:text-white">
                    TrendyFit
                  </h1>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {isAdmin ? "Admin Portal" : "Staff Operations"}
                  </p>
                </div>
              </div>
              <span
                className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                  isAdmin
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800"
                    : "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800"
                }`}
              >
                {user?.role}
              </span>
            </div>

            {/* Navigation links */}
            <div className="p-3">
              <div className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
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
                      className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                        active
                          ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/30"
                          : "text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800/60"
                      }`}
                    >
                      <Icon size={18} className={active ? "text-white" : "text-slate-500 dark:text-slate-400"} />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Footer User Profile & Quick Actions */}
          <div className="p-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
            <Link
              href="/"
              target="_blank"
              className="flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800 transition"
            >
              <span className="flex items-center gap-2">
                <ExternalLink size={14} className="text-slate-400" />
                Vào trang bán hàng
              </span>
              <span className="text-[10px] text-slate-400">Storefront</span>
            </Link>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/80">
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-bold text-xs shrink-0">
                    {isAdmin ? <Shield size={14} /> : <UserCheck size={14} />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold truncate text-slate-800 dark:text-slate-200">
                      {user?.fullName || "Quản trị viên"}
                    </p>
                    <p className="text-[11px] truncate text-slate-500 dark:text-slate-400">
                      {user?.email}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  title="Đăng xuất"
                  className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-white dark:hover:bg-slate-700 transition shrink-0"
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
            className="fixed inset-0 z-40 bg-slate-900/25 dark:bg-black/40 backdrop-blur-md lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
            {children}
          </main>
        </div>
      </div>
    </RoleGuard>
  );
}
