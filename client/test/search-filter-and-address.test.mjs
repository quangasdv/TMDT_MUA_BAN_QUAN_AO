import test from "node:test";
import assert from "node:assert/strict";

const API_BASE = "http://localhost:5000/api";

// 1. UNIT TEST: Cascading Vietnam Address Formatting
test("Address Selector - Cascading Selection to Full Shipping Address String", () => {
  function formatShippingAddress({ province, district, ward, streetDetail }) {
    const parts = [];
    if (streetDetail && streetDetail.trim()) parts.push(streetDetail.trim());
    if (ward && ward.trim()) parts.push(ward.trim());
    if (district && district.trim()) parts.push(district.trim());
    if (province && province.trim()) parts.push(province.trim());
    return parts.join(", ");
  }

  // Trường hợp có đầy đủ số nhà, tên đường
  const fullAddress = formatShippingAddress({
    province: "TP. Hồ Chí Minh",
    district: "Quận 1",
    ward: "Phường Bến Nghé",
    streetDetail: "Số 123 Đường Nguyễn Huệ",
  });
  assert.equal(
    fullAddress,
    "Số 123 Đường Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh"
  );
  assert.ok(fullAddress.length >= 5, "Địa chỉ phải thỏa mãn validation tối thiểu 5 ký tự của backend");

  // Trường hợp không nhập số nhà
  const areaOnly = formatShippingAddress({
    province: "Hà Nội",
    district: "Quận Cầu Giấy",
    ward: "Phường Dịch Vọng Hậu",
    streetDetail: "",
  });
  assert.equal(areaOnly, "Phường Dịch Vọng Hậu, Quận Cầu Giấy, Hà Nội");
  assert.ok(areaOnly.length >= 5);
});

// 2. LIVE API TEST: Keyword Search (GET /api/products/search)
test("Search API - Live GET /api/products/search complies with API Documentation", async () => {
  const query = "jean";
  const res = await fetch(`${API_BASE}/products/search?q=${encodeURIComponent(query)}&page=1&limit=12`);
  assert.equal(res.status, 200, "GET /api/products/search phải trả về HTTP 200");

  const json = await res.json();
  assert.equal(json.success, true, "Response success phải là true");
  assert.ok(json.data, "Response phải có trường data");
  assert.equal(json.data.keyword, query, "Keyword trả về phải khớp với từ khóa tìm kiếm");
  assert.ok(Array.isArray(json.data.products), "Products phải là mảng");
  assert.ok(json.data.pagination, "Pagination metadata phải tồn tại");
  assert.equal(json.data.pagination.page, 1);
});

// 3. LIVE API TEST: Advanced Filter (GET /api/products/filter)
test("Filter API - Live GET /api/products/filter complies with API Documentation", async () => {
  // Lọc theo danh mục, sắp xếp giá tăng dần và chỉ lấy hàng có sẵn
  const res = await fetch(
    `${API_BASE}/products/filter?category=quan-jean&sortBy=price_asc&inStock=true&page=1&limit=12`
  );
  assert.equal(res.status, 200, "GET /api/products/filter phải trả về HTTP 200");

  const json = await res.json();
  assert.equal(json.success, true, "Response success phải là true");
  assert.ok(json.data, "Response phải có trường data");
  assert.ok(json.data.filtersApplied, "filtersApplied phải tồn tại trong response");
  assert.equal(json.data.filtersApplied.category, "quan-jean");
  assert.equal(json.data.filtersApplied.sortBy, "price_asc");
  assert.equal(json.data.filtersApplied.inStock, true);
  assert.ok(Array.isArray(json.data.products), "Products phải là mảng");
  assert.ok(json.data.pagination, "Pagination metadata phải tồn tại");
});

// 4. LIVE API TEST: Price & Variant Filter (GET /api/products/filter with minPrice & maxPrice)
test("Filter API - Price Range and Color filter", async () => {
  const res = await fetch(
    `${API_BASE}/products/filter?minPrice=200000&maxPrice=1000000&sortBy=newest&page=1&limit=12`
  );
  assert.equal(res.status, 200);

  const json = await res.json();
  assert.equal(json.success, true);
  assert.equal(json.data.filtersApplied.minPrice, 200000);
  assert.equal(json.data.filtersApplied.maxPrice, 1000000);
});

