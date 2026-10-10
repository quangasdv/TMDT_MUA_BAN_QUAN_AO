import { Response, NextFunction } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import prisma from "../config/db";

export class CartController {
  private static async getOrCreateCart(req: AuthRequest) {
    const userId = req.user?.id;
    const sessionId = (req.headers["x-session-id"] as string) || (req.query.sessionId as string);

    if (userId) {
      return prisma.cart.upsert({
        where: { userId },
        create: { userId },
        update: {},
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
    }

    if (sessionId) {
      return prisma.cart.upsert({
        where: { sessionId },
        create: { sessionId },
        update: {},
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
    }

    return null;
  }

  static async getCart(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const cart = await CartController.getOrCreateCart(req);
      if (!cart) {
        res.status(200).json({ success: true, data: { cart: { items: [] } } });
        return;
      }

      res.status(200).json({ success: true, data: { cart } });
    } catch (error) {
      next(error);
    }
  }

  static async addItem(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { variantId, quantity = 1 } = req.body;

      if (!variantId || typeof variantId !== "string") {
        res.status(400).json({
          success: false,
          message: "Mã biến thể sản phẩm (variantId) là bắt buộc.",
        });
        return;
      }

      if (typeof quantity !== "number" || !Number.isInteger(quantity) || quantity <= 0) {
        res.status(400).json({
          success: false,
          message: "Số lượng sản phẩm thêm vào giỏ phải là số nguyên dương (tối thiểu là 1).",
        });
        return;
      }

      let cart = await CartController.getOrCreateCart(req);

      if (!cart) {
        res.status(400).json({
          success: false,
          message: "Cần cung cấp tài khoản đăng nhập hoặc mã phiên khách (x-session-id).",
        });
        return;
      }

      const existingItem = await prisma.cartItem.findFirst({
        where: { cartId: cart.id, variantId },
      });

      if (existingItem) {
        await prisma.cartItem.update({
          where: { id: existingItem.id },
          data: { quantity: existingItem.quantity + quantity },
        });
      } else {
        await prisma.cartItem.create({
          data: {
            cartId: cart.id,
            variantId,
            quantity,
          },
        });
      }

      const updatedCart = await CartController.getOrCreateCart(req);
      res.status(200).json({
        success: true,
        message: "Đã thêm sản phẩm vào giỏ hàng.",
        data: { cart: updatedCart },
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateItemQuantity(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { quantity } = req.body;

      if (typeof quantity !== "number" || !Number.isInteger(quantity) || quantity < 0) {
        res.status(400).json({ success: false, message: "Số lượng cập nhật phải là số nguyên không âm." });
        return;
      }

      const cart = await CartController.getOrCreateCart(req);
      if (!cart) {
        res.status(401).json({
          success: false,
          message: "Cần cung cấp phiên đăng nhập hoặc mã định danh khách vãng lai (x-session-id).",
        });
        return;
      }

      // CHỐNG IDOR: Kiểm tra món đồ này bắt buộc phải nằm trong giỏ hàng của người gọi
      const cartItem = await prisma.cartItem.findUnique({ where: { id } });
      if (!cartItem || cartItem.cartId !== cart.id) {
        res.status(404).json({
          success: false,
          message: "Không tìm thấy món hàng này trong giỏ hàng của bạn.",
        });
        return;
      }

      if (quantity === 0) {
        await prisma.cartItem.delete({ where: { id } });
      } else {
        await prisma.cartItem.update({
          where: { id },
          data: { quantity },
        });
      }

      const updatedCart = await CartController.getOrCreateCart(req);
      res.status(200).json({
        success: true,
        message: "Đã cập nhật số lượng món trong giỏ hàng.",
        data: { cart: updatedCart },
      });
    } catch (error) {
      next(error);
    }
  }

  static async removeItem(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      const cart = await CartController.getOrCreateCart(req);
      if (!cart) {
        res.status(401).json({
          success: false,
          message: "Cần cung cấp phiên đăng nhập hoặc mã định danh khách vãng lai (x-session-id).",
        });
        return;
      }

      // CHỐNG IDOR: Kiểm tra món đồ này bắt buộc phải nằm trong giỏ hàng của người gọi
      const cartItem = await prisma.cartItem.findUnique({ where: { id } });
      if (!cartItem || cartItem.cartId !== cart.id) {
        res.status(404).json({
          success: false,
          message: "Không tìm thấy món hàng này trong giỏ hàng của bạn.",
        });
        return;
      }

      await prisma.cartItem.delete({ where: { id } });

      const updatedCart = await CartController.getOrCreateCart(req);
      res.status(200).json({
        success: true,
        message: "Đã xóa sản phẩm khỏi giỏ hàng.",
        data: { cart: updatedCart },
      });
    } catch (error) {
      next(error);
    }
  }
}
