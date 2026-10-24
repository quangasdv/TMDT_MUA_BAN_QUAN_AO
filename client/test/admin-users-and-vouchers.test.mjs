import test from "node:test";
import assert from "node:assert/strict";

const API_BASE = "http://localhost:5000/api";

test("Admin 2.9 - Users and Vouchers Management APIs", async (t) => {
  // 1. Đăng nhập với tài khoản ADMIN
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

  // 2. GET /api/admin/users - Lấy danh sách người dùng có phân trang
  await t.test("GET /api/admin/users - List users with pagination and filters", async () => {
    const res = await fetch(`${API_BASE}/admin/users?page=1&limit=5`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.ok(Array.isArray(data.data.users));
    assert.ok(data.data.pagination);
    assert.equal(data.data.pagination.page, 1);
    assert.equal(data.data.pagination.limit, 5);
    assert.ok(data.data.pagination.total >= 1);

    // Verify user object shape
    const firstUser = data.data.users[0];
    assert.ok(firstUser.id);
    assert.ok(firstUser.email);
    assert.ok(firstUser.fullName);
    assert.ok(firstUser.role);
    assert.ok(firstUser.createdAt);
    assert.ok(firstUser._count);
    assert.ok(typeof firstUser._count.orders === "number");

    // Filter by role=ADMIN
    const adminRoleRes = await fetch(`${API_BASE}/admin/users?role=ADMIN`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.equal(adminRoleRes.status, 200);
    const adminRoleData = await adminRoleRes.json();
    assert.ok(adminRoleData.data.users.every((u) => u.role === "ADMIN"));

    // Search query q=admin
    const searchRes = await fetch(`${API_BASE}/admin/users?q=admin`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.equal(searchRes.status, 200);
    const searchData = await searchRes.json();
    assert.ok(searchData.data.users.length >= 1);
  });

  // 3. POST & PUT /api/admin/users - Tạo mới và cập nhật người dùng
  await t.test("POST and PUT /api/admin/users - Create and update user account", async () => {
    const timestamp = Date.now();
    const newUserEmail = `staff.test.${timestamp}@trendyfit.vn`;

    // Tạo user mới
    const createRes = await fetch(`${API_BASE}/admin/users`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        email: newUserEmail,
        password: "Password@123",
        fullName: "Test Staff Member",
        phone: "0987654321",
        role: "STAFF",
      }),
    });
    assert.equal(createRes.status, 201, "Create user should return 201 Created");
    const createData = await createRes.json();
    assert.equal(createData.success, true);
    assert.equal(createData.data.user.email, newUserEmail);
    assert.equal(createData.data.user.fullName, "Test Staff Member");
    assert.equal(createData.data.user.role, "STAFF");

    const createdUserId = createData.data.user.id;

    // Cập nhật user
    const updateRes = await fetch(`${API_BASE}/admin/users/${createdUserId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        fullName: "Updated Staff Name",
        phone: "0912345678",
        role: "CUSTOMER",
      }),
    });
    assert.equal(updateRes.status, 200, "Update user should return 200 OK");
    const updateData = await updateRes.json();
    assert.equal(updateData.success, true);
    assert.equal(updateData.data.user.fullName, "Updated Staff Name");
    assert.equal(updateData.data.user.phone, "0912345678");
    assert.equal(updateData.data.user.role, "CUSTOMER");
  });

  // 4. PUT and DELETE /api/admin/vouchers/:id - Cập nhật và vô hiệu hóa voucher
  await t.test("PUT and DELETE /api/admin/vouchers/:id - Update and deactivate voucher", async () => {
    const timestamp = Date.now().toString().slice(-6);
    const voucherCode = `TEST${timestamp}`;

    // Tạo voucher mới để kiểm thử
    const createVoucherRes = await fetch(`${API_BASE}/admin/vouchers`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        code: voucherCode,
        discountType: "PERCENT",
        discountValue: 15,
        minOrderValue: 200000,
        usageLimit: 50,
        expiresAt: new Date(Date.now() + 86400000 * 7).toISOString(),
      }),
    });
    assert.equal(createVoucherRes.status, 201);
    const createVoucherData = await createVoucherRes.json();
    const voucherId = createVoucherData.data.voucher.id;

    // Cập nhật voucher (PUT)
    const updateVoucherRes = await fetch(`${API_BASE}/admin/vouchers/${voucherId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        discountValue: 25,
        usageLimit: 80,
      }),
    });
    assert.equal(updateVoucherRes.status, 200);
    const updateVoucherData = await updateVoucherRes.json();
    assert.equal(updateVoucherData.success, true);
    assert.equal(Number(updateVoucherData.data.voucher.discountValue), 25);
    assert.equal(Number(updateVoucherData.data.voucher.usageLimit), 80);

    // Vô hiệu hóa voucher (DELETE)
    const deleteVoucherRes = await fetch(`${API_BASE}/admin/vouchers/${voucherId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
    });
    assert.equal(deleteVoucherRes.status, 200);
    const deleteVoucherData = await deleteVoucherRes.json();
    assert.equal(deleteVoucherData.success, true);
    assert.equal(deleteVoucherData.data.voucher.isActive, false);
  });
});

