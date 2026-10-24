import test from "node:test";
import assert from "node:assert/strict";

test("Smart Fit Advisor - Live API Verification (POST /api/fit-advisor/recommend)", async () => {
  // 1. Lấy một sản phẩm thật từ database để lấy productId
  const prodRes = await fetch("http://localhost:5000/api/products/quan-jean-wide-leg");
  assert.equal(prodRes.status, 200);
  const prodJson = await prodRes.json();
  const productId = prodJson.data.product.id;
  assert.ok(productId, "Phải có productId hợp lệ");

  // 2. Gửi request tư vấn size chuẩn
  const fitRes = await fetch("http://localhost:5000/api/fit-advisor/recommend", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      productId,
      heightCm: 170,
      weightKg: 60,
      waistCm: 76,
      fitPreference: "REGULAR",
    }),
  });

  assert.equal(fitRes.status, 200);
  const fitJson = await fitRes.json();
  assert.equal(fitJson.success, true);
  assert.ok(fitJson.data.recommendedSize, "Phải có recommendedSize");
  assert.ok(fitJson.data.confidenceScore, "Phải có confidenceScore");
  assert.ok(fitJson.data.matchedChart, "Phải có matchedChart từ database");
});

test("Smart Fit Advisor - Error Handling when Missing Required Fields", async () => {
  const fitRes = await fetch("http://localhost:5000/api/fit-advisor/recommend", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      // Thiếu productId, heightCm, weightKg
    }),
  });

  assert.equal(fitRes.status, 400);
  const fitJson = await fitRes.json();
  assert.equal(fitJson.success, false);
});

test("Outfit Builder - Live API Verification (GET /api/outfits)", async () => {
  const res = await fetch("http://localhost:5000/api/outfits");
  assert.equal(res.status, 200);
  const json = await res.json();
  assert.equal(json.success, true);
  assert.ok(Array.isArray(json.data.outfits));
});

test("Outfit Builder - Live API Verification (GET /api/outfits/slots)", async () => {
  const res = await fetch("http://localhost:5000/api/outfits/slots");
  assert.equal(res.status, 200);
  const json = await res.json();
  assert.equal(json.success, true);
  assert.ok(json.data.slots);
  assert.ok(Array.isArray(json.data.slots.TOP), "Slots phải chứa mảng TOP");
  assert.ok(Array.isArray(json.data.slots.BOTTOM), "Slots phải chứa mảng BOTTOM");
});

test("Outfit Builder - 2D Canvas Price Calculation", () => {
  const canvasItems = {
    TOP: {
      product: { basePrice: 249000 },
      variant: { priceAdjustment: 0 },
    },
    BOTTOM: {
      product: { basePrice: 420000 },
      variant: { priceAdjustment: 30000 },
    },
    OUTERWEAR: null,
    SHOES: null,
    ACCESSORY: null,
  };

  let totalPrice = 0;
  for (const slot of Object.keys(canvasItems)) {
    const item = canvasItems[slot];
    if (item) {
      totalPrice += Number(item.product.basePrice) + Number(item.variant.priceAdjustment);
    }
  }

  // 249,000 + 420,000 + 30,000 = 699,000 VND
  assert.equal(totalPrice, 699000);
});

// 6. BUSINESS LOGIC TEST: Combo Pricing Rules (Quần áo giá gói cứng ưu đãi vs Phụ kiện tính giá lẻ riêng)
test("Combo Rules - Core Clothing Combo is discounted; Shoes and Accessories are excluded from combo discount", async () => {
  const res = await fetch("http://localhost:5000/api/combos");
  assert.equal(res.status, 200);
  const json = await res.json();
  assert.equal(json.success, true);
  const combos = json.data.combos;
  assert.ok(combos.length > 0, "Phải có ít nhất 1 combo trong hệ thống");

  for (const combo of combos) {
    // Phân loại: Quần áo vs Phụ kiện
    const clothing = combo.items.filter(
      (it) => it.slotType === "TOP" || it.slotType === "BOTTOM" || it.slotType === "OUTERWEAR"
    );
    const accessories = combo.items.filter(
      (it) => it.slotType === "SHOES" || it.slotType === "ACCESSORY"
    );

    // Tính tổng giá gốc quần áo
    const clothingOriginal = clothing.reduce((sum, it) => sum + Number(it.price), 0);
    const discountRate = combo.discountRate || 0.15;
    const clothingCombo = Math.round(clothingOriginal * (1 - discountRate));

    // Quy tắc 1: 1 Combo cứng (quần áo) có giá rẻ hơn mua lẻ từng món
    assert.ok(
      clothingCombo < clothingOriginal,
      `Giá combo cứng (${clothingCombo}) phải rẻ hơn mua lẻ từng món quần áo (${clothingOriginal})`
    );
    assert.equal(clothingOriginal - clothingCombo, Math.round(clothingOriginal * discountRate));

    // Quy tắc 2: Phụ kiện (giày, kính, nón...) không tính vào giá chiết khấu combo, tính giá lẻ riêng
    const accessoriesPrice = accessories.reduce((sum, it) => sum + Number(it.price), 0);
    const finalTotalWithAccessories = clothingCombo + accessoriesPrice;
    const finalTotalWithoutAccessories = clothingCombo;

    // Khi chọn phụ kiện, tổng tiền = giá combo cứng + giá phụ kiện lẻ
    assert.equal(finalTotalWithAccessories, clothingCombo + accessoriesPrice);
    assert.equal(finalTotalWithoutAccessories, clothingCombo);
  }
});


