import React from "react";
import Link from "next/link";
import { ArrowLeft, Home, ShoppingBag, Sparkles } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 py-16 text-center antialiased">
      <div className="relative mb-6">
        <div className="h-28 w-28 rounded-3xl bg-primary/10 flex items-center justify-center text-primary mx-auto border border-primary/20 shadow-inner">
          <Sparkles className="h-14 w-14" />
        </div>
        <span className="absolute -bottom-2 -right-2 bg-foreground text-background text-xs font-black px-2.5 py-1 rounded-full border border-border">
          404
        </span>
      </div>

      <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-foreground mb-3">
        Không tìm thấy trang yêu cầu
      </h1>
      <p className="text-sm text-muted-foreground max-w-md mx-auto mb-8 leading-relaxed">
        Đường dẫn bạn vừa truy cập có thể đã thay đổi, bị xóa hoặc không tồn tại trong hệ thống thời trang TrendyFit.
      </p>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/"
          className={cn(buttonVariants({ size: "default" }), "font-bold gap-2 rounded-xl shadow-sm h-11 px-6")}
        >
          <Home size={16} />
          Về trang chủ
        </Link>
        <Link
          href="/products"
          className={cn(buttonVariants({ variant: "outline", size: "default" }), "font-semibold gap-2 rounded-xl h-11 px-6")}
        >
          <ShoppingBag size={16} />
          Xem tất cả sản phẩm
        </Link>
      </div>
    </div>
  );
}
