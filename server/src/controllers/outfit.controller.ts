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

      const combos = outfits.map((outfit) => {
        let originalPrice = 0;
        const formattedItems = outfit.items.map((item) => {
          const unitPrice =
            Number(item.variant.product.basePrice) + Number(item.variant.priceAdjustment);
          originalPrice += unitPrice;
          return {
            id: item.id,
            slotType: item.slotType, // TOP (Áo) hoặc BOTTOM (Quần)
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

        const discountRate = outfit.discountRate || 0.15; // Mặc định giảm 15% khi mua cả combo
        const comboPrice = Math.round(originalPrice * (1 - discountRate));
        const savedAmount = originalPrice - comboPrice;

        return {
          id: outfit.id,
          title: outfit.title,
          description: outfit.description,
          bannerUrl: outfit.bannerUrl,
          discountRate,
          discountPercent: Math.round(discountRate * 100),
          originalPrice,
          comboPrice,
          savedAmount,
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

      let originalPrice = 0;
      const formattedItems = outfit.items.map((item) => {
        const unitPrice =
          Number(item.variant.product.basePrice) + Number(item.variant.priceAdjustment);
        originalPrice += unitPrice;
        return {
          id: item.id,
          slotType: item.slotType, // TOP hoặc BOTTOM
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

      const discountRate = outfit.discountRate || 0.15;
      const comboPrice = Math.round(originalPrice * (1 - discountRate));
      const savedAmount = originalPrice - comboPrice;

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
            originalPrice,
            comboPrice,
            savedAmount,
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
