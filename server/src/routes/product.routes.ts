import { Router } from "express";
import { ProductController } from "../controllers/product.controller";

const router = Router();

router.get("/products", ProductController.getProducts);
router.get("/products/:slug", ProductController.getProductBySlug);
router.get("/categories", ProductController.getCategories);

export default router;
