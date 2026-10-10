import { Router } from "express";
import { PaymentController } from "../controllers/payment.controller";
import { authenticateJwt } from "../middleware/auth.middleware";

const router = Router();

router.post("/payments/create-qr", authenticateJwt, PaymentController.createPaymentLink);
router.post("/payments/webhook", PaymentController.handleWebhook);
router.post("/payments/mock-simulate", authenticateJwt, PaymentController.simulateMockPayment);

export default router;
