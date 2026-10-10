import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { ENV } from "../config/env";
import { Role } from "@prisma/client";

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: Role;
}

export interface AuthRequest extends Request {
  user?: AuthenticatedUser;
}

export const authenticateJwt = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.split(" ")[1]
    : req.cookies?.accessToken;

  if (!token) {
    res.status(401).json({
      success: false,
      message: "Bạn chưa đăng nhập hoặc phiên làm việc đã kết thúc.",
    });
    return;
  }

  try {
    const decoded = jwt.verify(token, ENV.JWT_ACCESS_SECRET) as AuthenticatedUser;
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: "Mã xác thực không hợp lệ hoặc đã hết hạn.",
    });
  }
};

export const optionalJwt = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.split(" ")[1]
    : req.cookies?.accessToken;

  if (token) {
    try {
      const decoded = jwt.verify(token, ENV.JWT_ACCESS_SECRET) as AuthenticatedUser;
      req.user = decoded;
    } catch {
      // Bỏ qua nếu token không hợp lệ đối với các route tùy chọn đăng nhập
    }
  }
  next();
};
