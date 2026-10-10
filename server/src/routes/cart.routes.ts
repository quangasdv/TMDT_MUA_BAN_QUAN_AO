import { Router } from "express";
import { CartController } from "../controllers/cart.controller";
import { optionalJwt } from "../middleware/auth.middleware";

const router = Router();

// Tất cả các route giỏ hàng đều đi qua optionalJwt để nhận diện tài khoản nếu có đăng nhập
router.use(optionalJwt);

router.get("/cart", CartController.getCart);
router.post("/cart/items", CartController.addItem);
router.patch("/cart/items/:id", CartController.updateItemQuantity);
router.delete("/cart/items/:id", CartController.removeItem);

export default router;
