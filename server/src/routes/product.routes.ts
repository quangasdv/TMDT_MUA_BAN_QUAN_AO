import { Router } from "express";
import { ProductController } from "../controllers/product.controller";

const router = Router();

// Chú ý: Đặt /products/search và /products/filter TRƯỚC /products/:slug
// để tránh việc Express nhầm lẫn chuỗi "search" hoặc "filter" thành biến động :slug
router.get("/products/search", ProductController.searchProducts);
router.get("/products/filter", ProductController.filterProducts);
router.get("/search", ProductController.searchProducts); // Alias top-level tiện ích
router.get("/filter", ProductController.filterProducts); // Alias top-level tiện ích

router.get("/products", ProductController.getProducts);
router.get("/products/:slug", ProductController.getProductBySlug);
router.get("/categories", ProductController.getCategories);

export default router;
