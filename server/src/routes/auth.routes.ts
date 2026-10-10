import { Router } from "express";
import { AuthController } from "../controllers/auth.controller";
import { authenticateJwt } from "../middleware/auth.middleware";
import { authLimiter } from "../middleware/rateLimit.middleware";

const router = Router();

router.post("/register", authLimiter, AuthController.register);
router.post("/login", authLimiter, AuthController.login);
router.post("/refresh", AuthController.refresh);
router.post("/logout", AuthController.logout);
router.get("/me", authenticateJwt, AuthController.me);

export default router;
