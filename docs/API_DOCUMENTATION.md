# TÀI LIỆU ĐẶC TẢ TÍCH HỢP API HỆ THỐNG TRENDYFIT (API SPECIFICATION)
> Tài liệu kỹ thuật bàn giao cho Frontend Team (Nguyễn Đăng Quang & Hoàng Đình Tân) để gọi API Backend.

---

## 1. Cấu hình Chung & Cơ Chế Lưu Trữ Token (Authentication & Storage)

* **Base URL:** `http://localhost:5000/api`
* **Content-Type:** `application/json`
* **Cơ chế lưu trữ Token (Trả lời chi tiết câu hỏi của Frontend):**
  1. **Access Token (Thời hạn ngắn - 15 phút):**
     - Được Backend trả về trong body JSON khi đăng nhập: `res.data.data.accessToken`.
     - **Vị trí lưu trữ phía FE:** Lưu trong **`localStorage`** (`localStorage.setItem("accessToken", accessToken)`).
     - **Cách gửi lên BE:** Đính kèm trong Header: `Authorization: Bearer <accessToken>` (file `client/src/api/axios.api.ts` đã cấu hình Interceptor tự động gắn).
  2. **Refresh Token (Thời hạn dài - 7 ngày):**
     - Được Backend tự động lưu vào **`HTTP-Only Cookie`** (tên cookie: `refreshToken`) để bảo mật tuyệt đối, chống tấn công XSS.
     - **Vị trí lưu trữ phía FE:** Trình duyệt tự động quản lý. **Code JavaScript phía FE KHÔNG CẦN và KHÔNG THỂ đọc/sửa cookie này**.
     - **Cách gửi lên BE:** Trình duyệt tự động đính kèm cookie mỗi khi gọi API làm mới token (`POST /api/auth/refresh`), chỉ cần Axios bật `withCredentials: true` (đã cấu hình sẵn).
  3. **Mã phiên khách vãng lai (Guest Session ID):**
     - Lưu trong **`localStorage`** (`trendyfit_session_id`) và tự động đính kèm qua header `x-session-id`. Khi khách đăng nhập, form login truyền `guestSessionId` lên để BE tự động gộp giỏ hàng.

---

## 2. Danh mục API Chi tiết

### 2.1. Xác thực & Tài khoản (`/api/auth`)

#### `POST /api/auth/register` - Đăng ký tài khoản mới
* **Ràng buộc kiểm tra dữ liệu (Validation Rules):**
  - **`password` (Mật khẩu):** Bắt buộc, **tối thiểu 6 ký tự** (`min(6)`). Không giới hạn độ dài tối đa, không ép buộc ký tự hoa hay ký tự đặc biệt (tuy nhiên khuyến nghị sử dụng mật khẩu an toàn).
  - **`email`:** Bắt buộc, đúng định dạng email tiêu chuẩn (`name@domain.com`).
  - **`fullName` (Họ và tên):** Bắt buộc, **tối thiểu 2 ký tự** (`min(2)`).
  - **`phone` (Số điện thoại):** Tùy chọn (không bắt buộc).
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

#### `GET /api/products/search` (hoặc alias: `GET /api/search`) - Tìm kiếm sản phẩm theo từ khóa (Keyword Search)
> **Mục đích:** Dành riêng cho ô tìm kiếm (Search Bar) trên Header hoặc trang Kết quả tìm kiếm. Tìm kiếm theo tên sản phẩm, mô tả hoặc tên danh mục (không phân biệt chữ hoa thường - ILIKE).
* **Query Params:**
  - `q`: Từ khóa tìm kiếm (Ví dụ: `blazer`, `áo thun`, `jean`)
  - `page`: Trang hiện tại (mặc định: `1`)
  - `limit`: Số lượng sản phẩm mỗi trang (mặc định: `12`)
* **Ví dụ gọi API:**
  - `GET /api/products/search?q=blazer`
  - `GET /api/search?q=quan+jean&page=1&limit=10`
* **Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "keyword": "blazer",
    "products": [
      {
        "id": "prod-1",
        "name": "Áo Blazer Form Rộng Streetwear TrendyFit",
        "slug": "ao-blazer-oversize-trendyfit",
        "basePrice": "590000",
        "category": { "id": "cat-1", "name": "Áo Khoác", "slug": "ao-khoac" },
        "variants": []
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 12,
      "total": 1,
      "totalPages": 1
    }
  }
}
```

#### `GET /api/products/filter` (hoặc alias: `GET /api/filter`) - Bộ lọc sản phẩm tổng hợp (Advanced Filter)
> **Mục đích:** Dành riêng cho Sidebar bộ lọc ở trang Danh mục / Cửa hàng. Hỗ trợ lọc theo mọi tiêu chí (danh mục, khoảng giá, màu sắc, kích cỡ, còn hàng, sắp xếp).
* **Query Params:**
  - `category`: Slug danh mục (Ví dụ: `ao-thun`, `quan-jean`, `ao-khoac`)
  - `categoryId`: ID danh mục (nếu FE dùng ID thay vì slug)
  - `minPrice`: Giá tối thiểu (VNĐ, ví dụ: `200000`)
  - `maxPrice`: Giá tối đa (VNĐ, ví dụ: `600000`)
  - `color`: Màu sắc (Ví dụ: `Đen` hoặc danh sách nhiều màu phân tách bằng dấu phẩy: `Đen,Trắng,Xanh Wash`)
  - `size`: Kích cỡ (Ví dụ: `M` hoặc danh sách nhiều size: `S,M,L,41`)
  - `inStock`: `true` hoặc `1` (Chỉ lấy các sản phẩm có số lượng tồn kho `stockQuantity > 0`)
  - `sortBy`: Tiêu chí sắp xếp:
    - `newest`: Mới nhất (mặc định)
    - `price_asc`: Giá tăng dần
    - `price_desc`: Giá giảm dần
    - `name_asc`: Tên A -> Z
  - `page`: Trang hiện tại (mặc định: `1`)
  - `limit`: Số sản phẩm mỗi trang (mặc định: `12`)
* **Ví dụ gọi API:**
  - `GET /api/products/filter?category=quan-jean&color=Xanh+Wash&inStock=true`
  - `GET /api/filter?minPrice=300000&maxPrice=700000&sortBy=price_asc`
* **Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "filtersApplied": {
      "category": "quan-jean",
      "minPrice": null,
      "maxPrice": null,
      "color": "Xanh Wash",
      "size": null,
      "inStock": true,
      "sortBy": "newest"
    },
    "products": [],
    "pagination": {
      "page": 1,
      "limit": 12,
      "total": 1,
      "totalPages": 1
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

#### `POST /api/checkout` (hoặc `POST /api/checkout/lock`) - Đặt hàng (Hỗ trợ QR PayOS & COD)
> **Mục đích:** Khách hàng tiến hành đặt hàng với giỏ hàng hiện tại. Hỗ trợ 2 phương thức: Quét mã QR PayOS (giữ kho 10 phút) hoặc Thanh toán khi nhận hàng COD (chuẩn bị đơn ngay).
* **Quy chuẩn thông tin:**
  - `recipientName`: Họ tên người nhận (tối thiểu 2 ký tự).
  - `recipientPhone`: Số điện thoại người nhận (cho phép nhập/sửa tự do, chuẩn định dạng 10 chữ số Việt Nam `^0[35789][0-9]{8}# TÀI LIỆU ĐẶC TẢ TÍCH HỢP API HỆ THỐNG TRENDYFIT (API SPECIFICATION)
> Tài liệu kỹ thuật bàn giao cho Frontend Team (Nguyễn Đăng Quang & Hoàng Đình Tân) để gọi API Backend.

---

## 1. Cấu hình Chung & Cơ Chế Lưu Trữ Token (Authentication & Storage)

* **Base URL:** `http://localhost:5000/api`
* **Content-Type:** `application/json`
* **Cơ chế lưu trữ Token (Trả lời chi tiết câu hỏi của Frontend):**
  1. **Access Token (Thời hạn ngắn - 15 phút):**
     - Được Backend trả về trong body JSON khi đăng nhập: `res.data.data.accessToken`.
     - **Vị trí lưu trữ phía FE:** Lưu trong **`localStorage`** (`localStorage.setItem("accessToken", accessToken)`).
     - **Cách gửi lên BE:** Đính kèm trong Header: `Authorization: Bearer <accessToken>` (file `client/src/api/axios.api.ts` đã cấu hình Interceptor tự động gắn).
  2. **Refresh Token (Thời hạn dài - 7 ngày):**
     - Được Backend tự động lưu vào **`HTTP-Only Cookie`** (tên cookie: `refreshToken`) để bảo mật tuyệt đối, chống tấn công XSS.
     - **Vị trí lưu trữ phía FE:** Trình duyệt tự động quản lý. **Code JavaScript phía FE KHÔNG CẦN và KHÔNG THỂ đọc/sửa cookie này**.
     - **Cách gửi lên BE:** Trình duyệt tự động đính kèm cookie mỗi khi gọi API làm mới token (`POST /api/auth/refresh`), chỉ cần Axios bật `withCredentials: true` (đã cấu hình sẵn).
  3. **Mã phiên khách vãng lai (Guest Session ID):**
     - Lưu trong **`localStorage`** (`trendyfit_session_id`) và tự động đính kèm qua header `x-session-id`. Khi khách đăng nhập, form login truyền `guestSessionId` lên để BE tự động gộp giỏ hàng.

---

## 2. Danh mục API Chi tiết

### 2.1. Xác thực & Tài khoản (`/api/auth`)

#### `POST /api/auth/register` - Đăng ký tài khoản mới
* **Ràng buộc kiểm tra dữ liệu (Validation Rules):**
  - **`password` (Mật khẩu):** Bắt buộc, **tối thiểu 6 ký tự** (`min(6)`). Không giới hạn độ dài tối đa, không ép buộc ký tự hoa hay ký tự đặc biệt (tuy nhiên khuyến nghị sử dụng mật khẩu an toàn).
  - **`email`:** Bắt buộc, đúng định dạng email tiêu chuẩn (`name@domain.com`).
  - **`fullName` (Họ và tên):** Bắt buộc, **tối thiểu 2 ký tự** (`min(2)`).
  - **`phone` (Số điện thoại):** Tùy chọn (không bắt buộc).
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

#### `GET /api/products/search` (hoặc alias: `GET /api/search`) - Tìm kiếm sản phẩm theo từ khóa (Keyword Search)
> **Mục đích:** Dành riêng cho ô tìm kiếm (Search Bar) trên Header hoặc trang Kết quả tìm kiếm. Tìm kiếm theo tên sản phẩm, mô tả hoặc tên danh mục (không phân biệt chữ hoa thường - ILIKE).
* **Query Params:**
  - `q`: Từ khóa tìm kiếm (Ví dụ: `blazer`, `áo thun`, `jean`)
  - `page`: Trang hiện tại (mặc định: `1`)
  - `limit`: Số lượng sản phẩm mỗi trang (mặc định: `12`)
* **Ví dụ gọi API:**
  - `GET /api/products/search?q=blazer`
  - `GET /api/search?q=quan+jean&page=1&limit=10`
* **Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "keyword": "blazer",
    "products": [
      {
        "id": "prod-1",
        "name": "Áo Blazer Form Rộng Streetwear TrendyFit",
        "slug": "ao-blazer-oversize-trendyfit",
        "basePrice": "590000",
        "category": { "id": "cat-1", "name": "Áo Khoác", "slug": "ao-khoac" },
        "variants": []
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 12,
      "total": 1,
      "totalPages": 1
    }
  }
}
```

#### `GET /api/products/filter` (hoặc alias: `GET /api/filter`) - Bộ lọc sản phẩm tổng hợp (Advanced Filter)
> **Mục đích:** Dành riêng cho Sidebar bộ lọc ở trang Danh mục / Cửa hàng. Hỗ trợ lọc theo mọi tiêu chí (danh mục, khoảng giá, màu sắc, kích cỡ, còn hàng, sắp xếp).
* **Query Params:**
  - `category`: Slug danh mục (Ví dụ: `ao-thun`, `quan-jean`, `ao-khoac`)
  - `categoryId`: ID danh mục (nếu FE dùng ID thay vì slug)
  - `minPrice`: Giá tối thiểu (VNĐ, ví dụ: `200000`)
  - `maxPrice`: Giá tối đa (VNĐ, ví dụ: `600000`)
  - `color`: Màu sắc (Ví dụ: `Đen` hoặc danh sách nhiều màu phân tách bằng dấu phẩy: `Đen,Trắng,Xanh Wash`)
  - `size`: Kích cỡ (Ví dụ: `M` hoặc danh sách nhiều size: `S,M,L,41`)
  - `inStock`: `true` hoặc `1` (Chỉ lấy các sản phẩm có số lượng tồn kho `stockQuantity > 0`)
  - `sortBy`: Tiêu chí sắp xếp:
    - `newest`: Mới nhất (mặc định)
    - `price_asc`: Giá tăng dần
    - `price_desc`: Giá giảm dần
    - `name_asc`: Tên A -> Z
  - `page`: Trang hiện tại (mặc định: `1`)
  - `limit`: Số sản phẩm mỗi trang (mặc định: `12`)
* **Ví dụ gọi API:**
  - `GET /api/products/filter?category=quan-jean&color=Xanh+Wash&inStock=true`
  - `GET /api/filter?minPrice=300000&maxPrice=700000&sortBy=price_asc`
* **Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "filtersApplied": {
      "category": "quan-jean",
      "minPrice": null,
      "maxPrice": null,
      "color": "Xanh Wash",
      "size": null,
      "inStock": true,
      "sortBy": "newest"
    },
    "products": [],
    "pagination": {
      "page": 1,
      "limit": 12,
      "total": 1,
      "totalPages": 1
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

).
  - `shippingAddress`: Địa chỉ giao hàng (tối thiểu 5 ký tự).
  - `paymentMethod`: `"QR"` (Mặc định - quét mã online) hoặc `"COD"` (Thanh toán khi nhận hàng).
  - `voucherCode`: Mã giảm giá (nếu có).
  - `items`: Danh sách biến thể mua (`variantId`, `quantity`).
* **Request Body (Ví dụ đơn COD):**
```json
{
  "recipientName": "Trần Văn An",
  "recipientPhone": "0912345678",
  "shippingAddress": "Số 123 Đường Nguyễn Huệ, Quận 1, TP.HCM",
  "paymentMethod": "COD", // "COD" hoặc "QR"
  "voucherCode": "TRENDY10",
  "items": [
    { "variantId": "var-1", "quantity": 1 }
  ]
}
```
* **Response cho COD (201 Created):**
```json
{
  "success": true,
  "message": "Đặt hàng thành công với hình thức Thanh toán khi nhận hàng (COD)! Đơn hàng đang được đóng gói chuẩn bị giao.",
  "data": {
    "order": {
      "id": "order-uuid",
      "orderCode": 654321,
      "totalAmount": "398000",
      "discountAmount": "39800",
      "finalAmount": "358200",
      "status": "PROCESSING", // Trực tiếp chuyển sang PROCESSING, kho đã trừ chính thức
      "paymentStatus": "UNPAID"
    },
    "paymentMethod": "COD",
    "isCod": true
  }
}
```
* **Response cho QR / Online (201 Created):**
```json
{
  "success": true,
  "message": "Đặt hàng thành công! Đơn hàng được giữ trong 10 phút để thanh toán.",
  "data": {
    "order": {
      "id": "order-uuid",
      "orderCode": 654322,
      "status": "PENDING_PAYMENT",
      "paymentStatus": "UNPAID"
    },
    "paymentMethod": "QR",
    "isCod": false,
    "lockDurationSeconds": 600
  }
}
```
* **Cơ chế tự động thanh toán COD:** Khi shipper giao hàng thành công, Admin/Staff chuyển trạng thái đơn sang `DELIVERED`, hệ thống Backend sẽ **tự động cập nhật `paymentStatus = "PAID"`** cho đơn COD.
* **Lưu ý mã lỗi:**
  - `409 Conflict`: Sản phẩm tạm thời hết hàng hoặc không đủ tồn kho.
  - `429 Too Many Requests`: Đang có 2 đơn hàng QR `PENDING_PAYMENT` chưa thanh toán.

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

### 2.8. Mua theo Combo / Set Thời Trang Ưu Đãi (`/api/combos` hoặc `/api/outfits`)
> **Mục đích:** Tính năng bán hàng theo Set đồ (Combo Áo + Quần). Khách hàng có thể xem từng món riêng lẻ hoặc bấm "Mua cả Set" để nhận mức giá ưu đãi tốt hơn mua lẻ từng món.

#### `GET /api/combos` (hoặc alias: `GET /api/outfits`) - Danh sách các Combo / Set thời trang
* **Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "combos": [
      {
        "id": "combo-uuid",
        "title": "Streetwear All-Black Layering",
        "description": "Phong cách đường phố cá tính với áo khoác blazer và quần jean ống suông",
        "bannerUrl": "https://...",
        "discountRate": 0.15,
        "discountPercent": 15,
        "originalPrice": 1010000, // Tổng giá nếu mua lẻ từng món
        "comboPrice": 858500,     // Giá ưu đãi khi mua trọn bộ combo
        "savedAmount": 151500,    // Số tiền tiết kiệm được
        "items": [
          {
            "id": "item-1",
            "slotType": "TOP", // Áo
            "productName": "Áo Blazer Oversize",
            "price": 590000,
            "imageUrl": "https://..."
          },
          {
            "id": "item-2",
            "slotType": "BOTTOM", // Quần
            "productName": "Quần Jean Ống Suông",
            "price": 420000,
            "imageUrl": "https://..."
          }
        ]
      }
    ]
  }
}
```

#### `GET /api/combos/:id` (hoặc alias: `GET /api/outfits/:id`) - Chi tiết Combo kèm chọn Biến thể
* **Response (200 OK):** Trả về đầy đủ thông tin combo và toàn bộ danh sách biến thể (màu sắc, size) của từng sản phẩm trong set, cho phép người dùng tùy chọn size Áo và size Quần trước khi thêm trọn bộ combo vào giỏ hàng.

#### `GET /api/outfits/slots` - Danh sách sản phẩm phân loại theo nhóm (Tương thích ngược)

---

### 2.9. Phân hệ Quản trị Admin Dashboard (`/api/admin`)
> **Phân quyền bảo mật (RBAC):**
> - **`STAFF` (Nhân viên vận hành & kho):** Chỉ được quản lý đơn hàng (`orders`), cập nhật trạng thái đơn hàng (`status`).
> - **`ADMIN` (Chủ shop/Quản trị viên):** Toàn quyền hệ thống: Quản lý đơn hàng, Quản lý sản phẩm, Quản lý Voucher, Quản lý Tài khoản nhân viên/khách hàng, và Báo cáo doanh thu tài chính.

#### 2.9.1. Quản lý Đơn hàng (Role: `ADMIN`, `STAFF`)
* `GET /api/admin/orders`: Danh sách đơn hàng toàn hệ thống (phân trang, lọc theo trạng thái).
* `PATCH /api/admin/orders/:id/status`: Chuyển trạng thái đơn hàng theo State Machine:
  - `PROCESSING` (Đang chuẩn bị hàng) $\rightarrow$ `SHIPPING` (Đang giao hàng) $\rightarrow$ `DELIVERED` (Đã giao hàng & tự động đánh dấu đã thanh toán cho đơn COD).
  - `CANCELLED`: Hủy đơn (nếu hủy đơn đang `PENDING_PAYMENT` hoặc `PROCESSING`, hệ thống tự động hoàn trả số lượng tồn kho).

#### 2.9.2. Quản lý Sản phẩm & Hình ảnh (Role: `ADMIN`)
* `GET /api/admin/products`: Danh sách sản phẩm (bao gồm cả sản phẩm đang ẩn).
* `POST /api/admin/products`: Thêm sản phẩm mới kèm các biến thể SKU (`variants`).
* `PUT /api/admin/products/:id`: Cập nhật thông tin sản phẩm, bao gồm **sửa link hình ảnh (`imageUrl` / `images`)** và danh sách biến thể (`variants`).
* `DELETE /api/admin/products/:id`: Ẩn sản phẩm khỏi cửa hàng (`isActive = false`).

#### 2.9.3. Quản lý Voucher & Giảm giá (Role: `ADMIN`)
* `GET /api/admin/vouchers`: Danh sách voucher.
* `POST /api/admin/vouchers`: Tạo voucher mới. **Ràng buộc:** Thời hạn `expiresAt` bắt buộc phải lớn hơn thời điểm hiện tại (chặn nhập năm đã qua).
* `PUT /api/admin/vouchers/:id`: **Cập nhật voucher** (cho phép sửa mức giảm, giá trị đơn tối thiểu, số lượt dùng, gia hạn ngày hết hạn `expiresAt`, kích hoạt/vô hiệu hóa `isActive`).
* `DELETE /api/admin/vouchers/:id`: Vô hiệu hóa voucher (`isActive = false`).

#### 2.9.4. Quản lý Tài khoản Khách hàng & Nhân viên (Role: `ADMIN`)
* `GET /api/admin/users`: Lấy danh sách tài khoản (hỗ trợ lọc theo `role = CUSTOMER | STAFF | ADMIN`, tìm kiếm `q` theo tên, email, SĐT, phân trang).
* `POST /api/admin/users`: **Tạo tài khoản mới** từ trang quản trị:
  - Request body: `{ "email", "password", "fullName", "phone", "role": "STAFF" | "CUSTOMER" | "ADMIN" }`
  - Ràng buộc bảo mật: Mật khẩu mã hóa bcrypt tối thiểu 6 ký tự, email duy nhất, SĐT chuẩn 10 chữ số Việt Nam.
* `PUT /api/admin/users/:id`: **Cập nhật tài khoản** (sửa họ tên, số điện thoại, đổi phân quyền `role`, đổi mật khẩu mới).

#### 2.9.5. Báo cáo Thống kê Doanh thu (Role: `ADMIN`)
* `GET /api/admin/stats`: Thống kê tổng doanh thu thực tế, số đơn hoàn tất, tổng người dùng, tổng sản phẩm đang mở bán.

---

## 3. Quy chuẩn Xử lý Lỗi & Mã HTTP (Error Handling for Frontend)

### 3.1. Cấu trúc JSON Lỗi Chuẩn (Standard Error Response Format)
Mọi phản hồi lỗi từ Backend đều trả về mã HTTP tương ứng ($\ge 400$) kèm cấu trúc JSON đồng nhất có trường **`errorCode`** để Frontend xử lý chính xác theo điều kiện logic:

```json
{
  "success": false,
  "errorCode": "INSUFFICIENT_STOCK", // Mã lỗi định danh dạng CHỮ HOA để FE phân nhánh UI
  "message": "Sản phẩm 'Áo Thun Oversize' chỉ còn lại 1 chiếc, không đủ số lượng.",
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

### 3.2. Bảng Danh Mục Mã Lỗi Định Danh (ErrorCode Reference for Frontend)

| Mã lỗi (`errorCode`) | Mã HTTP | Ý nghĩa nghiệp vụ | Gợi ý hành động phía Frontend (UI/UX) |
| :--- | :---: | :--- | :--- |
| **`AUTH_INVALID_CREDENTIALS`** | `401` | Sai tài khoản hoặc mật khẩu | Báo lỗi đỏ dưới ô password: *"Email hoặc mật khẩu không chính xác."* |
| **`AUTH_EMAIL_EXISTS`** | `400` | Email đăng ký đã tồn tại | Tô đỏ ô email, gợi ý đăng nhập |
| **`AUTH_UNAUTHORIZED`** | `401` | Chưa đăng nhập hoặc thiếu Bearer token | Chuyển hướng về `/login` hoặc mở modal đăng nhập |
| **`TOKEN_EXPIRED`** | `401` | Access token hết hạn | Tự động gọi `/api/auth/refresh` lấy token mới (interceptor đã làm sẵn) |
| **`FORBIDDEN_ACCESS`** | `403` | Không có quyền (vào admin hoặc IDOR) | Chặn truy cập, hiện trang 403 Forbidden |
| **`ORDER_PENDING_LIMIT_REACHED`** | `429` | Đang có $\ge 2$ đơn hàng chờ thanh toán | **Bật modal cảnh báo:** Nhắc khách vào xem đơn cũ để thanh toán hoặc chờ 10 phút |
| **`INSUFFICIENT_STOCK`** | `409` | **Hết hàng khi Checkout** | **Bật modal cảnh báo tồn kho:** Báo tên sản phẩm hết hàng, mở giỏ cho khách sửa |
| **`PRODUCT_INACTIVE`** | `400` | Sản phẩm đã bị Admin ẩn/ngừng kinh doanh | Báo sản phẩm ngừng kinh doanh, xóa khỏi giỏ |
| **`PRODUCT_NOT_FOUND`** | `404` | Không tìm thấy sản phẩm | Chuyển sang màn hình 404 Không tìm thấy |
| **`CART_INVALID_QUANTITY`** | `400` | Số lượng giỏ hàng không phải số nguyên dương | Reset ô số lượng về 1, hiện Toast cảnh báo |
| **`CART_ITEM_NOT_FOUND`** | `404` | Món đồ không tồn tại trong giỏ | Tự động làm mới lại danh sách giỏ hàng |
| **`VOUCHER_EXPIRED`** | `400` | Mã giảm giá đã hết hạn sử dụng | Hiện chữ đỏ dưới ô nhập voucher: *"Mã giảm giá đã hết hạn"* |
| **`VOUCHER_USAGE_LIMIT`** | `400` | Mã giảm giá đã hết lượt sử dụng | Hiện chữ đỏ: *"Mã giảm giá đã hết lượt dùng"* |
| **`VOUCHER_MIN_ORDER_VALUE`** | `400` | Đơn hàng chưa đủ giá trị tối thiểu | Báo số tiền còn thiếu để được áp dụng mã |
| **`VOUCHER_NOT_FOUND`** | `404` | Mã voucher không tồn tại | Báo mã không tồn tại |
| **`RATE_LIMIT_EXCEEDED`** | `429` | Bị khóa tạm thời do gửi request quá nhanh | Báo thử lại sau 1 phút, khóa nút bấm tạm thời |
| **`VALIDATION_ERROR`** | `400` | Sai định dạng Zod | Duyệt qua mảng `errors` để tô đỏ từng ô nhập tương ứng |
| **`INTERNAL_SERVER_ERROR`** | `500` | Lỗi máy chủ không mong muốn | Toast thông báo hệ thống đang bận |

---

### 3.3. Bảng Mã Trạng Thái HTTP & Kịch Bản Xử Lý Giao Diện (UI Action Guide)

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

### 3.4. Code mẫu Frontend bắt lỗi theo `errorCode` bằng Axios (Best Practice)

```typescript
try {
  const response = await baseAPI.post("/checkout/lock", orderPayload);
  toast.success("Đặt hàng thành công! Vui lòng thanh toán trong 10 phút.");
  router.push(`/checkout/payment/${response.data.data.order.orderCode}`);
} catch (error: any) {
  const errorCode = error.response?.data?.errorCode;
  const errorMsg = error.response?.data?.message || "Đã có lỗi xảy ra.";

  // Bắt lỗi chính xác theo errorCode của Backend:
  switch (errorCode) {
    case "INSUFFICIENT_STOCK":
      // Hết hàng: Mở modal cho khách chọn lại số lượng hoặc đổi sản phẩm
      setStockErrorModalOpen(true);
      break;

    case "ORDER_PENDING_LIMIT_REACHED":
      // Quá 2 đơn chờ thanh toán
      toast.warning(errorMsg);
      // Gợi ý chuyển sang trang danh sách đơn hàng để thanh toán đơn cũ
      router.push("/orders");
      break;

    case "AUTH_UNAUTHORIZED":
      toast.error("Vui lòng đăng nhập để tiến hành đặt hàng.");
      router.push("/login");
      break;

    case "VOUCHER_EXPIRED":
    case "VOUCHER_USAGE_LIMIT":
    case "VOUCHER_MIN_ORDER_VALUE":
      // Hiển thị lỗi voucher ngay dưới ô nhập
      setVoucherErrorMessage(errorMsg);
      break;

    case "RATE_LIMIT_EXCEEDED":
      toast.error("Thao tác quá nhanh, vui lòng chờ 1 phút rồi thử lại.");
      break;

    default:
      // Các lỗi khác hiển thị câu thông báo mặc định từ BE
      toast.error(errorMsg);
      break;
  }
}
```

