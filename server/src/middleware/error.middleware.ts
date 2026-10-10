import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.error("[Lỗi hệ thống]:", err);

  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      message: "Dữ liệu gửi lên không đúng định dạng kiểm tra.",
      errors: err.errors.map((e) => ({
        field: e.path.join("."),
        message: e.message,
      })),
    });
    return;
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || "Đã xảy ra lỗi nội bộ máy chủ.";

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};
