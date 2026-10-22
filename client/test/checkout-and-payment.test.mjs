import test from "node:test";
import assert from "node:assert/strict";

const API_BASE = "http://localhost:5000/api";
const FREE_SHIPPING_THRESHOLD = 499000;
const STANDARD_SHIPPING_FEE = 30000;

function calculateCheckoutFinancials({ subtotal, voucher, freeShippingThreshold = FREE_SHIPPING_THRESHOLD }) {
  const isFreeShipping = subtotal >= freeShippingThreshold;
  const shippingFee = subtotal === 0 ? 0 : isFreeShipping ? 0 : STANDARD_SHIPPING_FEE;

  let discountAmount = 0;
  if (voucher) {
    if (voucher.discountType === "PERCENT") {
      discountAmount = Math.round(subtotal * (voucher.discountValue / 100));
    } else {
      discountAmount = voucher.discountValue;
    }
    discountAmount = Math.min(discountAmount, subtotal);
  }

  const finalTotal = Math.max(0, subtotal - discountAmount + shippingFee);

  return {
    subtotal,
    discountAmount,
    shippingFee,
    isFreeShipping,
    finalTotal,
  };
}

// 1. UNIT TEST: Financial and Discount Calculations
test("Checkout - Financial Calculation with Fixed Voucher (FREESHIP -30k)", () => {
  const result = calculateCheckoutFinancials({
    subtotal: 300000,
    voucher: { discountType: "FIXED", discountValue: 30000 },
  });

  assert.equal(result.subtotal, 300000);
  assert.equal(result.discountAmount, 30000);
  assert.equal(result.shippingFee, 30000); // 300,000 < 499,000 -> 30,000đ shipping
  assert.equal(result.finalTotal, 300000); // 300,000 - 30,000 + 30,000 = 300,000đ
});

test("Checkout - Financial Calculation with Percentage Voucher (WELCOME2026 -20%) and Free Shipping", () => {
  const result = calculateCheckoutFinancials({
    subtotal: 600000,
    voucher: { discountType: "PERCENT", discountValue: 20 },
  });

  assert.equal(result.subtotal, 600000);
  assert.equal(result.discountAmount, 120000); // 20% của 600,000 = 120,000đ
  assert.equal(result.shippingFee, 0); // 600,000 >= 499,000 -> Free shipping
  assert.equal(result.finalTotal, 480000); // 600,000 - 120,000 = 480,000đ
});

test("Checkout - Discount cannot exceed subtotal amount", () => {
  const result = calculateCheckoutFinancials({
    subtotal: 50000,
    voucher: { discountType: "FIXED", discountValue: 100000 },
  });

  assert.equal(result.discountAmount, 50000); // capped at subtotal
  assert.equal(result.shippingFee, 30000);
  assert.equal(result.finalTotal, 30000); // 0 + 30,000 = 30,000đ
});

// 2. LIVE API INTEGRATION TEST: Full Checkout & Payment Lifecycle
test("Checkout & Payment - Live API Integration: Voucher Apply, Order Lock, VietQR, and Mock Payment", async () => {
  // BƯỚC 1: Đăng nhập để lấy Bearer Token
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
  assert.ok(loginData.data?.accessToken, "Token xác thực phải tồn tại");
  const token = loginData.data.accessToken;

  // BƯỚC 2: Kiểm thử POST /api/vouchers/apply (Áp dụng thành công)
  const applyVoucherRes = await fetch(`${API_BASE}/vouchers/apply`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      voucherCode: "WELCOME2026",
      totalAmount: 300000,
    }),
  });

  assert.equal(applyVoucherRes.status, 200, "Áp dụng voucher hợp lệ phải trả về 200 OK");
  const voucherData = await applyVoucherRes.json();
  assert.equal(voucherData.success, true);
  assert.equal(voucherData.data.code, "WELCOME2026");
  assert.equal(voucherData.data.discountAmount, 60000); // 20% của 300,000 = 60,000đ
  assert.equal(voucherData.data.finalAmount, 240000);

  // BƯỚC 3: Kiểm thử POST /api/vouchers/apply với mã không tồn tại
  const invalidVoucherRes = await fetch(`${API_BASE}/vouchers/apply`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      voucherCode: "INVALID_CODE_9999",
      totalAmount: 200000,
    }),
  });
  assert.equal(invalidVoucherRes.status, 404, "Mã voucher không tồn tại phải trả về 404");
  const invalidData = await invalidVoucherRes.json();
  assert.equal(invalidData.errorCode, "VOUCHER_NOT_FOUND");

  // BƯỚC 4: Lấy danh sách sản phẩm để chọn variantId thật
  const productRes = await fetch(`${API_BASE}/products?limit=1`);
  assert.equal(productRes.status, 200);
  const productData = await productRes.json();
  const sampleVariant = productData.data?.products?.[0]?.variants?.[0];
  assert.ok(sampleVariant?.id, "Phải tìm thấy ít nhất 1 variant trong database");

  // BƯỚC 5: Thử nghiệm tạo đơn hàng & khóa kho bằng POST /api/checkout/lock
  const checkoutRes = await fetch(`${API_BASE}/checkout/lock`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      recipientName: "Nguyễn Văn Test",
      recipientPhone: "0912345678",
      shippingAddress: "123 Đường Thời Trang, Quận 1, TP. Hồ Chí Minh",
      voucherCode: "WELCOME2026",
      items: [{ variantId: sampleVariant.id, quantity: 1 }],
    }),
  });

  // Có 2 trường hợp hợp lệ phụ thuộc số đơn PENDING hiện tại:
  // 1) 201 Created (Tạo đơn và khóa kho thành công)
  // 2) 429 ORDER_PENDING_LIMIT_REACHED (Nếu user đã có 2 đơn pending trước đó)
  assert.ok(
    [201, 429].includes(checkoutRes.status),
    `Checkout phải trả về 201 hoặc 429, thực tế nhận: ${checkoutRes.status}`
  );

  let targetOrderCode;
  if (checkoutRes.status === 201) {
    const lockData = await checkoutRes.json();
    assert.equal(lockData.success, true);
    assert.ok(lockData.data.order?.orderCode);
    assert.equal(lockData.data.lockDurationSeconds, 600);
    targetOrderCode = lockData.data.order.orderCode;
  }

  // BƯỚC 6: Kiểm thử GET /api/orders (Lấy danh sách đơn hàng của tôi)
  const ordersListRes = await fetch(`${API_BASE}/orders`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  assert.equal(ordersListRes.status, 200, "GET /api/orders phải trả về 200");
  const ordersListData = await ordersListRes.json();
  assert.equal(ordersListData.success, true);
  assert.ok(Array.isArray(ordersListData.data?.orders), "orders phải là mảng");
  assert.ok(ordersListData.data.orders.length > 0, "Phải có ít nhất 1 đơn hàng");

  if (!targetOrderCode) {
    targetOrderCode = ordersListData.data.orders[0].orderCode;
  }

  // BƯỚC 7: Kiểm thử GET /api/orders/:code (Chi tiết đơn hàng theo orderCode)
  const orderDetailRes = await fetch(`${API_BASE}/orders/${targetOrderCode}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  assert.equal(orderDetailRes.status, 200, "GET /api/orders/:code phải trả về 200");
  const orderDetailData = await orderDetailRes.json();
  assert.equal(orderDetailData.success, true);
  assert.equal(orderDetailData.data.order.orderCode, targetOrderCode);
  assert.ok(orderDetailData.data.order.items.length > 0);

  // BƯỚC 8: Kiểm thử POST /api/payments/create-qr
  // Nếu đơn hàng đang PENDING_PAYMENT, tạo mã QR thanh toán
  const currentStatus = orderDetailData.data.order.status;
  if (currentStatus === "PENDING_PAYMENT") {
    const qrRes = await fetch(`${API_BASE}/payments/create-qr`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ orderCode: targetOrderCode }),
    });

    assert.equal(qrRes.status, 200, "Tạo thông tin VietQR phải trả về 200");
    const qrData = await qrRes.json();
    assert.equal(qrData.success, true);
    assert.ok(qrData.data.vietQrUrl.includes("vietqr.io"));
    assert.equal(qrData.data.orderCode, targetOrderCode);

    // BƯỚC 9: Kiểm thử POST /api/payments/mock-simulate (Giả lập thanh toán tức thời)
    const mockRes = await fetch(`${API_BASE}/payments/mock-simulate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ orderCode: targetOrderCode }),
    });

    assert.equal(mockRes.status, 200, "Giả lập thanh toán phải trả về 200");
    const mockData = await mockRes.json();
    assert.equal(mockData.success, true);

    // Kiểm tra lại chi tiết đơn hàng: trạng thái phải chuyển sang PAID
    const verifiedOrderRes = await fetch(`${API_BASE}/orders/${targetOrderCode}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const verifiedOrderData = await verifiedOrderRes.json();
    assert.equal(
      verifiedOrderData.data.order.status,
      "PAID",
      "Đơn hàng sau khi giả lập thanh toán phải có trạng thái PAID"
    );
    assert.equal(
      verifiedOrderData.data.order.paymentStatus,
      "PAID",
      "paymentStatus phải là PAID"
    );
  }
});
