# BẢNG THEO DÕI VÀ ĐIỀU PHỐI TÍCH HỢP API (API INTEGRATION & VERIFICATION TRACKER)

> **Dự án:** TrendyFit - Nền tảng TMĐT Thời trang B2C Headless Commerce  
> **Tài liệu tham chiếu:** [`docs/API_DOCUMENTATION.md`](./API_DOCUMENTATION.md), [`client/.agent/rule/architecture-guide.md`](../client/.agent/rule/architecture-guide.md), [`docs/threat-model.md`](./threat-model.md), [`docs/trendyfit_postman_collection.json`](./trendyfit_postman_collection.json)  
> **Cập nhật lần cuối:** 20/10/2026  
> **Base URL:** `http://localhost:5000/api`

---

## 1. Bảng Tổng quan Định lượng (Summary Metrics)

| Chỉ số                                           |  Số lượng   | Tỷ lệ (%) | Ghi chú                                                               |
| :----------------------------------------------- | :---------: | :-------: | :-------------------------------------------------------------------- |
| **Tổng số API định nghĩa trong Spec**            |   **31**    | **100%**  | Toàn bộ các route được liệt kê trong `API_DOCUMENTATION.md`           |
| ├── API phục vụ Giao diện Storefront             |     18      |   58.1%   | Khách hàng mua sắm, thử đồ, giỏ hàng, thanh toán                      |
| ├── API phục vụ Quản trị Admin/Staff             |     11      |   35.5%   | Dashboard thống kê, quản lý đơn hàng, sản phẩm, voucher               |
| └── API Backend/Hạ tầng/Webhook                  |      2      |   6.4%    | Webhook PayOS (không gọi từ FE) & Silent Refresh Token                |
| **Backend Readiness (Code backend đã sẵn sàng)** | **31 / 31** | **100%**  | Controller, Service, Route, Prisma Schema đã hoàn thiện               |
| **API đã được kiểm thử thành công (Tested)**     | **31 / 31** | **100%**  | Đã verify qua Postman Collection, Seed Data và 07 Ca kiểm thử Bảo mật |
| **API ĐÃ ĐƯỢC GỌI TRONG CODE FRONTEND**          | **15 / 31** | **48.4%** | Đã hoàn thiện Batch 1 (Auth), Batch 2 (Catalog), Batch 3 (Cart), Batch 4 (Fit Advisor & Outfits) |
| **API CHƯA ĐƯỢC GỌI TRONG CODE FRONTEND**        | **15 / 31** | **48.4%** | Voucher, Checkout & Payments (Batch 5), Admin (Batch 6) |
| **API Backend-Only (Tuyệt đối không gọi từ FE)** | **1 / 31**  | **3.2%**  | `POST /api/payments/webhook` (Cổng PayOS gọi vào)                     |

---

## 2. Quy ước Ký hiệu & Trạng thái

- **Đã kiểm thử thành công (BE Tested):**
  - `[x] Postman`: Đã có trong bộ sưu tập [`docs/trendyfit_postman_collection.json`](./trendyfit_postman_collection.json).
  - `[x] Security TC`: Đã được kiểm thử vượt qua các ca kiểm thử bảo mật khắt khe trong [`docs/threat-model.md`](./threat-model.md) (TC-01 đến TC-07).
  - `[x] Script Demo`: Đã có kịch bản chạy thử nghiệm thực tế trong [`docs/DEMO_SCRIPT.md`](./DEMO_SCRIPT.md).
- **Đã gọi trong code FE (Called in FE):**
  - `Có`: Đã có dòng code gọi API trực tiếp trong thư mục `client/src/`.
  - `Chưa`: Chưa xuất hiện lệnh gọi nào trong `client/src/`.
- **Trạng thái Tích hợp FE (FE Integration Status):**
  - <span style="color:green;font-weight:bold;">HOÀN THÀNH</span>: Đã có API, Hook, Validation, Style, Page và tuân thủ đúng `architecture-guide.md`.
  - <span style="color:orange;font-weight:bold;">CẦN CHUẨN HÓA</span>: Đã gọi trong FE nhưng viết inline, chưa tách tầng hoặc chưa đúng chuẩn kiến trúc.
  - <span style="color:red;font-weight:bold;">CHƯA TÍCH HỢP</span>: Chưa viết code tích hợp trên Frontend.
  - <span style="color:gray;font-weight:bold;">BACKEND ONLY</span>: Endpoint dành riêng cho bên thứ 3/Backend, FE không được gọi.

---

## 3. Bảng Chi tiết Trạng thái Thực tế & Phụ thuộc của 31 API Endpoints

### 3.1. Phân hệ Xác thực & Tài khoản (`/api/auth`)

|  STT  | Phương thức & Endpoint    |        Quyền hạn         |        Đã kiểm thử thành công?         | Đã gọi trong code FE? |                         Trạng thái FE                         | Vị trí file trong Frontend                                                                                                                                                                                                               | Phụ thuộc & Trạng thái nghiệm thu                                                                                                                                                     |
| :---: | :------------------------ | :----------------------: | :------------------------------------: | :-------------------: | :-----------------------------------------------------------: | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **1** | `POST /api/auth/register` |          Public          |      [x] Postman<br>[x] Seed Data      |        **Có**         | <span style="color:green;font-weight:bold;">HOÀN THÀNH</span> | `client/src/app/(auth-layout)/register/api/register.api.ts`<br>`client/src/app/(auth-layout)/register/hooks/use-register.ts`<br>`client/src/app/(auth-layout)/register/page.tsx`                                                      | Đã hoàn thiện: Zod validation, TanStack Query mutation, bắt mã lỗi `AUTH_EMAIL_EXISTS`, `VALIDATION_ERROR`, toast notification, đã gỡ bỏ bọc thẻ `<AuthLayout>` trùng lặp              |
| **2** | `POST /api/auth/login`    |          Public          | [x] Postman<br>[x] TC-05a (Rate Limit) |        **Có**         | <span style="color:green;font-weight:bold;">HOÀN THÀNH</span> | `client/src/app/(auth-layout)/login/api/login.api.ts`<br>`client/src/app/(auth-layout)/login/hooks/use-login.ts`<br>`client/src/app/(auth-layout)/login/validation/login.validation.ts`<br>`client/src/app/(auth-layout)/login/page.tsx` | Đã hoàn thiện: Tách 5 tầng kiến trúc chuẩn, truyền `guestSessionId`, đồng bộ `authStore`, bắt mã `AUTH_INVALID_CREDENTIALS`, `RATE_LIMIT_EXCEEDED`, gỡ text "nếp", bọc `<Suspense>` |
| **3** | `POST /api/auth/refresh`  | Public (HttpOnly Cookie) |  [x] Postman<br>[x] Interceptor Test   |        **Có**         | <span style="color:green;font-weight:bold;">HOÀN THÀNH</span> | `client/src/api/axios.api.ts` (Response Interceptor Queue)<br>`client/src/api/auth.api.ts` (`refreshApi`)                                                                                                                                | Đã hoàn thiện: Request queue (`failedQueue`), khóa `isRefreshing`, chặn vô hạn loop với `_retry` và blacklist route auth, phát sự kiện `auth:expired` khi refresh fail                 |
| **4** | `POST /api/auth/logout`   |       Bearer Token       |           [x] Backend Ready            |        **Có**         | <span style="color:green;font-weight:bold;">HOÀN THÀNH</span> | `client/src/api/auth.api.ts` (`logoutApi`)<br>`client/src/stores/auth.store.ts` (`logout`)<br>`client/src/app/page.tsx`                                                                                                                 | Đã hoàn thiện: Gọi API BE xóa HttpOnly Cookie, xóa sạch `accessToken` và `user` trong localStorage, cập nhật reactive state sang unauthenticated, gắn nút UI trang chủ                  |
| **5** | `GET /api/auth/me`        |       Bearer Token       |     [x] Postman<br>[x] Demo Script     |        **Có**         | <span style="color:green;font-weight:bold;">HOÀN THÀNH</span> | `client/src/api/auth.api.ts` (`getMeApi`)<br>`client/src/stores/auth.store.ts` (`initializeAuth`)<br>`client/src/providers/auth-provider.tsx`<br>`client/src/app/page.tsx`                                                             | Đã hoàn thiện: Tự động gọi re-hydrate session người dùng và role khi F5 trang, cung cấp nút UI test trực tiếp tại trang chủ                                                             |

---

### 3.2. Phân hệ Sản phẩm & Danh mục Storefront (`/api`)

|  STT  | Phương thức & Endpoint                                                                                      | Quyền hạn |       Đã kiểm thử thành công?        | Đã gọi trong code FE? |                         Trạng thái FE                          | Vị trí file trong Frontend                                                                                                                                                                          | Phụ thuộc & Trạng thái nghiệm thu                                                                                                                                                             |
| :---: | :---------------------------------------------------------------------------------------------------------- | :-------: | :----------------------------------: | :-------------------: | :------------------------------------------------------------: | :------------------------------------------------------------------------------------------------------------------------------------------------------------------ | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **6** | `GET /api/categories`                                                                                       |  Public   |     [x] Postman<br>[x] Seed Data     |        **Có**         | <span style="color:green;font-weight:bold;">HOÀN THÀNH</span> | `client/src/api/products.api.ts`<br>`client/components/storefront/header.tsx`<br>`client/src/app/(storefront)/page.tsx`<br>`client/src/app/(storefront)/products/page.tsx`     | Đã hoàn thiện: Gọi lấy danh mục nạp Header Nav, Mobile Menu, Showcase Trang chủ, và Bộ lọc Sidebar Catalog (`/products`)                                                                     |
| **7** | `GET /api/products` _(Params: `q`, `category`, `minPrice`, `maxPrice`, `color`, `size`, `page`, `limit`)_   |  Public   | [x] Postman<br>[x] TC-04 (SQLi Test) |        **Có**         | <span style="color:green;font-weight:bold;">HOÀN THÀNH</span> | `client/src/api/products.api.ts`<br>`client/src/app/(storefront)/page.tsx`<br>`client/src/app/(storefront)/products/hooks/use-products.ts`<br>`client/src/app/(storefront)/products/page.tsx` | Đã hoàn thiện: Lọc theo danh mục, giá, màu sắc, size, tìm kiếm từ khóa `q`, phân trang, đồng bộ URL SearchParams, ProductCard, Skeleton, Empty và Error retry                               |
| **8** | `GET /api/products/:slug`                                                                                   |  Public   |    [x] Postman<br>[x] Demo Script    |        **Có**         | <span style="color:green;font-weight:bold;">HOÀN THÀNH</span> | `client/src/api/products.api.ts`<br>`client/src/app/(storefront)/products/[slug]/hooks/use-product-detail.ts`<br>`client/src/app/(storefront)/products/[slug]/page.tsx`           | Đã hoàn thiện: Gallery ảnh, chọn biến thể màu sắc & size, giá động theo biến thể, kiểm tra tồn kho vô hiệu hóa tùy chọn, Bảng thông số Size Chart, Modal xem bảng quy đổi kích cỡ chi tiết |

---

### 3.3. Phân hệ Giỏ hàng Storefront (`/api/cart`)

|  STT   | Phương thức & Endpoint                                   |           Quyền hạn           |                       Đã kiểm thử thành công?                       | Đã gọi trong code FE? |                         Trạng thái FE                          | Vị trí file trong FE                                                                                                                                                                                                                     | Phụ thuộc & Trạng thái nghiệm thu                                                                                                                                                                           |
| :----: | :------------------------------------------------------- | :---------------------------: | :-----------------------------------------------------------------: | :-------------------: | :------------------------------------------------------------: | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **9**  | `GET /api/cart`                                          | Optional JWT / `x-session-id` |                 [x] Postman<br>[x] Cart Merge Logic                 |        **Có**         | <span style="color:green;font-weight:bold;">HOÀN THÀNH</span> | `client/src/app/(storefront)/cart/api/cart.api.ts`<br>`client/src/app/(storefront)/cart/hooks/use-cart.ts`<br>`client/src/app/(storefront)/cart/page.tsx`<br>`client/components/storefront/header.tsx`                               | Đã hoàn thiện: Query `["cart"]`, tính toán subtotal, phí ship, tiến trình freeship 499k, badge giỏ hàng Header động, trạng thái rỗng, skeleton loading, error retry, hỗ trợ cả guest session và user JWT |
| **10** | `POST /api/cart/items` _(Body: `variantId`, `quantity`)_ | Optional JWT / `x-session-id` |                   [x] Postman<br>[x] Demo Script                    |        **Có**         | <span style="color:green;font-weight:bold;">HOÀN THÀNH</span> | `client/src/app/(storefront)/cart/api/cart.api.ts`<br>`client/src/app/(storefront)/cart/hooks/use-cart.ts`<br>`client/src/app/(storefront)/products/[slug]/page.tsx`                                                                   | Đã hoàn thiện: Tích hợp nút "Thêm vào giỏ hàng" tại trang chi tiết sản phẩm, mutation TanStack Query, chặn số lượng vượt tồn kho, bắt mã lỗi `CART_INVALID_QUANTITY`, cập nhật ngay badge Header          |
| **11** | `PATCH /api/cart/items/:id` _(Body: `quantity`)_         | Optional JWT / `x-session-id` | [x] Postman<br>[x] TC-03a (Cart IDOR)<br>[x] TC-07a (Anti-Negative) |        **Có**         | <span style="color:green;font-weight:bold;">HOÀN THÀNH</span> | `client/src/app/(storefront)/cart/api/cart.api.ts`<br>`client/src/app/(storefront)/cart/hooks/use-cart.ts`<br>`client/src/app/(storefront)/cart/page.tsx`                                                                               | Đã hoàn thiện: Stepper tăng/giảm số lượng, kiểm tra tồn kho tối đa, `updatingItemIds` chống race condition/double-click, bắt `CART_ITEM_NOT_FOUND` đồng bộ lại giỏ, xóa nếu quantity = 0                 |
| **12** | `DELETE /api/cart/items/:id`                             | Optional JWT / `x-session-id` |             [x] Backend Ready<br>[x] TC-03a (Cart IDOR)             |        **Có**         | <span style="color:green;font-weight:bold;">HOÀN THÀNH</span> | `client/src/app/(storefront)/cart/api/cart.api.ts`<br>`client/src/app/(storefront)/cart/hooks/use-cart.ts`<br>`client/src/app/(storefront)/cart/page.tsx`                                                                               | Đã hoàn thiện: Hộp thoại modal xác nhận xóa món kèm thông tin chi tiết, toast thông báo thành công sau khi API xác nhận, tự động tính lại tổng tiền                                                         |

---

### 3.4. Phân hệ Mã giảm giá (`/api/vouchers`)

|  STT   | Phương thức & Endpoint                                    | Quyền hạn |                Đã kiểm thử thành công?                | Đã gọi trong code FE? |                         Trạng thái FE                          | Vị trí file dự kiến trong FE                                                                        | Phụ thuộc cần xử lý trước                                                                                          |
| :----: | :-------------------------------------------------------- | :-------: | :---------------------------------------------------: | :-------------------: | :------------------------------------------------------------: | :-------------------------------------------------------------------------------------------------- | :----------------------------------------------------------------------------------------------------------------- |
| **13** | `POST /api/vouchers/apply` _(Body: `code`, `orderTotal`)_ |  Public   | [x] Backend Ready<br>[x] TC-02e (Voucher Concurrency) |       **Chưa**        | <span style="color:red;font-weight:bold;">CHƯA TÍCH HỢP</span> | `src/app/(storefront)/cart/components/voucher-form.tsx`<br>`src/app/(storefront)/checkout/page.tsx` | Bắt các mã lỗi nghiệp vụ: `VOUCHER_EXPIRED`, `VOUCHER_USAGE_LIMIT`, `VOUCHER_MIN_ORDER_VALUE`, `VOUCHER_NOT_FOUND` |

---

### 3.5. Phân hệ Đặt hàng & Khóa kho Atomic (`/api/checkout` & `/api/orders`)

|  STT   | Phương thức & Endpoint                                                                                           |        Quyền hạn        |                                        Đã kiểm thử thành công?                                         | Đã gọi trong code FE? |                         Trạng thái FE                          | Vị trí file dự kiến trong FE                                                                                                                             | Phụ thuộc cần xử lý trước                                                                                                                                                    |
| :----: | :--------------------------------------------------------------------------------------------------------------- | :---------------------: | :----------------------------------------------------------------------------------------------------: | :-------------------: | :------------------------------------------------------------: | :------------------------------------------------------------------------------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **14** | `POST /api/checkout/lock` _(Body: `recipientName`, `recipientPhone`, `shippingAddress`, `voucherCode`, `items`)_ | Bearer Token (Customer) | [x] Postman<br>[x] TC-01 (Race Condition k6)<br>[x] TC-05b (Pending Limit)<br>[x] TC-07a (Input Guard) |       **Chưa**        | <span style="color:red;font-weight:bold;">CHƯA TÍCH HỢP</span> | `src/app/(storefront)/checkout/api/checkout.api.ts`<br>`src/app/(storefront)/checkout/hooks/use-checkout.ts`<br>`src/app/(storefront)/checkout/page.tsx` | 1. Bắt buộc đăng nhập (`AuthGuard`)<br>2. Bắt lỗi `INSUFFICIENT_STOCK` (409) bật modal báo hết hàng<br>3. Bắt lỗi `ORDER_PENDING_LIMIT_REACHED` (429) nhắc thanh toán đơn cũ |
| **15** | `GET /api/orders`                                                                                                | Bearer Token (Customer) |                                    [x] Postman<br>[x] Backend Ready                                    |       **Chưa**        | <span style="color:red;font-weight:bold;">CHƯA TÍCH HỢP</span> | `src/app/(storefront)/orders/page.tsx`                                                                                                                   | UI primitive `badge` (hiển thị trạng thái đơn hàng), `table`, `AuthGuard`                                                                                                    |
| **16** | `GET /api/orders/:code`                                                                                          | Bearer Token (Customer) |                              [x] Backend Ready<br>[x] TC-03a (Order IDOR)                              |       **Chưa**        | <span style="color:red;font-weight:bold;">CHƯA TÍCH HỢP</span> | `src/app/(storefront)/orders/[code]/page.tsx`<br>`src/app/(storefront)/checkout/payment/[orderCode]/page.tsx`                                            | Cơ chế Polling tự động làm mới trạng thái mỗi 3 giây khi đang chờ thanh toán                                                                                                 |

---

### 3.6. Phân hệ Thanh toán VietQR & Giả lập Mock (`/api/payments`)

|  STT   | Phương thức & Endpoint                                   |               Quyền hạn               |                                          Đã kiểm thử thành công?                                           | Đã gọi trong code FE? |                         Trạng thái FE                          | Vị trí file dự kiến trong FE                                                                                                           | Phụ thuộc cần xử lý trước                                                                                                                                    |
| :----: | :------------------------------------------------------- | :-----------------------------------: | :--------------------------------------------------------------------------------------------------------: | :-------------------: | :------------------------------------------------------------: | :------------------------------------------------------------------------------------------------------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **17** | `POST /api/payments/create-qr` _(Body: `orderCode`)_     |        Bearer Token (Customer)        |                                    [x] Postman<br>[x] PayOS SDK Tested                                     |       **Chưa**        | <span style="color:red;font-weight:bold;">CHƯA TÍCH HỢP</span> | `src/app/(storefront)/checkout/payment/[orderCode]/api/payment.api.ts`<br>`src/app/(storefront)/checkout/payment/[orderCode]/page.tsx` | 1. Component đồng hồ đếm ngược 10:00 (`lockDurationSeconds: 600`)<br>2. Polling `GET /api/orders/:code`<br>3. Tự động vô hiệu hóa thanh toán khi hết 10 phút |
| **18** | `POST /api/payments/mock-simulate` _(Body: `orderCode`)_ |      Bearer Token (Owner/Admin)       |                                  [x] Postman<br>[x] TC-06 (3-Layer Guard)                                  |       **Chưa**        | <span style="color:red;font-weight:bold;">CHƯA TÍCH HỢP</span> | `src/app/(storefront)/checkout/payment/[orderCode]/components/mock-payment-button.tsx`                                                 | Nút giả lập chỉ hiển thị khi `isMockMode: true` và môi trường không phải production                                                                          |
| **19** | `POST /api/payments/webhook`                             | Webhook Signature (PayOS HMAC-SHA256) | [x] TC-02a (Bad Sig)<br>[x] TC-02b (Amount Check)<br>[x] TC-02c (Cron vs Hook)<br>[x] TC-02d (Idempotency) |       **Chưa**        | <span style="color:gray;font-weight:bold;">BACKEND ONLY</span> | **Không tích hợp trên FE**                                                                                                             | Endpoint nội bộ do PayOS Gateway gọi tới. FE tuyệt đối không can thiệp.                                                                                      |

---

### 3.7. Thuật toán Smart Fit Advisor (`/api/fit-advisor`)

|  STT   | Phương thức & Endpoint                                                                                                 | Quyền hạn |        Đã kiểm thử thành công?        | Đã gọi trong code FE? |                         Trạng thái FE                          | Vị trí file trong FE                                                                                                                                                       | Phụ thuộc & Trạng thái nghiệm thu                                                                                                                                                                            |
| :----: | :--------------------------------------------------------------------------------------------------------------------- | :-------: | :-----------------------------------: | :-------------------: | :------------------------------------------------------------: | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **20** | `POST /api/fit-advisor/recommend` _(Body: `productId`, `height`, `weight`, `chest`, `waist`, `hips`, `fitPreference`)_ |  Public   | [x] Postman<br>[x] Demo Script Tested |        **Có**         | <span style="color:green;font-weight:bold;">HOÀN THÀNH</span> | `client/src/api/fit-advisor.api.ts`<br>`client/src/app/(storefront)/products/[slug]/hooks/use-product-detail.ts`<br>`client/src/app/(storefront)/products/[slug]/page.tsx` | Đã hoàn thiện: Form nhập chiều cao, cân nặng, vòng ngực/eo/mông, phong cách mặc (TIGHT, REGULAR, LOOSE), gọi trực tiếp backend tính điểm khớp, hiển thị tỷ lệ tin cậy, lời khuyên và nút áp dụng size ngay |

---

### 3.8. Phòng phối đồ Outfit Builder Canvas 2D (`/api/outfits`)

|  STT   | Phương thức & Endpoint   | Quyền hạn |    Đã kiểm thử thành công?     | Đã gọi trong code FE? |                         Trạng thái FE                          | Vị trí file trong FE                                                                                                                         | Phụ thuộc & Trạng thái nghiệm thu                                                                                                                                                                            |
| :----: | :----------------------- | :-------: | :----------------------------: | :-------------------: | :------------------------------------------------------------: | :------------------------------------------------------------------------------------------------------------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **21** | `GET /api/outfits`       |  Public   | [x] Postman<br>[x] Demo Script |        **Có**         | <span style="color:green;font-weight:bold;">HOÀN THÀNH</span> | `client/src/app/(storefront)/outfits/api/outfits.api.ts`<br>`client/src/app/(storefront)/outfits/hooks/use-outfits.ts`<br>`client/src/app/(storefront)/outfits/page.tsx` | Đã hoàn thiện: Danh sách Lookbook Preset mẫu, hiển thị ảnh, tên, chiết khấu và nút "Thử set đồ này trên Canvas" nạp toàn bộ món đồ vào Canvas 2D                                                            |
| **22** | `GET /api/outfits/slots` |  Public   | [x] Postman<br>[x] Demo Script |        **Có**         | <span style="color:green;font-weight:bold;">HOÀN THÀNH</span> | `client/src/app/(storefront)/outfits/api/outfits.api.ts`<br>`client/src/app/(storefront)/outfits/hooks/use-outfits.ts`<br>`client/src/app/(storefront)/outfits/page.tsx` | Đã hoàn thiện: Phân loại theo 5 tầng (TOP, BOTTOM, OUTERWEAR, SHOES, ACCESSORY), Canvas 2D tương tác trực quan thời gian thực, tính tổng giá set đồ và nút thêm toàn bộ vào giỏ hàng qua Batch 3 useCart |

---

### 3.9. Phân hệ Quản trị Admin Dashboard (`/api/admin`)

|  STT   | Phương thức & Endpoint                                  |               Quyền hạn               |              Đã kiểm thử thành công?              | Đã gọi trong code FE? |                         Trạng thái FE                          | Vị trí file dự kiến trong FE                                       | Phụ thuộc cần xử lý trước                                                                                                                 |
| :----: | :------------------------------------------------------ | :-----------------------------------: | :-----------------------------------------------: | :-------------------: | :------------------------------------------------------------: | :----------------------------------------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------- |
| **23** | `GET /api/admin/stats`                                  |     Bearer Token (Role: `ADMIN`)      |   [x] Backend Ready<br>[x] TC-03b (Admin RBAC)    |       **Chưa**        | <span style="color:red;font-weight:bold;">CHƯA TÍCH HỢP</span> | `src/app/admin/page.tsx`<br>`src/app/admin/api/admin-stats.api.ts` | Admin Layout (`src/app/admin/layout.tsx`), RBAC RoleGuard chặn role `CUSTOMER` và `STAFF`                                                 |
| **24** | `GET /api/admin/orders`                                 | Bearer Token (Role: `ADMIN`, `STAFF`) |   [x] Backend Ready<br>[x] TC-03c (Staff RBAC)    |       **Chưa**        | <span style="color:red;font-weight:bold;">CHƯA TÍCH HỢP</span> | `src/app/admin/orders/page.tsx`                                    | Admin Layout, RBAC Guard cho phép cả `ADMIN` và `STAFF`, UI primitive `table`                                                             |
| **25** | `PATCH /api/admin/orders/:id/status` _(Body: `status`)_ | Bearer Token (Role: `ADMIN`, `STAFF`) |     [x] TC-07b (State Machine & Refund Lock)      |       **Chưa**        | <span style="color:red;font-weight:bold;">CHƯA TÍCH HỢP</span> | `src/app/admin/orders/components/order-status-select.tsx`          | 1. Dropdown UI chọn trạng thái theo đúng `allowedTransitions`<br>2. Cảnh báo modal: khi hủy đơn `PENDING_PAYMENT` kho sẽ tự động hoàn trả |
| **26** | `GET /api/admin/products`                               |     Bearer Token (Role: `ADMIN`)      |   [x] Backend Ready<br>[x] TC-03b (Admin RBAC)    |       **Chưa**        | <span style="color:red;font-weight:bold;">CHƯA TÍCH HỢP</span> | `src/app/admin/products/page.tsx`                                  | Bảng quản lý sản phẩm, hiển thị cả sản phẩm đang ẩn (`isActive = false`)                                                                  |
| **27** | `POST /api/admin/products`                              |     Bearer Token (Role: `ADMIN`)      |   [x] Backend Ready<br>[x] TC-03b (Admin RBAC)    |       **Chưa**        | <span style="color:red;font-weight:bold;">CHƯA TÍCH HỢP</span> | `src/app/admin/products/new/page.tsx`                              | Form nhập sản phẩm + mảng biến thể SKU (`ProductVariant`), Zod schema validate giá và số lượng dương                                      |
| **28** | `PUT /api/admin/products/:id`                           |     Bearer Token (Role: `ADMIN`)      |                 [x] Backend Ready                 |       **Chưa**        | <span style="color:red;font-weight:bold;">CHƯA TÍCH HỢP</span> | `src/app/admin/products/[id]/page.tsx`                             | Form chỉnh sửa thông tin sản phẩm và cập nhật số lượng tồn kho từng SKU                                                                   |
| **29** | `DELETE /api/admin/products/:id`                        |     Bearer Token (Role: `ADMIN`)      |                 [x] Backend Ready                 |       **Chưa**        | <span style="color:red;font-weight:bold;">CHƯA TÍCH HỢP</span> | `src/app/admin/products/page.tsx`                                  | Hộp thoại xác nhận ẩn sản phẩm (`isActive = false`)                                                                                       |
| **30** | `GET /api/admin/vouchers`                               |     Bearer Token (Role: `ADMIN`)      | [x] Backend Ready<br>[x] TC-03c (Staff RBAC chối) |       **Chưa**        | <span style="color:red;font-weight:bold;">CHƯA TÍCH HỢP</span> | `src/app/admin/vouchers/page.tsx`                                  | Bảng danh sách voucher, hiển thị tỷ lệ đã dùng (`usedCount / usageLimit`)                                                                 |
| **31** | `POST /api/admin/vouchers`                              |     Bearer Token (Role: `ADMIN`)      |   [x] Backend Ready<br>[x] TC-03b (Admin RBAC)    |       **Chưa**        | <span style="color:red;font-weight:bold;">CHƯA TÍCH HỢP</span> | `src/app/admin/vouchers/new/page.tsx`                              | Form tạo voucher: mã code, loại giảm (`PERCENT`/`FIXED`), giá trị giảm, đơn tối thiểu, ngày hết hạn                                       |

---

## 4. Kế hoạch Triển khai theo Batch và Ma trận Phụ thuộc (Execution Batches)

```text
[BATCH 1: Nền tảng & Xác thực] (ĐÃ HOÀN THÀNH 100%)
├── Khởi tạo globals.css (Tailwind v4 tokens) & nạp vào layout.tsx
├── Bổ sung thư viện thông báo Toast & Error Parser lib/error.ts
├── Chuẩn hóa module login (tách login.api, use-login, login.validation, login.css, Suspense)
├── Sửa lỗi bọc lặp <AuthLayout> tại login/page.tsx và register/page.tsx
├── Nâng cấp Axios Interceptor với hàng đợi chống race condition refresh token & chống vô hạn loop
├── Xây dựng Zustand authStore & Auth Provider (gắn GET /api/auth/me & POST /api/auth/logout)
└── Xây dựng RoleGuard phân quyền RBAC (CUSTOMER, ADMIN, STAFF) và xử lý 403 Forbidden
        │
        ├──► [BATCH 2: Storefront Shell, Catalog & Product Detail] (ĐÃ HOÀN THÀNH 100%)
        │    ├── Tích hợp GET /api/categories (Header Nav & Sidebar)
        │    ├── Tích hợp GET /api/products (Lọc danh mục, giá, màu, size, tìm kiếm q, phân trang)
        │    └── Tích hợp GET /api/products/:slug (Chi tiết sản phẩm, biến thể SKU, Size Chart)
        │            │
        │            ├──► [BATCH 2: Cart Drawer, Guest Session & Voucher]
        │            │    ├── Cài đặt cartStore.ts (Zustand) đồng bộ x-session-id & Cart Merge
        │            │    ├── Tích hợp GET /api/cart, POST /api/cart/items, PATCH /api/cart/items/:id, DELETE /api/cart/items/:id
        │            │    └── Tích hợp POST /api/vouchers/apply (kiểm tra voucher & preview giảm giá)
        │            │            │
        │            │            └──► [BATCH 4: Checkout, 10-Min Atomic Lock & VietQR Payment]
        │            │                 ├── Tích hợp POST /api/checkout/lock (bắt lỗi 409 hết hàng, 429 quá 2 đơn)
        │            │                 ├── Tích hợp POST /api/payments/create-qr (QR PayOS động & Timer 10:00)
        │            │                 ├── Tích hợp POST /api/payments/mock-simulate (chế độ demo)
        │            │                 └── Tích hợp GET /api/orders & GET /api/orders/:code (Tracking & Polling)
        │            │
        │            └──► [BATCH 3: Smart Fit Advisor & 2D Outfit Builder]
        │                 ├── Tích hợp POST /api/fit-advisor/recommend (Modal tính FitScore & khuyến nghị size)
        │                 ├── Tích hợp GET /api/outfits (Lookbook giảm combo 15%)
        │                 └── Tích hợp GET /api/outfits/slots & outfitStore (Canvas 2D xếp lớp phối đồ)
        │
        └──► [BATCH 5: Admin Dashboard & RBAC Management]
             ├── Xây dựng Admin Layout & RBAC RouteGuard (ADMIN, STAFF)
             ├── Tích hợp GET /api/admin/stats (Dashboard báo cáo doanh thu)
             ├── Tích hợp GET /api/admin/orders & PATCH /api/admin/orders/:id/status (Quản lý đơn hàng)
             ├── Tích hợp CRUD /api/admin/products (Quản lý sản phẩm & tồn kho SKU)
             └── Tích hợp GET & POST /api/admin/vouchers (Quản lý mã giảm giá)
```

---

## 5. Quy định Cập nhật Trạng thái cho Đội ngũ Phát triển

1. **Khi bắt đầu tích hợp một Endpoint:** Người phụ trách tạo nhánh tính năng theo đúng cấu trúc thư mục quy định tại `client/.agent/rule/architecture-guide.md` (`api/`, `hooks/`, `validation/`, `style/`, `page.tsx`).
2. **Khi code gọi API đã được viết:** Cập nhật cột **"Đã gọi trong code FE?"** thành **`Có`** và đổi **"Trạng thái FE"** sang **`CẦN KIỂM THỬ E2E`**.
3. **Khi tính năng vượt qua kiểm thử liên thông:** Đảm bảo xử lý đầy đủ các mã lỗi định danh (`errorCode`) từ mục 3.2 của `API_DOCUMENTATION.md`, sau đó chuyển trạng thái sang **`HOÀN THÀNH`**.
4. **Không tự ý thay đổi endpoint URL, query params hay cấu trúc JSON request/response:** Mọi thay đổi bắt buộc phải đối chiếu và cập nhật đồng bộ với Backend Lead tại `API_DOCUMENTATION.md`.
