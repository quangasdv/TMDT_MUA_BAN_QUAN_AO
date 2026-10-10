import { Router } from "express";
import { VoucherController } from "../controllers/voucher.controller";

const router = Router();

router.post("/vouchers/apply", VoucherController.applyVoucher);

export default router;
