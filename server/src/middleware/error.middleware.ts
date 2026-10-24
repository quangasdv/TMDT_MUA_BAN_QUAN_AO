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
      errorCode: "VALIDATION_ERROR",
      message: "Dữ liệu gửi lên không đúng định dạng kiểm tra.",
      errors: err.errors.map((e) => ({
        field: e.path.join("."),
        message: e.message,
      })),
    });
    return;
  }

  // Bắt lỗi upload file Multer
  if (
    err.name === "MulterError" ||
    err.message?.includes("Chỉ chấp nhận các file ảnh")
  ) {
    res.status(400).json({
      success: false,
      errorCode: "INVALID_FILE_UPLOAD",
      message:
        err.code === "LIMIT_FILE_SIZE"
          ? "Kích thước file ảnh vượt quá giới hạn tối đa 5MB."
          : err.message,
    });
    return;
  }

  const statusCode = err.statusCode || 500;
  const errorCode =
    err.errorCode ||
    (statusCode === 429
      ? "RATE_LIMIT_EXCEEDED"
      : statusCode === 409
      ? "INSUFFICIENT_STOCK"
      : statusCode >= 500
      ? "INTERNAL_SERVER_ERROR"
      : "BAD_REQUEST");
  const message = err.message || "Đã xảy ra lỗi nội bộ máy chủ.";

  res.status(statusCode).json({
    success: false,
    errorCode,
    message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};
