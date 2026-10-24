import { Router } from "express";
import { AdminController } from "../controllers/admin.controller";
import { authenticateJwt } from "../middleware/auth.middleware";
import { requireRoles } from "../middleware/rbac.middleware";

const router = Router();

// Tất cả các route admin đều bắt buộc đăng nhập
router.use(authenticateJwt);

// 1. Quản lý đơn hàng: Cho phép cả ADMIN và STAFF (Mục 7.2 README.md)
router.get("/admin/orders", requireRoles(["ADMIN", "STAFF"]), AdminController.getOrders);
router.patch("/admin/orders/:id/status", requireRoles(["ADMIN", "STAFF"]), AdminController.updateOrderStatus);

// 2. Quản lý Sản phẩm: Chỉ dành riêng cho ADMIN
router.get("/admin/products", requireRoles(["ADMIN"]), AdminController.getProducts);
router.post("/admin/products", requireRoles(["ADMIN"]), AdminController.createProduct);
router.put("/admin/products/:id", requireRoles(["ADMIN"]), AdminController.updateProduct);
router.delete("/admin/products/:id", requireRoles(["ADMIN"]), AdminController.deleteProduct);

// 3. Quản lý Voucher: Chỉ dành riêng cho ADMIN
router.get("/admin/vouchers", requireRoles(["ADMIN"]), AdminController.getVouchers);
router.post("/admin/vouchers", requireRoles(["ADMIN"]), AdminController.createVoucher);
router.put("/admin/vouchers/:id", requireRoles(["ADMIN"]), AdminController.updateVoucher);
router.delete("/admin/vouchers/:id", requireRoles(["ADMIN"]), AdminController.deleteVoucher);

// 4. Quản lý Tài khoản (Khách hàng & Nhân viên): Chỉ dành riêng cho ADMIN
router.get("/admin/users", requireRoles(["ADMIN"]), AdminController.getUsers);
router.post("/admin/users", requireRoles(["ADMIN"]), AdminController.createUser);
router.put("/admin/users/:id", requireRoles(["ADMIN"]), AdminController.updateUser);

// 5. Thống kê Báo cáo: Chỉ dành riêng cho ADMIN
router.get("/admin/stats", requireRoles(["ADMIN"]), AdminController.getDashboardStats);

export default router;
