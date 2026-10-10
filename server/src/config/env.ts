import dotenv from "dotenv";
dotenv.config();

const isProduction = process.env.NODE_ENV === "production";

if (isProduction) {
  if (process.env.PAYMENT_MOCK_MODE === "true") {
    throw new Error("LỖI BẢO MẬT: Tuyệt đối không được kích hoạt PAYMENT_MOCK_MODE trong môi trường Production!");
  }
  if (!process.env.JWT_ACCESS_SECRET || !process.env.JWT_REFRESH_SECRET) {
    throw new Error("LỖI BẢO MẬT: Bắt buộc cấu hình JWT_ACCESS_SECRET và JWT_REFRESH_SECRET trong môi trường Production!");
  }
  if (!process.env.PAYOS_CHECKSUM_KEY) {
    throw new Error("LỖI BẢO MẬT: Bắt buộc cấu hình PAYOS_CHECKSUM_KEY bí mật trong môi trường Production!");
  }
}

export const ENV = {
  PORT: process.env.PORT ? parseInt(process.env.PORT, 10) : 5000,
  NODE_ENV: process.env.NODE_ENV || "development",
  DATABASE_URL: process.env.DATABASE_URL || "",
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || "default_jwt_access_secret_key_development_only",
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || "default_jwt_refresh_secret_key_development_only",
  JWT_ACCESS_EXPIRES_IN: process.env.JWT_ACCESS_EXPIRES_IN || "15m",
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
  PAYOS_CLIENT_ID: process.env.PAYOS_CLIENT_ID || "",
  PAYOS_API_KEY: process.env.PAYOS_API_KEY || "",
  PAYOS_CHECKSUM_KEY: process.env.PAYOS_CHECKSUM_KEY || "mock_payos_checksum_secret_key_hmac_sha256",
  PAYMENT_MOCK_MODE: isProduction ? false : process.env.PAYMENT_MOCK_MODE === "true",
  CLIENT_URL: process.env.CLIENT_URL || "http://localhost:3000",
};
