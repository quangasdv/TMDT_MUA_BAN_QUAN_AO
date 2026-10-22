import test from "node:test";
import assert from "node:assert/strict";

const FREE_SHIPPING_THRESHOLD = 499000;
const STANDARD_SHIPPING_FEE = 30000;

function calculateCartTotals(items) {
  const totalItemCount = items.reduce((acc, it) => acc + (it.quantity || 0), 0);
  const subtotalPrice = items.reduce((acc, it) => {
    const base = Number(it.variant.product.basePrice) || 0;
    const adjust = Number(it.variant.priceAdjustment) || 0;
    return acc + (base + adjust) * it.quantity;
  }, 0);

  const isFreeShipping = subtotalPrice >= FREE_SHIPPING_THRESHOLD;
  const shippingFee = items.length === 0 ? 0 : isFreeShipping ? 0 : STANDARD_SHIPPING_FEE;
  const finalTotal = subtotalPrice + shippingFee;
  const amountNeededForFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotalPrice);
  const freeShippingProgress =
    items.length === 0
      ? 0
      : Math.min(100, Math.round((subtotalPrice / FREE_SHIPPING_THRESHOLD) * 100));

  return {
    totalItemCount,
    subtotalPrice,
    isFreeShipping,
    shippingFee,
    finalTotal,
    amountNeededForFreeShipping,
    freeShippingProgress,
  };
}

test("Cart - Total, Subtotal and Shipping Calculations (Below Threshold)", () => {
  const sampleItems = [
    {
      id: "item-1",
      quantity: 1,
      variant: {
        priceAdjustment: 0,
        stockQuantity: 10,
        product: { basePrice: 420000 },
      },
    },
  ];

  const result = calculateCartTotals(sampleItems);
  assert.equal(result.totalItemCount, 1);
  assert.equal(result.subtotalPrice, 420000);
  assert.equal(result.isFreeShipping, false);
  assert.equal(result.shippingFee, 30000);
  assert.equal(result.finalTotal, 450000);
  assert.equal(result.amountNeededForFreeShipping, 79000);
  assert.equal(result.freeShippingProgress, 84);
});

test("Cart - Free Shipping Threshold Reached (>= 499,000 VND)", () => {
  const sampleItems = [
    {
      id: "item-1",
      quantity: 2,
      variant: {
        priceAdjustment: 30000,
        stockQuantity: 10,
        product: { basePrice: 250000 }, // (250k + 30k) * 2 = 560,000 VND
      },
    },
  ];

  const result = calculateCartTotals(sampleItems);
  assert.equal(result.totalItemCount, 2);
  assert.equal(result.subtotalPrice, 560000);
  assert.equal(result.isFreeShipping, true);
  assert.equal(result.shippingFee, 0);
  assert.equal(result.finalTotal, 560000);
  assert.equal(result.amountNeededForFreeShipping, 0);
  assert.equal(result.freeShippingProgress, 100);
});

test("Cart - Empty Items Calculation", () => {
  const result = calculateCartTotals([]);
  assert.equal(result.totalItemCount, 0);
  assert.equal(result.subtotalPrice, 0);
  assert.equal(result.shippingFee, 0);
  assert.equal(result.finalTotal, 0);
  assert.equal(result.freeShippingProgress, 0);
});

test("Cart - Quantity Stock Boundary Check", () => {
  const variantStock = 5;

  function safeIncreaseQuantity(currentQuantity) {
    if (currentQuantity >= variantStock) return currentQuantity;
    return currentQuantity + 1;
  }

  assert.equal(safeIncreaseQuantity(1), 2);
  assert.equal(safeIncreaseQuantity(4), 5);
  assert.equal(safeIncreaseQuantity(5), 5); // Clamped at stock limit
});

test("Cart Live API - Full Lifecycle: Guest Cart, Add, Update, Error handling, and Delete", async () => {
  const testSessionId = `test_cart_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const headers = {
    "Content-Type": "application/json",
    "x-session-id": testSessionId,
  };

  // 1. GET /api/cart -> Ban đầu giỏ hàng trống
  const getRes = await fetch("http://localhost:5000/api/cart", { headers });
  assert.equal(getRes.status, 200);
  const getJson = await getRes.json();
  assert.equal(getJson.success, true);
  assert.ok(Array.isArray(getJson.data.cart.items));
  assert.equal(getJson.data.cart.items.length, 0);

  // 2. Lấy 1 variant thật từ sản phẩm để test
  const prodRes = await fetch("http://localhost:5000/api/products/quan-jean-wide-leg");
  const prodJson = await prodRes.json();
  const targetVariant = prodJson.data.product.variants[0];
  assert.ok(targetVariant?.id, "Phải có variant hợp lệ từ database");

  // 3. POST /api/cart/items -> Thêm sản phẩm vào giỏ
  const addRes = await fetch("http://localhost:5000/api/cart/items", {
    method: "POST",
    headers,
    body: JSON.stringify({ variantId: targetVariant.id, quantity: 2 }),
  });
  assert.equal(addRes.status, 200);
  const addJson = await addRes.json();
  assert.equal(addJson.success, true);
  assert.equal(addJson.data.cart.items.length, 1);
  assert.equal(addJson.data.cart.items[0].quantity, 2);

  const cartItemId = addJson.data.cart.items[0].id;

  // 4. PATCH /api/cart/items/:id -> Cập nhật số lượng
  const patchRes = await fetch(`http://localhost:5000/api/cart/items/${cartItemId}`, {
    method: "PATCH",
    headers,
    body: JSON.stringify({ quantity: 4 }),
  });
  assert.equal(patchRes.status, 200);
  const patchJson = await patchRes.json();
  assert.equal(patchJson.success, true);
  assert.equal(patchJson.data.cart.items[0].quantity, 4);

  // 5. Test error: Cập nhật số lượng âm -> 400 CART_INVALID_QUANTITY
  const invalidRes = await fetch(`http://localhost:5000/api/cart/items/${cartItemId}`, {
    method: "PATCH",
    headers,
    body: JSON.stringify({ quantity: -2 }),
  });
  assert.equal(invalidRes.status, 400);
  const invalidJson = await invalidRes.json();
  assert.equal(invalidJson.errorCode, "CART_INVALID_QUANTITY");

  // 6. Test error: Xóa món không tồn tại -> 404 CART_ITEM_NOT_FOUND
  const notFoundRes = await fetch("http://localhost:5000/api/cart/items/non_existent_id", {
    method: "DELETE",
    headers,
  });
  assert.equal(notFoundRes.status, 404);
  const notFoundJson = await notFoundRes.json();
  assert.equal(notFoundJson.errorCode, "CART_ITEM_NOT_FOUND");

  // 7. DELETE /api/cart/items/:id -> Xóa món thành công
  const deleteRes = await fetch(`http://localhost:5000/api/cart/items/${cartItemId}`, {
    method: "DELETE",
    headers,
  });
  assert.equal(deleteRes.status, 200);
  const deleteJson = await deleteRes.json();
  assert.equal(deleteJson.success, true);
  assert.equal(deleteJson.data.cart.items.length, 0);
});

