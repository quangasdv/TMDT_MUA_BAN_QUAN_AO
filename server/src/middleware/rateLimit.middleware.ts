import rateLimit from "express-rate-limit";

const isTestDisabled = () => process.env.DISABLE_RATE_LIMIT_FOR_TEST === "true";

/**
 * Rate limit chung cho toàn bộ API (100 requests / phút / IP)
 */
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  skip: isTestDisabled,
  message: {
    success: false,
    message: "Bạn đã gửi quá nhiều yêu cầu đến máy chủ. Vui lòng thử lại sau 1 phút.",
  },
});

/**
 * Rate limit cho phân hệ xác thực: Đăng nhập, Đăng ký (10 requests / phút / IP)
 * Phòng chống tấn công dò quét mật khẩu Brute-force (TH-10)
 */
export const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skip: isTestDisabled,
  message: {
    success: false,
    message: "Quá nhiều lần gửi yêu cầu xác thực tài khoản. Vui lòng thử lại sau 1 phút.",
  },
});

/**
 * Rate limit cho endpoint đặt hàng & khóa kho: /api/checkout/lock (10 requests / phút / IP)
 * Phòng chống spam tạo đơn rác chiếm dụng tài nguyên và tồn kho (TH-10, TH-11)
 */
export const checkoutLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skip: isTestDisabled,
  message: {
    success: false,
    message: "Thao tác đặt hàng quá dồn dập. Vui lòng chờ giây lát rồi thử lại.",
  },
});
