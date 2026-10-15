import type { ReactNode } from "react";
import "./register/style/register.css";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return <main className="auth-shell">{children}</main>;
}
