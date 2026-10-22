import test from "node:test";
import assert from "node:assert/strict";

const API_BASE = "http://localhost:5000/api";

// 1. UNIT TEST: Order & Payment Status Badge Mapping
const ORDER_STATUS_MAP = {
  PENDING_PAYMENT: { label: "Chờ thanh toán" },
  PAID: { label: "Đã thanh toán" },
  PROCESSING: { label: "Đang xử lý" },
  SHIPPED: { label: "Đang giao hàng" },
  DELIVERED: { label: "Đã giao thành công" },
  CANCELLED: { label: "Đã hủy đơn" },
};

const PAYMENT_STATUS_MAP = {
  UNPAID: { label: "Chưa thanh toán" },
  PAID: { label: "Đã thanh toán" },
  REFUNDED: { label: "Đã hoàn tiền" },
  PAID_EXPIRED: { label: "Thanh toán quá hạn" },
};

test("Orders - Status Badge mappings are defined and consistent", () => {
  assert.equal(ORDER_STATUS_MAP.PENDING_PAYMENT.label, "Chờ thanh toán");
  assert.equal(ORDER_STATUS_MAP.PAID.label, "Đã thanh toán");
  assert.equal(ORDER_STATUS_MAP.DELIVERED.label, "Đã giao thành công");
  assert.equal(PAYMENT_STATUS_MAP.UNPAID.label, "Chưa thanh toán");
  assert.equal(PAYMENT_STATUS_MAP.PAID.label, "Đã thanh toán");
});

test("Orders - Client-side Filter by Status and Search Query", () => {
  const sampleOrders = [
    {
      orderCode: 100001,
      status: "PENDING_PAYMENT",
      recipientName: "Nguyen Van A",
      items: [{ variant: { product: { name: "Áo Thun Cotton" } } }],
    },
    {
      orderCode: 100002,
      status: "PAID",
      recipientName: "Tran Thi B",
      items: [{ variant: { product: { name: "Quần Jean Slim" } } }],
    },
    {
      orderCode: 100003,
      status: "DELIVERED",
      recipientName: "Le Van C",
      items: [{ variant: { product: { name: "Áo Khoác Bomber" } } }],
    },
  ];

  // Lọc theo tab PAID
  const paidOrders = sampleOrders.filter((ord) => ord.status === "PAID");
  assert.equal(paidOrders.length, 1);
  assert.equal(paidOrders[0].orderCode, 100002);

  // Tìm kiếm theo mã đơn "100003"
  const searchByCode = sampleOrders.filter((ord) => ord.orderCode.toString().includes("100003"));
  assert.equal(searchByCode.length, 1);
  assert.equal(searchByCode[0].recipientName, "Le Van C");

  // Tìm kiếm theo tên sản phẩm "cotton"
  const searchByName = sampleOrders.filter((ord) =>
    ord.items.some((it) => it.variant.product.name.toLowerCase().includes("cotton"))
  );
  assert.equal(searchByName.length, 1);
  assert.equal(searchByName[0].orderCode, 100001);
});

// 2. LIVE API INTEGRATION TEST: Orders List & Tracking Detail
test("Orders - Live API: GET /api/orders and GET /api/orders/:code", async () => {
  // BƯỚC 1: Đăng nhập
  const loginRes = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "customer@gmail.com",
      password: "Customer@123456",
    }),
  });
  assert.equal(loginRes.status, 200, "Đăng nhập người dùng phải trả về HTTP 200");
  const loginData = await loginRes.json();
  const token = loginData.data?.accessToken;
  assert.ok(token, "Token xác thực phải tồn tại");

  // BƯỚC 2: Gọi GET /api/orders không có token -> Phải trả về 401
  const unauthRes = await fetch(`${API_BASE}/orders`);
  assert.equal(unauthRes.status, 401, "GET /api/orders khi chưa đăng nhập phải trả về 401");

  // BƯỚC 3: Gọi GET /api/orders với Bearer token hợp lệ
  const listRes = await fetch(`${API_BASE}/orders`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  assert.equal(listRes.status, 200, "GET /api/orders phải trả về 200 OK");
  const listData = await listRes.json();
  assert.equal(listData.success, true);
  assert.ok(Array.isArray(listData.data?.orders), "data.orders phải là mảng");
  assert.ok(listData.data.orders.length > 0, "Khách hàng phải có ít nhất 1 đơn hàng");

  const sampleOrder = listData.data.orders[0];
  assert.ok(sampleOrder.orderCode, "Đơn hàng phải có orderCode");
  assert.ok(sampleOrder.status, "Đơn hàng phải có status");
  assert.ok(sampleOrder.paymentStatus, "Đơn hàng phải có paymentStatus");
  assert.ok(sampleOrder.items.length > 0, "Đơn hàng phải có danh sách items");

  // BƯỚC 4: Gọi GET /api/orders/:code với orderCode thật
  const detailRes = await fetch(`${API_BASE}/orders/${sampleOrder.orderCode}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  assert.equal(detailRes.status, 200, "GET /api/orders/:code phải trả về 200 OK");
  const detailData = await detailRes.json();
  assert.equal(detailData.success, true);
  assert.equal(detailData.data.order.orderCode, sampleOrder.orderCode);
  assert.ok(detailData.data.order.recipientName, "Phải có tên người nhận");
  assert.ok(detailData.data.order.recipientPhone, "Phải có số điện thoại người nhận");
  assert.ok(detailData.data.order.shippingAddress, "Phải có địa chỉ giao hàng");
  assert.ok(detailData.data.order.items.length > 0, "Phải có items");

  // Kiểm tra thông tin variant trong item
  const firstItem = detailData.data.order.items[0];
  assert.ok(firstItem.variant?.color, "Biến thể phải có color");
  assert.ok(firstItem.variant?.size, "Biến thể phải có size");
  assert.ok(firstItem.variant?.product?.name, "Biến thể phải có tên product");

  // BƯỚC 5: Gọi GET /api/orders/999999 với mã đơn không tồn tại -> 404
  const notFoundRes = await fetch(`${API_BASE}/orders/999999`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  assert.equal(notFoundRes.status, 404, "Đơn hàng không tồn tại phải trả về 404");
  const notFoundData = await notFoundRes.json();
  assert.equal(notFoundData.success, false);
});

