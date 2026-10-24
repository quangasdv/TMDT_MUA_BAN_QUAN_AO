import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";
import fs from "fs";
import { ENV } from "./config/env";
import apiRouter from "./routes";
import { errorHandler } from "./middleware/error.middleware";
import { apiLimiter } from "./middleware/rateLimit.middleware";
import { CronService } from "./services/cron.service";

const app = express();

// Cấu hình trust proxy để đọc đúng IP khi chạy qua ngrok/reverse-proxy (Mục 8.7 README.md)
app.set("trust proxy", 1);

// Cấu hình CORS cho kết nối Frontend Next.js
app.use(
  cors({
    origin: [ENV.CLIENT_URL, "http://localhost:3000", "http://127.0.0.1:3000"],
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Đảm bảo thư mục lưu trữ ảnh công khai tồn tại: server/public/uploads
const uploadsDir = path.join(__dirname, "../public/uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Phục vụ tĩnh thư mục uploads công khai cho trình duyệt và Frontend
app.use("/uploads", express.static(uploadsDir));

// Endpoint kiểm tra sức khỏe máy chủ
app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    service: "TrendyFit Backend API",
    mode: ENV.NODE_ENV,
    mockPaymentMode: ENV.PAYMENT_MOCK_MODE,
    timestamp: new Date().toISOString(),
  });
});

// Gắn toàn bộ API routes (kèm apiLimiter bảo vệ DoS chung)
app.use("/api", apiLimiter, apiRouter);

// Middleware bắt lỗi tập trung
app.use(errorHandler);

// Khởi chạy máy chủ
app.listen(ENV.PORT, () => {
  console.log(`=======================================================`);
  console.log(`🚀 TRENDYFIT BACKEND API ĐANG CHẠY TẠI CỔNG : ${ENV.PORT}`);
  console.log(`📡 URL Máy chủ: http://localhost:${ENV.PORT}`);
  console.log(`🛠️  Chế độ Mock Payment: ${ENV.PAYMENT_MOCK_MODE ? "BẬT (Demo/Dev)" : "TẮT (Production)"}`);
  console.log(`📁 Thư mục Uploads tĩnh: ${uploadsDir}`);
  console.log(`=======================================================`);

  // Khởi động tiến trình Cron quét giải phóng kho 10 phút
  CronService.init();
});

export default app;
