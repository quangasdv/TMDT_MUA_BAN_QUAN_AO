import { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import prisma from "../config/db";
import { ENV } from "../config/env";
import { AuthRequest } from "../middleware/auth.middleware";

const registerSchema = z.object({
  email: z.string().email("Email không đúng định dạng"),
  password: z.string().min(6, "Mật khẩu phải có ít nhất 6 ký tự"),
  fullName: z.string().min(2, "Họ và tên tối thiểu 2 ký tự"),
  phone: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email("Email không đúng định dạng"),
  password: z.string().min(1, "Vui lòng nhập mật khẩu"),
  guestSessionId: z.string().optional(),
});

export class AuthController {
  static async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = registerSchema.parse(req.body);

      const existingUser = await prisma.user.findUnique({
        where: { email: data.email },
      });

      if (existingUser) {
        res.status(400).json({
          success: false,
          message: "Email này đã được sử dụng. Vui lòng chọn email khác.",
        });
        return;
      }

      const passwordHash = await bcrypt.hash(data.password, 10);

      const user = await prisma.user.create({
        data: {
          email: data.email,
          passwordHash,
          fullName: data.fullName,
          phone: data.phone || null,
        },
        select: {
          id: true,
          email: true,
          fullName: true,
          phone: true,
          role: true,
          createdAt: true,
        },
      });

      res.status(201).json({
        success: true,
        message: "Đăng ký tài khoản thành công!",
        data: { user },
      });
    } catch (error) {
      next(error);
    }
  }

  static async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = loginSchema.parse(req.body);

      const user = await prisma.user.findUnique({
        where: { email: data.email },
      });

      if (!user) {
        res.status(401).json({
          success: false,
          message: "Email hoặc mật khẩu không chính xác.",
        });
        return;
      }

      const isPasswordValid = await bcrypt.compare(data.password, user.passwordHash);
      if (!isPasswordValid) {
        res.status(401).json({
          success: false,
          message: "Email hoặc mật khẩu không chính xác.",
        });
        return;
      }

      // Xử lý gộp giỏ hàng khách vãng lai (guestSessionId) vào giỏ hàng user nếu có
      if (data.guestSessionId) {
        const guestCart = await prisma.cart.findUnique({
          where: { sessionId: data.guestSessionId },
          include: { items: true },
        });

        if (guestCart && guestCart.items.length > 0) {
          const userCart = await prisma.cart.upsert({
            where: { userId: user.id },
            create: { userId: user.id },
            update: {},
            include: { items: true },
          });

          for (const gItem of guestCart.items) {
            const existingItem = userCart.items.find((i) => i.variantId === gItem.variantId);
            if (existingItem) {
              await prisma.cartItem.update({
                where: { id: existingItem.id },
                data: { quantity: existingItem.quantity + gItem.quantity },
              });
            } else {
              await prisma.cartItem.create({
                data: {
                  cartId: userCart.id,
                  variantId: gItem.variantId,
                  quantity: gItem.quantity,
                },
              });
            }
          }

          // Xóa giỏ hàng guest sau khi đã gộp thành công
          await prisma.cartItem.deleteMany({ where: { cartId: guestCart.id } });
          await prisma.cart.delete({ where: { id: guestCart.id } });
        }
      }

      // Tạo Access Token và Refresh Token
      const accessToken = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        ENV.JWT_ACCESS_SECRET,
        { expiresIn: "15m" }
      );

      const refreshToken = jwt.sign(
        { id: user.id },
        ENV.JWT_REFRESH_SECRET,
        { expiresIn: "7d" }
      );

      // Lưu Refresh Token vào HttpOnly Cookie
      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: ENV.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.status(200).json({
        success: true,
        message: "Đăng nhập thành công!",
        data: {
          user: {
            id: user.id,
            email: user.email,
            fullName: user.fullName,
            role: user.role,
          },
          accessToken,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const refreshToken = req.cookies?.refreshToken;
      if (!refreshToken) {
        res.status(401).json({
          success: false,
          message: "Không tìm thấy refresh token trong cookie.",
        });
        return;
      }

      const decoded = jwt.verify(refreshToken, ENV.JWT_REFRESH_SECRET) as { id: string };
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
      });

      if (!user) {
        res.status(401).json({
          success: false,
          message: "Tài khoản không tồn tại hoặc đã bị khóa.",
        });
        return;
      }

      const newAccessToken = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        ENV.JWT_ACCESS_SECRET,
        { expiresIn: "15m" }
      );

      res.status(200).json({
        success: true,
        message: "Làm mới phiên đăng nhập thành công.",
        data: { accessToken: newAccessToken },
      });
    } catch (error) {
      res.status(401).json({
        success: false,
        message: "Refresh token không hợp lệ hoặc đã hết hạn.",
      });
    }
  }

  static async logout(req: Request, res: Response): Promise<void> {
    res.clearCookie("refreshToken");
    res.status(200).json({
      success: true,
      message: "Đăng xuất thành công.",
    });
  }

  static async me(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: "Chưa xác thực." });
        return;
      }

      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: {
          id: true,
          email: true,
          fullName: true,
          phone: true,
          role: true,
          createdAt: true,
        },
      });

      res.status(200).json({
        success: true,
        data: { user },
      });
    } catch (error) {
      next(error);
    }
  }
}
