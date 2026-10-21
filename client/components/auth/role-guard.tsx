"use client";

import React, { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/stores/auth.store";
import { UserRole } from "@/api/auth.api";
import { Loader2, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  redirectTo?: string;
  fallback?: React.ReactNode;
}

/**
 * Component bảo vệ Route và Phân quyền (Role-Based Access Control)
 * Dùng để bọc các trang/khu vực yêu cầu đăng nhập hoặc vai trò đặc biệt (ADMIN, STAFF)
 */
export function RoleGuard({
  children,
  allowedRoles,
  redirectTo = "/login",
  fallback,
}: RoleGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, isLoading, isInitialized } = useAuthStore();

  useEffect(() => {
    if (isInitialized && !isLoading && !isAuthenticated) {
      const returnUrl = encodeURIComponent(pathname);
      router.push(`${redirectTo}?returnUrl=${returnUrl}`);
    }
  }, [isInitialized, isLoading, isAuthenticated, pathname, redirectTo, router]);

  // Đang khởi tạo hoặc nạp thông tin người dùng
  if (!isInitialized || isLoading) {
    if (fallback) return <>{fallback}</>;

    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "50vh",
          gap: "12px",
          color: "#71717a",
          fontSize: "14px",
        }}
      >
        <Loader2 className="animate-spin text-primary" size={32} />
        <p>Đang kiểm tra quyền truy cập...</p>
      </div>
    );
  }

  // Chưa đăng nhập
  if (!isAuthenticated) {
    return null;
  }

  // Kiểm tra vai trò (Role-Based Authorization)
  if (allowedRoles && allowedRoles.length > 0) {
    const userRole = user?.role;
    const hasPermission = userRole && allowedRoles.includes(userRole);

    if (!hasPermission) {
      return (
        <div
          style={{
            maxWidth: "520px",
            margin: "60px auto",
            padding: "32px",
            background: "#ffffff",
            border: "1px solid #fee2e2",
            borderRadius: "12px",
            boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.05)",
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "50%",
              background: "#fef2f2",
              color: "#dc2626",
              display: "grid",
              placeItems: "center",
              margin: "0 auto 16px",
            }}
          >
            <ShieldAlert size={28} />
          </div>
          <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#18181b", marginBottom: "8px" }}>
            403 - Quyền truy cập bị từ chối
          </h2>
          <p style={{ color: "#71717a", fontSize: "14px", lineHeight: "1.6", marginBottom: "20px" }}>
            Tài khoản của bạn ({user?.email} - vai trò: <strong>{userRole || "Chưa xác định"}</strong>) không có quyền truy cập vào khu vực này.
            <br />
            Khu vực này yêu cầu vai trò: <strong>{allowedRoles.join(" hoặc ")}</strong>.
          </p>
          <div style={{ display: "flex", justifyContent: "center", gap: "12px" }}>
            <Link href="/" style={{ textDecoration: "none" }}>
              <Button variant="outline">Về trang chủ</Button>
            </Link>
            <Link href="/login" style={{ textDecoration: "none" }}>
              <Button>Đổi tài khoản</Button>
            </Link>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
}
