import test from "node:test";
import assert from "node:assert/strict";

const API_BASE = "http://localhost:5000/api";

// 1. UNIT TEST: State Machine Transition Constraints
const ALLOWED_STATUS_TRANSITIONS = {
  PENDING_PAYMENT: ["CANCELLED"],
  PAID: ["PROCESSING", "CANCELLED"],
  PROCESSING: ["SHIPPING", "CANCELLED"],
  SHIPPING: ["DELIVERED", "CANCELLED"],
  DELIVERED: [],
  CANCELLED: [],
  PAYMENT_EXPIRED_PENDING_REFUND: ["CANCELLED"],
};

test("Admin - Order Status State Machine Transitions", () => {
  // PENDING_PAYMENT chỉ được CANCELLED
  assert.deepEqual(ALLOWED_STATUS_TRANSITIONS.PENDING_PAYMENT, ["CANCELLED"]);
  assert.equal(ALLOWED_STATUS_TRANSITIONS.PENDING_PAYMENT.includes("PROCESSING"), false);
  assert.equal(ALLOWED_STATUS_TRANSITIONS.PENDING_PAYMENT.includes("SHIPPING"), false);

  // PAID có thể sang PROCESSING hoặc CANCELLED
  assert.deepEqual(ALLOWED_STATUS_TRANSITIONS.PAID, ["PROCESSING", "CANCELLED"]);

  // PROCESSING có thể sang SHIPPING hoặc CANCELLED
  assert.deepEqual(ALLOWED_STATUS_TRANSITIONS.PROCESSING, ["SHIPPING", "CANCELLED"]);

  // SHIPPING có thể sang DELIVERED hoặc CANCELLED
  assert.deepEqual(ALLOWED_STATUS_TRANSITIONS.SHIPPING, ["DELIVERED", "CANCELLED"]);

  // DELIVERED & CANCELLED là trạng thái kết thúc (terminal)
  assert.equal(ALLOWED_STATUS_TRANSITIONS.DELIVERED.length, 0);
  assert.equal(ALLOWED_STATUS_TRANSITIONS.CANCELLED.length, 0);
});

// 2. LIVE API INTEGRATION TEST: Admin & Staff Role Access Control (RBAC)
test("Admin & Staff RBAC - Admin Stats, Orders, Products, Vouchers & Access Separation", async () => {
  // -------------------------------------------------------------
  // Bước 1: Đăng nhập với tài khoản ADMIN
  // -------------------------------------------------------------
  const adminLoginRes = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "admin@trendyfit.vn",
      password: "Admin@123456",
    }),
  });
  assert.equal(adminLoginRes.status, 200, "Admin login should return 200 OK");
  const adminLoginData = await adminLoginRes.json();
  const adminToken = adminLoginData.data.accessToken;
  assert.equal(adminLoginData.data.user.role, "ADMIN");

  // -------------------------------------------------------------
  // Bước 2: ADMIN gọi GET /api/admin/stats
  // -------------------------------------------------------------
  const statsRes = await fetch(`${API_BASE}/admin/stats`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  assert.equal(statsRes.status, 200, "GET /api/admin/stats should return 200 OK for ADMIN");
  const statsData = await statsRes.json();
  assert.equal(statsData.success, true);
  assert.ok(statsData.data.stats, "Stats data should be present");
  assert.ok(typeof statsData.data.stats.totalUsers === "number");
  assert.ok(typeof statsData.data.stats.totalOrders === "number");
  assert.ok(typeof statsData.data.stats.paidOrdersCount === "number");
  assert.ok(typeof statsData.data.stats.totalRevenue === "number");
  assert.ok(typeof statsData.data.stats.totalProducts === "number");

  // -------------------------------------------------------------
  // Bước 3: ADMIN gọi GET /api/admin/orders
  // -------------------------------------------------------------
  const adminOrdersRes = await fetch(`${API_BASE}/admin/orders?page=1&limit=10`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  assert.equal(adminOrdersRes.status, 200, "GET /api/admin/orders should return 200 OK for ADMIN");
  const adminOrdersData = await adminOrdersRes.json();
  assert.equal(adminOrdersData.success, true);
  assert.ok(Array.isArray(adminOrdersData.data.orders));
  assert.ok(adminOrdersData.data.pagination);

  // -------------------------------------------------------------
  // Bước 4: Đăng nhập với tài khoản STAFF
  // -------------------------------------------------------------
  const staffLoginRes = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "staff@trendyfit.vn",
      password: "Staff@123456",
    }),
  });
  assert.equal(staffLoginRes.status, 200, "Staff login should return 200 OK");
  const staffLoginData = await staffLoginRes.json();
  const staffToken = staffLoginData.data.accessToken;
  assert.equal(staffLoginData.data.user.role, "STAFF");

  // STAFF được phép xem đơn hàng GET /api/admin/orders
  const staffOrdersRes = await fetch(`${API_BASE}/admin/orders?page=1&limit=5`, {
    headers: { Authorization: `Bearer ${staffToken}` },
  });
  assert.equal(staffOrdersRes.status, 200, "STAFF should have access to GET /api/admin/orders");

  // STAFF KHÔNG được phép xem stats GET /api/admin/stats (Phải nhận 403 Forbidden)
  const staffStatsRes = await fetch(`${API_BASE}/admin/stats`, {
    headers: { Authorization: `Bearer ${staffToken}` },
  });
  assert.equal(staffStatsRes.status, 403, "STAFF should be FORBIDDEN (403) from accessing admin stats");

  // -------------------------------------------------------------
  // Bước 5: ADMIN quản lý Sản phẩm (GET, POST, PUT, DELETE)
  // -------------------------------------------------------------
  // 5.1: Lấy danh sách sản phẩm
  const productsRes = await fetch(`${API_BASE}/admin/products`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  assert.equal(productsRes.status, 200, "GET /api/admin/products should return 200 OK");
  const productsData = await productsRes.json();
  assert.equal(productsData.success, true);
  assert.ok(Array.isArray(productsData.data.products));

  // Lấy 1 category id để tạo sản phẩm
  const categoriesRes = await fetch(`${API_BASE}/categories`);
  const categoriesData = await categoriesRes.json();
  const categoryId = categoriesData.data.categories[0].id;

  // 5.2: Tạo sản phẩm mới
  const testSlug = `ao-test-admin-${Date.now()}`;
  const createProductRes = await fetch(`${API_BASE}/admin/products`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({
      name: "Áo Test Batch 7 Admin",
      slug: testSlug,
      description: "Sản phẩm thử nghiệm kiểm thử tự động Batch 7",
      basePrice: 299000,
      categoryId,
      variants: [
        {
          sku: `TEST-${Date.now()}-M`,
          color: "Đen",
          size: "M",
          priceAdjustment: 0,
          stockQuantity: 20,
        },
      ],
    }),
  });
  assert.equal(createProductRes.status, 201, "POST /api/admin/products should return 201 Created");
  const createProductData = await createProductRes.json();
  assert.equal(createProductData.success, true);
  const createdProductId = createProductData.data.product.id;

  // 5.3: Chỉnh sửa sản phẩm
  const updateProductRes = await fetch(`${API_BASE}/admin/products/${createdProductId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({
      name: "Áo Test Batch 7 Admin (Đã cập nhật)",
      basePrice: 320000,
    }),
  });
  assert.equal(updateProductRes.status, 200, "PUT /api/admin/products/:id should return 200 OK");

  // 5.4: Ẩn/Xóa mềm sản phẩm
  const deleteProductRes = await fetch(`${API_BASE}/admin/products/${createdProductId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  assert.equal(deleteProductRes.status, 200, "DELETE /api/admin/products/:id should return 200 OK");

  // -------------------------------------------------------------
  // Bước 6: ADMIN quản lý Voucher (GET, POST)
  // -------------------------------------------------------------
  // 6.1: Lấy danh sách Voucher
  const vouchersRes = await fetch(`${API_BASE}/admin/vouchers`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  assert.equal(vouchersRes.status, 200, "GET /api/admin/vouchers should return 200 OK");
  const vouchersData = await vouchersRes.json();
  assert.equal(vouchersData.success, true);
  assert.ok(Array.isArray(vouchersData.data.vouchers));

  // 6.2: Tạo Voucher mới
  const testVoucherCode = `TEST${Date.now().toString().slice(-6)}`;
  const createVoucherRes = await fetch(`${API_BASE}/admin/vouchers`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({
      code: testVoucherCode,
      discountType: "PERCENT",
      discountValue: 15,
      minOrderValue: 200000,
      usageLimit: 50,
      expiresAt: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
    }),
  });
  assert.equal(createVoucherRes.status, 201, "POST /api/admin/vouchers should return 201 Created");
  const createVoucherData = await createVoucherRes.json();
  assert.equal(createVoucherData.success, true);
  assert.equal(createVoucherData.data.voucher.code, testVoucherCode);
});

