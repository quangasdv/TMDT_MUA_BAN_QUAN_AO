import { Request, Response, NextFunction } from "express";
import prisma from "../config/db";

export class OutfitController {
  /**
   * Lấy danh sách các Lookbook Outfit mẫu
   */
  static async getOutfits(req: Request, res: Response, next: NextFunction): Promise<void> {
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

      res.status(200).json({
        success: true,
        data: { outfits },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Lấy danh sách sản phẩm phân loại theo 4 tầng phối đồ (Slots) phục vụ Interactive Outfit Builder:
   * Slot: TOP (Áo), BOTTOM (Quần/Váy), OUTERWEAR (Áo khoác), SHOES (Giày)
   */
  static async getOutfitSlots(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Lấy danh mục và sản phẩm tương ứng với từng slot
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
      };

      for (const cat of categories) {
        const slug = cat.slug.toLowerCase();
        let targetSlot = "TOP";

        if (slug.includes("quan") || slug.includes("pant") || slug.includes("bottom") || slug.includes("jean")) {
          targetSlot = "BOTTOM";
        } else if (slug.includes("khoac") || slug.includes("jacket") || slug.includes("outerwear") || slug.includes("hoodie")) {
          targetSlot = "OUTERWEAR";
        } else if (slug.includes("giay") || slug.includes("shoe") || slug.includes("sneaker")) {
          targetSlot = "SHOES";
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
