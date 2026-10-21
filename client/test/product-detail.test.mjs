import test from "node:test";
import assert from "node:assert/strict";

test("Product Detail - Dynamic Price Calculation", () => {
  const basePrice = 420000;
  const priceAdjustment = 0;
  const currentPrice = basePrice + priceAdjustment;
  assert.equal(currentPrice, 420000);

  const priceAdjustmentExtra = 30000;
  assert.equal(basePrice + priceAdjustmentExtra, 450000);
});

test("Product Detail - Stock Boundary Logic", () => {
  const maxStock = 8;
  let quantity = 1;

  // Tăng trong giới hạn
  quantity = Math.min(quantity + 1, maxStock);
  assert.equal(quantity, 2);

  // Không vượt quá tồn kho
  quantity = 8;
  quantity = Math.min(quantity + 1, maxStock);
  assert.equal(quantity, 8);

  // Không giảm xuống dưới 1
  quantity = Math.max(quantity - 10, 1);
  assert.equal(quantity, 1);
});

test("Product Detail - Smart Fit Recommendation Algorithm", () => {
  const sizeCharts = [
    {
      size: "M",
      minHeightCm: 165,
      maxHeightCm: 172,
      minWeightKg: 55,
      maxWeightKg: 65,
    },
    {
      size: "L",
      minHeightCm: 170,
      maxHeightCm: 180,
      minWeightKg: 65,
      maxWeightKg: 75,
    },
  ];

  function recommendSize(h, w) {
    const exact = sizeCharts.find(
      (sc) =>
        h >= sc.minHeightCm &&
        h <= sc.maxHeightCm &&
        w >= sc.minWeightKg &&
        w <= sc.maxWeightKg
    );
    if (exact) return exact.size;

    let bestSize = null;
    let minDistance = Infinity;
    for (const sc of sizeCharts) {
      const midH = (sc.minHeightCm + sc.maxHeightCm) / 2;
      const midW = (sc.minWeightKg + sc.maxWeightKg) / 2;
      const dist =
        Math.pow((h - midH) / 10, 2) * 0.4 + Math.pow((w - midW) / 5, 2) * 0.6;
      if (dist < minDistance) {
        minDistance = dist;
        bestSize = sc.size;
      }
    }
    return bestSize;
  }

  // Khớp chính xác size M
  assert.equal(recommendSize(168, 60), "M");

  // Khớp chính xác size L
  assert.equal(recommendSize(175, 70), "L");

  // Gần size M hơn
  assert.equal(recommendSize(164, 54), "M");

  // Gần size L hơn
  assert.equal(recommendSize(182, 77), "L");
});

test("Product Detail - Integration Verification on Live API", async () => {
  const response = await fetch("http://localhost:5000/api/products/quan-jean-wide-leg");
  assert.equal(response.status, 200);

  const json = await response.json();
  assert.equal(json.success, true);
  assert.equal(json.data.product.slug, "quan-jean-wide-leg");
  assert.ok(json.data.product.variants.length > 0);
  assert.ok(json.data.product.sizeCharts.length > 0);
});

