import { Router } from "express";
import { VoucherController } from "../controllers/voucher.controller";

const router = Router();

// Lấy danh sách Voucher khả dụng cho khách hàng ở Storefront
router.get("/vouchers/active", VoucherController.getActiveVouchers);

// Kiểm tra và áp dụng mã giảm giá
router.post("/vouchers/apply", VoucherController.applyVoucher);

export default router;
