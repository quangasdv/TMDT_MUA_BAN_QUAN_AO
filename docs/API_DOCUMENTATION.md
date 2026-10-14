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

---

## 3. Quy chuẩn Xử lý Lỗi & Mã HTTP (Error Handling for Frontend)

### 3.1. Cấu trúc JSON Lỗi Chuẩn (Standard Error Response Format)
Mọi phản hồi lỗi từ Backend đều trả về mã HTTP tương ứng ($\ge 400$) kèm cấu trúc JSON đồng nhất:

```json
{
  "success": false,
  "message": "Nội dung thông báo lỗi cụ thể bằng Tiếng Việt hiển thị cho người dùng.",
  "errors": [
    // Chỉ xuất hiện khi lỗi kiểm tra dữ liệu đầu vào (Zod Validation)
    {
      "field": "recipientPhone",
      "message": "Số điện thoại người nhận không hợp lệ (10 chữ số)"
    }
  ]
}
```

---

### 3.2. Bảng Mã Trạng Thái HTTP & Kịch Bản Xử Lý Giao Diện (UI Action Guide)

| Mã HTTP Code | Ý nghĩa kỹ thuật | Các tình huống phát sinh | Cách xử lý giao diện phía Frontend (UI/UX) |
| :---: | :--- | :--- | :--- |
| **`400 Bad Request`** | Dữ liệu gửi lên không hợp lệ | - Sai định dạng Zod.<br>- Nhập số lượng âm/thập phân.<br>- Giá sản phẩm, tồn kho âm.<br>- Voucher hết hạn, chưa đạt giá trị tối thiểu. | Hiển thị **Toast đỏ (Error Notification)** chứa `res.data.message`. Nếu có mảng `errors`, tô đỏ viền ô input tương ứng (`border-red-500`) và hiển thị lỗi dưới chân ô nhập. |
| **`401 Unauthorized`** | Chưa đăng nhập hoặc Token hết hạn | - Chưa có header `Authorization: Bearer <token>`.<br>- Access token & Refresh token đều hết hạn.<br>- Đăng nhập sai mật khẩu hoặc sai email. | Tự động chuyển hướng (Redirect) về trang `/login` hoặc bật Popup Modal yêu cầu đăng nhập. Hiển thị Toast thông báo: *"Vui lòng đăng nhập để tiếp tục."* |
| **`403 Forbidden`** | Không đủ quyền hạn hoặc Vi phạm bảo mật (IDOR) | - Khách hàng cố tình truy cập trang Admin.<br>- Cố ý tạo link thanh toán cho đơn hàng của người khác.<br>- Gọi API test mock payment trên môi trường production. | Chặn hiển thị giao diện, hiển thị trang/màn hình **403 Không có quyền truy cập** hoặc Toast cảnh báo: *"Bạn không có quyền thực hiện hành động này!"* |
| **`404 Not Found`** | Không tìm thấy tài nguyên | - Sản phẩm không tồn tại hoặc đã bị Admin ẩn (`isActive = false`).<br>- Không tìm thấy mã đơn hàng `orderCode`.<br>- Không tìm thấy món trong giỏ để cập nhật/xóa. | Điều hướng sang trang **404 Not Found** hoặc Toast thông báo: *"Sản phẩm không còn kinh doanh hoặc đã bị xóa."* |
| **`409 Conflict`** | Xung đột tài nguyên / Hết hàng | - **Hết hàng khi Checkout:** Tồn kho sản phẩm không đủ đáp ứng số lượng đặt mua.<br>- Email đã được đăng ký trước đó. | Bật Dialog/Modal cảnh báo màu cam/đỏ: *"Rất tiếc! Một số sản phẩm trong giỏ đã hết hàng hoặc không đủ số lượng."*, gợi ý người dùng chỉnh sửa giỏ hàng. |
| **`429 Too Many Requests`** | Vượt quá giới hạn (Rate Limit / Anti-Spam) | - **Vượt quá 2 đơn chờ:** Khách hàng đang có 2 đơn `PENDING_PAYMENT` chưa thanh toán.<br>- Spam click đăng nhập quá 5 lần/phút.<br>- Spam request checkout quá 10 lần/phút. | Bật Dialog cảnh báo: *"Bạn đang có 2 đơn hàng chờ thanh toán. Vui lòng thanh toán đơn cũ hoặc chờ sau 10 phút!"*. Disable nút Đặt hàng tạm thời. |
| **`500 Internal Server Error`** | Lỗi máy chủ không mong muốn | - Mất kết nối database Supabase.<br>- Lỗi logic ngoại lệ chưa bắt được. | Toast đỏ: *"Hệ thống đang bận hoặc gián đoạn kết nối. Vui lòng thử lại sau ít phút!"* |

---

### 3.3. Chi tiết Kịch bản Lỗi theo từng Luồng Tính năng

#### A. Luồng Đăng nhập & Đăng ký (`/api/auth`)
* `400 Bad Request`: Mật khẩu dưới 6 ký tự, email sai định dạng.
* `401 Unauthorized`: *"Email hoặc mật khẩu không chính xác."*
* `409 Conflict`: *"Email này đã được sử dụng. Vui lòng đăng nhập hoặc dùng email khác."*
* `429 Too Many Requests`: *"Bạn đã thử đăng nhập quá nhiều lần. Vui lòng thử lại sau 1 phút."*

#### B. Luồng Giỏ hàng (`/api/cart`)
* `400 Bad Request`: *"Số lượng sản phẩm trong giỏ phải là số nguyên dương lớn hơn 0."*
* `404 Not Found`: *"Món hàng không tồn tại trong giỏ của bạn."* (FE tự động reload lại giỏ).

#### C. Luồng Áp dụng Mã giảm giá (`/api/vouchers/apply`)
* `400 Bad Request`:
  - *"Mã giảm giá không tồn tại hoặc đã bị vô hiệu hóa."*
  - *"Mã giảm giá đã hết hạn sử dụng."*
  - *"Mã giảm giá đã hết lượt sử dụng."*
  - *"Đơn hàng chưa đạt giá trị tối thiểu (tối thiểu {minOrderValue}đ)."*
  $\rightarrow$ FE hiển thị dòng chữ đỏ ngay bên dưới ô nhập mã voucher.

#### D. Luồng Đặt hàng & Khóa kho 10 phút (`/api/checkout/lock`)
* `401 Unauthorized`: Bắt buộc đăng nhập trước khi checkout.
* `400 Bad Request`:
  - *"Một số sản phẩm không tồn tại trong hệ thống."*
  - *"Một số sản phẩm không còn mở bán hoặc đã ngừng kinh doanh."*
* `409 Conflict`: *"Sản phẩm '{Tên sản phẩm}' chỉ còn lại {kho} chiếc, không đủ số lượng."*
* `429 Too Many Requests`: *"Bạn đang có 2 đơn hàng chờ thanh toán. Vui lòng thanh toán hoặc chờ hết hạn trước khi tạo đơn mới."*

#### E. Luồng Thanh toán VietQR & Mock (`/api/payments`)
* `403 Forbidden`: *"Bạn không có quyền thực hiện thanh toán cho đơn hàng của người khác."*
* `400 Bad Request`: *"Đơn hàng không ở trạng thái chờ thanh toán (Hiện tại: {status})."*
* `400 Bad Request` (Mock simulate): *"Mã đơn hàng không hợp lệ hoặc đã thanh toán thành công."*

---

### 3.4. Code mẫu Frontend bắt lỗi bằng Axios (Axios Catch Pattern)

```typescript
try {
  const response = await baseAPI.post("/checkout/lock", orderPayload);
  toast.success("Đặt hàng thành công! Vui lòng thanh toán trong 10 phút.");
  router.push(`/checkout/payment/${response.data.data.order.orderCode}`);
} catch (error: any) {
  const statusCode = error.response?.status;
  const errorMsg = error.response?.data?.message || "Đã có lỗi xảy ra.";

  switch (statusCode) {
    case 409:
      // Xung đột kho: Hết hàng
      toast.error(errorMsg);
      // Mở modal cho khách chỉnh sửa lại số lượng
      break;
    case 429:
      // Quá 2 đơn pending hoặc spam
      toast.warning(errorMsg);
      break;
    case 401:
      // Chưa đăng nhập
      toast.error("Vui lòng đăng nhập để tiến hành đặt hàng.");
      router.push("/login");
      break;
    case 400:
      // Lỗi dữ liệu nhập hoặc form
      toast.error(errorMsg);
      break;
    default:
      toast.error("Hệ thống gián đoạn, vui lòng thử lại sau.");
      break;
  }
}
```

