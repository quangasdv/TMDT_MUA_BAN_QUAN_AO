import { Router } from "express";
import { AdminController } from "../controllers/admin.controller";
import { authenticateJwt } from "../middleware/auth.middleware";
import { requireRoles } from "../middleware/rbac.middleware";

const router = Router();

// Tất cả các route admin đều bắt buộc đăng nhập
router.use(authenticateJwt);

// Quản lý đơn hàng: Cho phép cả ADMIN và STAFF (Mục 7.2)
router.get("/admin/orders", requireRoles(["ADMIN", "STAFF"]), AdminController.getOrders);
router.patch("/admin/orders/:id/status", requireRoles(["ADMIN", "STAFF"]), AdminController.updateOrderStatus);

// Quản lý Sản phẩm, Voucher, Thống kê: Chỉ dành riêng cho ADMIN
router.get("/admin/products", requireRoles(["ADMIN"]), AdminController.getProducts);
router.post("/admin/products", requireRoles(["ADMIN"]), AdminController.createProduct);
router.put("/admin/products/:id", requireRoles(["ADMIN"]), AdminController.updateProduct);
router.delete("/admin/products/:id", requireRoles(["ADMIN"]), AdminController.deleteProduct);

router.get("/admin/vouchers", requireRoles(["ADMIN"]), AdminController.getVouchers);
router.post("/admin/vouchers", requireRoles(["ADMIN"]), AdminController.createVoucher);

router.get("/admin/stats", requireRoles(["ADMIN"]), AdminController.getDashboardStats);

export default router;
