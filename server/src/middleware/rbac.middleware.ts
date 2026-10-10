import { Response, NextFunction } from "express";
import { AuthRequest } from "./auth.middleware";
import { Role } from "@prisma/client";

export const requireRoles = (allowedRoles: Role[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Yêu cầu đăng nhập trước khi thực hiện hành động này.",
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: `Từ chối truy cập. Chức năng này yêu cầu quyền: ${allowedRoles.join(" hoặc ")}.`,
      });
      return;
    }

    next();
  };
};
