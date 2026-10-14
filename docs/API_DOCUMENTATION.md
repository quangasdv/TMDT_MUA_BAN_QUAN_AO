# TÀI LIỆU ĐẶC TẢ TÍCH HỢP API HỆ THỐNG TRENDYFIT (API SPECIFICATION)
> Tài liệu kỹ thuật bàn giao cho Frontend Team (Nguyễn Đăng Quang & Hoàng Đình Tân) để gọi API Backend.

---

## 1. Cấu hình Chung (General Configuration)

* **Base URL:** `http://localhost:5000/api`
* **Content-Type:** `application/json`
* **Quy ước Xác thực & Session (Axios đã cấu hình sẵn tại `client/src/api/axios.api.ts`):**
  - **Đã đăng nhập:** Gửi kèm header `Authorization: Bearer <accessToken>` (lấy từ `localStorage.getItem("accessToken")`).
  - **Khách vãng lai (Guest Cart):** Gửi kèm header `x-session-id: <sessionId>` (tự sinh và lưu trong `localStorage`).
  - **Làm mới Token (Refresh Token):** Tự động xử lý ngầm qua HTTP-Only Cookie khi gặp mã `401 Unauthorized`.

---

## 2. Danh mục API Chi tiết

### 2.1. Xác thực & Tài khoản (`/api/auth`)

#### `POST /api/auth/register` - Đăng ký tài khoản mới
* **Request Body:**
```json
{
  "email": "customer@gmail.com",
  "password": "Password@123",
  "fullName": "Nguyễn Văn Khách Hàng",
  "phone": "0988888888" // Không bắt buộc
}
```
* **Response (201 Created):**
```json
{
  "success": true,
  "message": "Đăng ký tài khoản thành công!",
  "data": {
    "user": {
      "id": "c7a8...",
      "email": "customer@gmail.com",
      "fullName": "Nguyễn Văn Khách Hàng",
      "role": "CUSTOMER"
    }
  }
}
```

#### `POST /api/auth/login` - Đăng nhập
* **Request Body (Hỗ trợ Gộp giỏ hàng khách vãng lai):**
```json
{
  "email": "customer@gmail.com",
  "password": "Password@123",
  "guestSessionId": "guest_abc123" // Nếu truyền, hệ thống sẽ tự động gộp giỏ hàng guest vào tài khoản user
}
```
* **Response (200 OK):**
```json
{
  "success": true,
  "message": "Đăng nhập thành công!",
  "data": {
    "user": {
      "id": "c7a8...",
      "email": "customer@gmail.com",
      "fullName": "Nguyễn Văn Khách Hàng",
      "role": "CUSTOMER"
    },
    "accessToken": "eyJhbGciOi..."
  }
}
```

#### `POST /api/auth/refresh` - Làm mới Access Token
* **Request:** Không cần body, trình duyệt tự gửi HTTP-Only cookie `refreshToken`.
* **Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOi..."
  }
}
```

#### `POST /api/auth/logout` - Đăng xuất
* **Headers:** `Authorization: Bearer <accessToken>`
* **Response (200 OK):**
```json
{
  "success": true,
  "message": "Đăng xuất thành công!"
}
```

#### `GET /api/auth/me` - Lấy thông tin tài khoản đang đăng nhập
* **Headers:** `Authorization: Bearer <accessToken>`
* **Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "c7a8...",
      "email": "customer@gmail.com",
      "fullName": "Nguyễn Văn Khách Hàng",
      "role": "CUSTOMER",
      "phone": "0988888888"
    }
  }
}
```

---

### 2.2. Sản phẩm & Danh mục Storefront (`/api`)

#### `GET /api/categories` - Danh sách danh mục
* **Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "categories": [
      { "id": "cat-1", "name": "Áo Thun & Sơ Mi", "slug": "ao-thun", "children": [] },
      { "id": "cat-2", "name": "Quần Jean & Kaki", "slug": "quan-jean", "children": [] }
    ]
  }
}
```

#### `GET /api/products` - Lấy danh sách sản phẩm (có lọc & phân trang)
* **Query Params:**
  - `q`: Từ khóa tìm kiếm theo tên hoặc mô tả
  - `categoryId`: Lọc theo danh mục
  - `minPrice`, `maxPrice`: Khoảng giá cơ bản
  - `color`: Màu sắc (ví dụ: `BLACK`, `WHITE`)
  - `size`: Kích thước (ví dụ: `M`, `L`, `XL`)
  - `page`: Trang hiện tại (mặc định: `1`)
  - `limit`: Số món mỗi trang (mặc định: `12`)
* **Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "products": [
      {
        "id": "prod-1",
        "name": "Áo Thun Basic Unisex TrendyFit",
        "slug": "ao-thun-basic-unisex",
        "basePrice": "199000",
        "images": ["https://images.unsplash.com/..."],
        "category": { "name": "Áo Thun & Sơ Mi" },
        "variants": [
          { "id": "var-1", "size": "M", "color": "BLACK", "stockQuantity": 50, "priceAdjustment": "0" }
        ]
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 12,
      "total": 35,
      "totalPages": 3
    }
  }
}
```

#### `GET /api/products/:slug` - Chi tiết sản phẩm theo Slug
* **Params:** `slug` (ví dụ: `ao-thun-basic-unisex`)
* **Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "product": {
      "id": "prod-1",
      "name": "Áo Thun Basic Unisex TrendyFit",
      "slug": "ao-thun-basic-unisex",
      "basePrice": "199000",
      "description": "Chất liệu cotton 100% thoáng mát...",
      "images": ["url1", "url2"],
      "isActive": true,
      "category": { "id": "cat-1", "name": "Áo Thun & Sơ Mi" },
      "variants": [
        { "id": "var-1", "sku": "AT-M-BLK", "size": "M", "color": "BLACK", "stockQuantity": 50, "priceAdjustment": "0" },
        { "id": "var-2", "sku": "AT-L-BLK", "size": "L", "color": "BLACK", "stockQuantity": 30, "priceAdjustment": "0" }
      ],
      "sizeCharts": [
        { "size": "M", "minHeight": 160, "maxHeight": 170, "minWeight": 50, "maxWeight": 65 },
        { "size": "L", "minHeight": 170, "maxHeight": 180, "minWeight": 65, "maxWeight": 78 }
      ]
    }
  }
}
```

---

### 2.3. Giỏ hàng Storefront (`/api/cart`)
> **Lưu ý:** Hỗ trợ cả khách đăng nhập (`Authorization`) và khách vãng lai (`x-session-id`).

#### `GET /api/cart` - Lấy thông tin giỏ hàng hiện tại
* **Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "cart": {
      "id": "cart-123",
      "items": [
        {
          "id": "item-1",
          "variantId": "var-1",
          "quantity": 2,
          "variant": {
            "id": "var-1",
            "size": "M",
            "color": "BLACK",
            "stockQuantity": 50,
            "priceAdjustment": "0",
            "product": {
              "id": "prod-1",
              "name": "Áo Thun Basic Unisex",
              "slug": "ao-thun-basic-unisex",
              "basePrice": "199000",
              "images": ["url1"]
            }
          }
        }
      ]
    }
  }
}
```

#### `POST /api/cart/items` - Thêm sản phẩm vào giỏ
* **Request Body:**
```json
{
  "variantId": "var-1",
  "quantity": 1
}
```
* **Response (200 OK / 201 Created):**
```json
{
  "success": true,
  "message": "Đã thêm sản phẩm vào giỏ hàng!",
  "data": {
    "cartItem": { "id": "item-1", "variantId": "var-1", "quantity": 1 }
  }
}
```

#### `PATCH /api/cart/items/:id` - Cập nhật số lượng món trong giỏ
* **Params:** `id` (mã ID của `cartItem`)
* **Request Body:**
```json
{
  "quantity": 3 // Nếu truyền = 0 -> hệ thống tự động xóa món này khỏi giỏ
}
```
* **Response (200 OK):**
```json
{
  "success": true,
  "message": "Cập nhật số lượng thành công!",
  "data": { "cartItem": { "id": "item-1", "quantity": 3 } }
}
```

#### `DELETE /api/cart/items/:id` - Xóa món khỏi giỏ
* **Params:** `id` (mã ID của `cartItem`)
* **Response (200 OK):**
```json
{
  "success": true,
  "message": "Đã xóa sản phẩm khỏi giỏ hàng."
}
```

---

### 2.4. Mã giảm giá (`/api/vouchers`)

#### `POST /api/vouchers/apply` - Kiểm tra và xem trước số tiền giảm
* **Request Body:**
```json
{
  "code": "TRENDY10",
  "orderTotal": 500000
}
```
* **Response (200 OK):**
```json
{
  "success": true,
  "message": "Áp dụng mã giảm giá thành công!",
  "data": {
    "voucher": {
      "id": "vouch-1",
      "code": "TRENDY10",
      "discountType": "PERCENT",
      "discountValue": 10
    },
    "discountAmount": 50000,
    "finalTotal": 450000
  }
}
```

---

### 2.5. Đặt hàng & Khóa kho Atomic (`/api/checkout`)
> **Bắt buộc đăng nhập:** Header `Authorization: Bearer <accessToken>`.

#### `POST /api/checkout/lock` - Tạo đơn & Khóa giữ kho 10 phút
* **Request Body:**
```json
{
  "recipientName": "Trần Văn An",
  "recipientPhone": "0912345678",
  "shippingAddress": "Số 123 Đường Nguyễn Huệ, Quận 1, TP.HCM",
  "voucherCode": "TRENDY10", // Không bắt buộc
  "items": [
    { "variantId": "var-1", "quantity": 2 }
  ]
}
```
* **Response (201 Created):**
```json
{
  "success": true,
  "message": "Đặt hàng thành công! Đơn hàng được giữ trong 10 phút để thanh toán.",
  "data": {
    "order": {
      "id": "order-uuid",
      "orderCode": 654321,
      "totalAmount": "398000",
      "discountAmount": "39800",
      "finalAmount": "358200",
      "status": "PENDING_PAYMENT",
      "paymentStatus": "UNPAID"
    },
    "lockDurationSeconds": 600
  }
}
```
* **Lưu ý mã lỗi:**
  - `409 Conflict`: Sản phẩm đã hết hàng.
  - `429 Too Many Requests`: Khách hàng đang có 2 đơn hàng `PENDING_PAYMENT` chưa thanh toán.

#### `GET /api/orders` - Danh sách đơn hàng của tôi
* **Response (200 OK):** Danh sách các đơn hàng của user kèm trạng thái thanh toán và sản phẩm.

#### `GET /api/orders/:code` - Chi tiết đơn hàng theo orderCode (6 số)
* **Params:** `code` (ví dụ: `654321`)
* **Response (200 OK):** Thông tin đầy đủ đơn hàng để hiển thị màn hình Tracking hoặc thanh toán lại.

---

### 2.6. Thanh toán VietQR & Giả lập Mock (`/api/payments`)

#### `POST /api/payments/create-qr` - Lấy thông tin VietQR thanh toán
* **Request Body:**
```json
{
  "orderCode": 654321
}
```
* **Response (200 OK):**
```json
{
  "success": true,
  "message": "Tạo thông tin thanh toán thành công.",
  "data": {
    "orderCode": 654321,
    "amount": 358200,
    "vietQrUrl": "https://img.vietqr.io/image/970422-0987654321-compact2.png?amount=358200&addInfo=TRENDYFIT%20654321&accountName=CONG%20TY%20CP%20TRENDYFIT",
    "isMockMode": true
  }
}
```

#### `POST /api/payments/mock-simulate` - Kích hoạt Thanh toán giả lập (Phục vụ Demo)
> **Bảo mật:** Chỉ hoạt động khi `PAYMENT_MOCK_MODE=true` và phải là chủ sở hữu đơn hàng. Tự động ký HMAC-SHA256 chuẩn PayOS.
* **Request Body:**
```json
{
  "orderCode": 654321
}
```
* **Response (200 OK):**
```json
{
  "success": true,
  "message": "Giả lập thanh toán thành công qua Mock Payment Engine (HMAC-SHA256 verified)!",
  "data": {
    "success": true,
    "message": "Thanh toán thành công đơn hàng #654321."
  }
}
```

---

### 2.7. Thuật toán Smart Fit Advisor (`/api/fit-advisor`)

#### `POST /api/fit-advisor/recommend` - Gợi ý Size quần áo thông minh
* **Request Body:**
```json
{
  "productId": "prod-1",
  "height": 172, // Chiều cao (cm) - Bắt buộc
  "weight": 68,  // Cân nặng (kg) - Bắt buộc
  "chest": 94,   // Vòng ngực (cm) - Tùy chọn
  "waist": 80,   // Vòng eo (cm) - Tùy chọn
  "hips": 96,    // Vòng mông (cm) - Tùy chọn
  "fitPreference": "REGULAR" // "TIGHT" (ôm sát) | "REGULAR" (vừa vặn) | "LOOSE" (rộng rãi)
}
```
* **Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "recommendedSize": "L",
    "fitScore": 92,
    "fitScorePercentage": 92,
    "advice": "Size L là lựa chọn lý tưởng nhất cho số đo của bạn (khớp 92%). Form áo sẽ mặc vừa vặn, thoải mái cử động.",
    "preference": "REGULAR",
    "confidenceLevel": "HIGH"
  }
}
```

---

### 2.8. Phòng phối đồ Outfit Builder Canvas 2D (`/api/outfits`)

#### `GET /api/outfits` - Danh sách các Set đồ phối sẵn
* **Response (200 OK):** Trả về các set đồ với danh sách items, tổng giá gốc và giá combo sau khi giảm 15%.

#### `GET /api/outfits/slots` - Danh sách sản phẩm phân theo Slot phối đồ 2D
* **Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "slots": {
      "TOP": [ /* Các sản phẩm áo */ ],
      "BOTTOM": [ /* Các sản phẩm quần */ ],
      "OUTERWEAR": [ /* Áo khoác */ ],
      "SHOES": [ /* Giày */ ],
      "ACCESSORY": [ /* Phụ kiện */ ]
    }
  }
}
```

---

### 2.9. Phân hệ Quản trị Admin Dashboard (`/api/admin`)
> **Yêu cầu:** Token có vai trò `ADMIN` hoặc `STAFF`.

* `GET /api/admin/stats` (Role: `ADMIN`): Thống kê tổng doanh thu, số đơn hàng, số sản phẩm, khách hàng.
* `GET /api/admin/orders` (Role: `ADMIN`, `STAFF`): Danh sách toàn bộ đơn hàng của cửa hàng.
* `PATCH /api/admin/orders/:id/status` (Role: `ADMIN`, `STAFF`): Cập nhật trạng thái đơn (`PROCESSING`, `SHIPPING`, `DELIVERED`, `CANCELLED`).
* `GET /api/admin/products` (Role: `ADMIN`): Danh sách tất cả sản phẩm (bao gồm cả sản phẩm ẩn).
* `POST /api/admin/products` (Role: `ADMIN`): Tạo sản phẩm mới kèm danh sách biến thể.
* `PUT /api/admin/products/:id` (Role: `ADMIN`): Cập nhật thông tin sản phẩm.
* `DELETE /api/admin/products/:id` (Role: `ADMIN`): Ẩn sản phẩm (`isActive = false`).
* `GET /api/admin/vouchers` (Role: `ADMIN`): Danh sách mã giảm giá.
* `POST /api/admin/vouchers` (Role: `ADMIN`): Tạo voucher mới.
