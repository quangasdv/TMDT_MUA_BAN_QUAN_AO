import { Request, Response, NextFunction } from "express";
import prisma from "../config/db";

export class ProductController {
  /**
   * 1. GET /api/products
   * Lấy danh sách sản phẩm chung (Hỗ trợ cả tìm kiếm và lọc kết hợp)
   */
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

  /**
   * 2. GET /api/products/search và GET /api/search
   * Endpoint chuyên biệt cho TÌM KIẾM THEO TỪ KHÓA (Keyword Search)
   * Query params:
   *  - q: Từ khóa tìm kiếm (bắt buộc hoặc tùy chọn)
   *  - page: Số trang (mặc định 1)
   *  - limit: Số lượng sản phẩm mỗi trang (mặc định 12)
   */
  static async searchProducts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { q, page = "1", limit = "12" } = req.query;
      const keyword = (typeof q === "string" ? q : "").trim();

      const pageNum = parseInt(page as string, 10) || 1;
      const limitNum = parseInt(limit as string, 10) || 12;
      const skip = (pageNum - 1) * limitNum;

      const where: any = { isActive: true };

      if (keyword) {
        where.OR = [
          { name: { contains: keyword, mode: "insensitive" } },
          { description: { contains: keyword, mode: "insensitive" } },
          { category: { name: { contains: keyword, mode: "insensitive" } } },
        ];
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
          keyword,
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

  /**
   * 3. GET /api/products/filter và GET /api/filter
   * Endpoint chuyên biệt cho BỘ LỌC TỔNG HỢP (Filter Endpoint)
   * Query params hỗ trợ:
   *  - category: Slug danh mục (ví dụ: 'ao-thun', 'quan-jean', 'ao-khoac')
   *  - categoryId: ID danh mục
   *  - minPrice: Giá tối thiểu
   *  - maxPrice: Giá tối đa
   *  - color: Màu sắc (ví dụ 'Đen' hoặc nhiều màu 'Đen,Trắng')
   *  - size: Kích cỡ (ví dụ 'M' hoặc nhiều size 'S,M,L,41')
   *  - inStock: 'true' -> Chỉ lấy sản phẩm còn hàng trong kho
   *  - sortBy: 'price_asc' | 'price_desc' | 'name_asc' | 'newest' (mặc định)
   *  - page: Số trang
   *  - limit: Số lượng sản phẩm
   */
  static async filterProducts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const {
        category,
        categoryId,
        minPrice,
        maxPrice,
        color,
        size,
        inStock,
        sortBy = "newest",
        page = "1",
        limit = "12",
      } = req.query;

      const pageNum = parseInt(page as string, 10) || 1;
      const limitNum = parseInt(limit as string, 10) || 12;
      const skip = (pageNum - 1) * limitNum;

      const where: any = { isActive: true };

      // 1. Lọc theo danh mục (slug hoặc id)
      if (category) {
        where.category = { slug: category as string };
      } else if (categoryId) {
        where.categoryId = categoryId as string;
      }

      // 2. Lọc theo khoảng giá
      if (minPrice || maxPrice) {
        where.basePrice = {};
        if (minPrice) where.basePrice.gte = parseFloat(minPrice as string);
        if (maxPrice) where.basePrice.lte = parseFloat(maxPrice as string);
      }

      // 3. Lọc theo biến thể (Màu sắc, Size, Tình trạng còn hàng)
      const variantConditions: any[] = [];

      if (color) {
        const colorList = (color as string)
          .split(",")
          .map((c) => c.trim())
          .filter(Boolean);
        if (colorList.length > 0) {
          variantConditions.push({
            color: { in: colorList, mode: "insensitive" },
          });
        }
      }

      if (size) {
        const sizeList = (size as string)
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
        if (sizeList.length > 0) {
          variantConditions.push({
            size: { in: sizeList, mode: "insensitive" },
          });
        }
      }

      if (inStock === "true" || inStock === "1") {
        variantConditions.push({
          stockQuantity: { gt: 0 },
        });
      }

      if (variantConditions.length > 0) {
        where.variants = {
          some: {
            AND: variantConditions,
          },
        };
      }

      // 4. Sắp xếp kết quả (Sort By)
      let orderBy: any = { createdAt: "desc" };
      if (sortBy === "price_asc") {
        orderBy = { basePrice: "asc" };
      } else if (sortBy === "price_desc") {
        orderBy = { basePrice: "desc" };
      } else if (sortBy === "name_asc") {
        orderBy = { name: "asc" };
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
          orderBy,
        }),
        prisma.product.count({ where }),
      ]);

      res.status(200).json({
        success: true,
        data: {
          filtersApplied: {
            category: category || categoryId || null,
            minPrice: minPrice ? parseFloat(minPrice as string) : null,
            maxPrice: maxPrice ? parseFloat(maxPrice as string) : null,
            color: color || null,
            size: size || null,
            inStock: inStock === "true" || inStock === "1",
            sortBy,
          },
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

  /**
   * 4. GET /api/products/:slug
   * Chi tiết sản phẩm theo Slug
   */
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

      if (!product || !product.isActive) {
        res.status(404).json({
          success: false,
          errorCode: "PRODUCT_NOT_FOUND",
          message: "Không tìm thấy sản phẩm yêu cầu hoặc sản phẩm đã ngừng kinh doanh.",
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

  /**
   * 5. GET /api/categories
   * Lấy danh sách danh mục
   */
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
