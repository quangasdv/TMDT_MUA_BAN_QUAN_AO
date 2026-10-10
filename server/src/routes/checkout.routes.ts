import { Router } from "express";
import { CheckoutController } from "../controllers/checkout.controller";
import { authenticateJwt } from "../middleware/auth.middleware";
import { checkoutLimiter } from "../middleware/rateLimit.middleware";

const router = Router();

router.post("/checkout/lock", checkoutLimiter, authenticateJwt, CheckoutController.lockAndCheckout);
router.get("/orders", authenticateJwt, CheckoutController.getUserOrders);
router.get("/orders/:code", authenticateJwt, CheckoutController.getOrderByCode);

export default router;
