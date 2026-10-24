import { Request, Response, NextFunction } from "express";
import prisma from "../config/db";

export class OutfitController {
  /**
   * 1. Lấy danh sách các Combo / Set thời trang ưu đãi (Áo + Quần)
   * GET /api/combos hoặc GET /api/outfits
   */
  static async getCombos(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const outfits = await prisma.outfit.findMany({
        where: { isActive: true },
        include: {
          items: {
            include: {
              variant: {
                include: { product: true },
              },
            },
          },
        },
      });

      const CLOTHING_SLOTS = ["TOP", "BOTTOM", "OUTERWEAR"];

      const combos = outfits.map((outfit) => {
        let clothingOriginalPrice = 0;
        let totalOriginalPrice = 0;

        const formattedItems = outfit.items.map((item) => {
          const unitPrice =
            Number(item.variant.product.basePrice) + Number(item.variant.priceAdjustment);
          totalOriginalPrice += unitPrice;
          if (CLOTHING_SLOTS.includes(item.slotType)) {
            clothingOriginalPrice += unitPrice;
          }

          return {
            id: item.id,
            slotType: item.slotType, // TOP (Áo), BOTTOM (Quần), OUTERWEAR (Áo khoác), SHOES (Giày), ACCESSORY (Phụ kiện)
            productId: item.variant.productId,
            productName: item.variant.product.name,
            productSlug: item.variant.product.slug,
            variantId: item.variant.id,
            sku: item.variant.sku,
            color: item.variant.color,
            size: item.variant.size,
            imageUrl:
              item.variant.imageUrl || "",
            price: unitPrice,
            stockQuantity: item.variant.stockQuantity,
          };
        });

        // Quy tắc Combo: Giá gói cố định chỉ áp dụng cho nhóm Quần Áo (TOP, BOTTOM, OUTERWEAR).
        // Giày dép và phụ kiện là tùy chọn phối kèm bán riêng, không tính vào giá gói combo.
        const baseComboOriginalPrice =
          clothingOriginalPrice > 0 ? clothingOriginalPrice : totalOriginalPrice;
        const discountRate = outfit.discountRate || 0.15; // Mặc định giảm 15% khi mua cả combo
        const comboPrice = Math.round(baseComboOriginalPrice * (1 - discountRate));
        const savedAmount = baseComboOriginalPrice - comboPrice;

        return {
          id: outfit.id,
          title: outfit.title,
          description: outfit.description,
          bannerUrl: outfit.bannerUrl,
          discountRate,
          discountPercent: Math.round(discountRate * 100),
          originalPrice: baseComboOriginalPrice,
          comboPrice,
          savedAmount,
          clothingOriginalPrice,
          totalOriginalPrice,
          items: formattedItems,
        };
      });

      res.status(200).json({
        success: true,
        data: {
          combos,
          // Giữ alias outfits để tương thích ngược cho phía Frontend
          outfits: combos,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  // Alias tương thích ngược cho getCombos
  static getOutfits = OutfitController.getCombos;

  /**
   * 2. Lấy chi tiết 1 Combo / Set thời trang theo ID
   * GET /api/combos/:id hoặc GET /api/outfits/:id
   */
  static async getComboById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const outfit = await prisma.outfit.findUnique({
        where: { id },
        include: {
          items: {
            include: {
              variant: {
                include: {
                  product: {
                    include: { variants: true },
                  },
                },
              },
            },
          },
        },
      });

      if (!outfit) {
        res.status(404).json({
          success: false,
          message: "Không tìm thấy Combo / Set thời trang yêu cầu.",
        });
        return;
      }

      const CLOTHING_SLOTS = ["TOP", "BOTTOM", "OUTERWEAR"];
      let clothingOriginalPrice = 0;
      let totalOriginalPrice = 0;

      const formattedItems = outfit.items.map((item) => {
        const unitPrice =
          Number(item.variant.product.basePrice) + Number(item.variant.priceAdjustment);
        totalOriginalPrice += unitPrice;
        if (CLOTHING_SLOTS.includes(item.slotType)) {
          clothingOriginalPrice += unitPrice;
        }

        return {
          id: item.id,
          slotType: item.slotType, // TOP, BOTTOM, OUTERWEAR, SHOES, ACCESSORY
          product: {
            id: item.variant.product.id,
            name: item.variant.product.name,
            slug: item.variant.product.slug,
            description: item.variant.product.description,
            basePrice: Number(item.variant.product.basePrice),
            allVariants: item.variant.product.variants,
          },
          defaultVariant: {
            id: item.variant.id,
            sku: item.variant.sku,
            color: item.variant.color,
            size: item.variant.size,
            imageUrl: item.variant.imageUrl,
            price: unitPrice,
            stockQuantity: item.variant.stockQuantity,
          },
        };
      });

      const baseComboOriginalPrice =
        clothingOriginalPrice > 0 ? clothingOriginalPrice : totalOriginalPrice;
      const discountRate = outfit.discountRate || 0.15;
      const comboPrice = Math.round(baseComboOriginalPrice * (1 - discountRate));
      const savedAmount = baseComboOriginalPrice - comboPrice;

      res.status(200).json({
        success: true,
        data: {
          combo: {
            id: outfit.id,
            title: outfit.title,
            description: outfit.description,
            bannerUrl: outfit.bannerUrl,
            discountRate,
            discountPercent: Math.round(discountRate * 100),
            originalPrice: baseComboOriginalPrice,
            comboPrice,
            savedAmount,
            clothingOriginalPrice,
            totalOriginalPrice,
            items: formattedItems,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 3. Lấy danh sách sản phẩm phân loại theo slots (TOP, BOTTOM, OUTERWEAR, SHOES)
   * GET /api/outfits/slots
   */
  static async getOutfitSlots(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const categories = await prisma.category.findMany({
        include: {
          products: {
            where: { isActive: true },
            include: { variants: true },
          },
        },
      });

      const slots: Record<string, any[]> = {
        TOP: [],
        BOTTOM: [],
        OUTERWEAR: [],
        SHOES: [],
        ACCESSORY: [],
      };

      for (const cat of categories) {
        const slug = cat.slug.toLowerCase();
        let targetSlot = "TOP";

        if (
          slug.includes("quan") ||
          slug.includes("pant") ||
          slug.includes("bottom") ||
          slug.includes("jean")
        ) {
          targetSlot = "BOTTOM";
        } else if (
          slug.includes("khoac") ||
          slug.includes("jacket") ||
          slug.includes("outerwear") ||
          slug.includes("blazer") ||
          slug.includes("hoodie")
        ) {
          targetSlot = "OUTERWEAR";
        } else if (slug.includes("giay") || slug.includes("shoe") || slug.includes("sneaker")) {
          targetSlot = "SHOES";
        } else if (
          slug.includes("phu-kien") ||
          slug.includes("accessory") ||
          slug.includes("non") ||
          slug.includes("mu") ||
          slug.includes("kinh") ||
          slug.includes("tui")
        ) {
          targetSlot = "ACCESSORY";
        }

        for (const prod of cat.products) {
          slots[targetSlot].push({
            id: prod.id,
            name: prod.name,
            basePrice: prod.basePrice,
            slug: prod.slug,
            variants: prod.variants,
          });
        }
      }

      res.status(200).json({
        success: true,
        data: { slots },
      });
    } catch (error) {
      next(error);
    }
  }
}
