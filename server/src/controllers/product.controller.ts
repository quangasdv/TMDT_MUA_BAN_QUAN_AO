import { Request, Response, NextFunction } from "express";
import prisma from "../config/db";

export class ProductController {
  static async getProducts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const {
        q,
        category,
        minPrice,
        maxPrice,
        color,
        size,
        page = "1",
        limit = "12",
      } = req.query;

      const pageNum = parseInt(page as string, 10) || 1;
      const limitNum = parseInt(limit as string, 10) || 12;
      const skip = (pageNum - 1) * limitNum;

      const where: any = { isActive: true };

      if (q) {
        where.OR = [
          { name: { contains: q as string, mode: "insensitive" } },
          { description: { contains: q as string, mode: "insensitive" } },
        ];
      }

      if (category) {
        where.category = { slug: category as string };
      }

      if (minPrice || maxPrice) {
        where.basePrice = {};
        if (minPrice) where.basePrice.gte = parseFloat(minPrice as string);
        if (maxPrice) where.basePrice.lte = parseFloat(maxPrice as string);
      }

      if (color || size) {
        where.variants = {
          some: {
            ...(color && { color: { equals: color as string, mode: "insensitive" } }),
            ...(size && { size: { equals: size as string, mode: "insensitive" } }),
          },
        };
      }

      const [products, total] = await Promise.all([
        prisma.product.findMany({
          where,
          include: {
            category: { select: { id: true, name: true, slug: true } },
            variants: true,
          },
          skip,
          take: limitNum,
          orderBy: { createdAt: "desc" },
        }),
        prisma.product.count({ where }),
      ]);

      res.status(200).json({
        success: true,
        data: {
          products,
          pagination: {
            page: pageNum,
            limit: limitNum,
            total,
            totalPages: Math.ceil(total / limitNum),
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async getProductBySlug(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { slug } = req.params;

      const product = await prisma.product.findUnique({
        where: { slug },
        include: {
          category: true,
          variants: true,
          sizeCharts: true,
        },
      });

      if (!product) {
        res.status(404).json({
          success: false,
          message: "Không tìm thấy sản phẩm yêu cầu.",
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: { product },
      });
    } catch (error) {
      next(error);
    }
  }

  static async getCategories(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const categories = await prisma.category.findMany({
        where: { parentId: null },
        include: { children: true },
      });

      res.status(200).json({
        success: true,
        data: { categories },
      });
    } catch (error) {
      next(error);
    }
  }
}
