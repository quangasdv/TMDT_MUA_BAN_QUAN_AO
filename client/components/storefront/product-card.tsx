"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Product } from "@/api/products.api";
import { formatPrice } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Sparkles } from "lucide-react";

interface ProductCardProps {
  product: Product;
  priority?: boolean;
}

export function ProductCard({ product }: ProductCardProps) {
  const [imageError, setImageError] = useState(false);

  // Lấy ảnh hiển thị chính: ưu tiên mảng images, sau đó biến thể đầu tiên có imageUrl
  const variantImages = product.variants?.map((v) => v.imageUrl).filter(Boolean) || [];
  const primaryImage =
    product.images && product.images.length > 0
      ? product.images[0]
      : variantImages[0] || "/placeholder-fashion.jpg";

  // Tính tổng tồn kho khả dụng từ các biến thể
  const totalStock =
    product.variants?.reduce((sum, v) => sum + (v.stockQuantity || 0), 0) ?? 0;
  const isOutOfStock = product.variants && product.variants.length > 0 && totalStock <= 0;

  // Lấy danh sách màu độc nhất để hiển thị tag
  const uniqueColors = Array.from(
    new Set(product.variants?.map((v) => v.color).filter(Boolean) || [])
  );

  return (
    <Link
      href={`/products/${product.slug}`}
      className="group flex flex-col h-full overflow-hidden rounded-xl border border-border/60 bg-card transition-all duration-300 hover:border-border hover:shadow-md"
    >
      {/* Vùng Ảnh Sản Phẩm */}
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-muted/30">
        {!imageError ? (
          <img
            src={primaryImage}
            alt={product.name}
            className="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
            onError={() => setImageError(true)}
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center bg-muted/40 p-4 text-center text-muted-foreground">
            <Sparkles className="h-8 w-8 mb-2 opacity-40" />
            <span className="text-xs font-medium">TrendyFit Fashion</span>
          </div>
        )}

        {/* Badges trên ảnh */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5 z-10">
          {product.category?.name && (
            <Badge
              variant="secondary"
              className="bg-background/85 backdrop-blur-md text-[11px] font-medium tracking-tight shadow-sm"
            >
              {product.category.name}
            </Badge>
          )}
          {isOutOfStock && (
            <Badge variant="destructive" className="text-[10px] font-semibold">
              Hết hàng
            </Badge>
          )}
        </div>
      </div>

      {/* Thông Tin Sản Phẩm */}
      <div className="flex flex-1 flex-col p-3.5 sm:p-4">
        {/* Tên sản phẩm */}
        <h3 className="line-clamp-2 text-sm sm:text-base font-semibold text-foreground group-hover:text-primary transition-colors">
          {product.name}
        </h3>

        {/* Biến thể màu sắc & kích cỡ nếu có */}
        <div className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
          {uniqueColors.length > 0 && (
            <span>{uniqueColors.length} màu</span>
          )}
          {uniqueColors.length > 0 && product.variants?.length > 0 && <span>·</span>}
          {product.variants?.length > 0 && (
            <span>
              {Array.from(new Set(product.variants.map((v) => v.size))).slice(0, 4).join(", ")}
            </span>
          )}
        </div>

        {/* Giá tiền */}
        <div className="mt-auto pt-3 flex items-baseline justify-between">
          <span className="text-base sm:text-lg font-bold tracking-tight text-foreground">
            {formatPrice(product.basePrice)}
          </span>
          <span className="text-[11px] font-medium text-muted-foreground group-hover:text-primary transition-colors underline-offset-4 group-hover:underline">
            Chi tiết &rarr;
          </span>
        </div>
      </div>
    </Link>
  );
}

