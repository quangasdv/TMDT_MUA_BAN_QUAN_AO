import { Router } from "express";
import { CheckoutController } from "../controllers/checkout.controller";
import { authenticateJwt } from "../middleware/auth.middleware";
import { checkoutLimiter } from "../middleware/rateLimit.middleware";

const router = Router();

// Hỗ trợ cả /checkout và /checkout/lock
router.post("/checkout", checkoutLimiter, authenticateJwt, CheckoutController.lockAndCheckout);
router.post("/checkout/lock", checkoutLimiter, authenticateJwt, CheckoutController.lockAndCheckout);

router.get("/orders", authenticateJwt, CheckoutController.getUserOrders);
router.get("/orders/:code", authenticateJwt, CheckoutController.getOrderByCode);

export default router;
