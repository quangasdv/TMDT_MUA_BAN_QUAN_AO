# TRENDYFIT - Nền tảng Thương mại Điện tử Thời trang Thông minh

Hệ thống thương mại điện tử thời trang B2C theo kiến trúc Headless Commerce, tích hợp phòng phối đồ trực quan (Interactive Outfit Builder), thuật toán gợi ý kích cỡ (Smart Fit Advisor) và cơ chế kiểm soát tranh chấp kho hàng (Atomic Conditional Inventory Locking).

---

## 1. Thành viên nhóm và Phân công trách nhiệm

| STT | Họ và tên | MSSV (Khóa 12) | Vai trò chính | Phạm vi phụ trách cụ thể |
| :---: | :--- | :---: | :--- | :--- |
| 1 | **Nguyễn Đăng Quang** | `085008xxxx` | Nhóm trưởng / Frontend Lead | Kiến trúc Next.js 16 (Turbopack), Storefront UI (Home, Catalog, Product Detail, Cart), **Giao diện Admin Dashboard (UI Layout & Charts)**, Slide báo cáo |
| 2 | **Trần Nguyên** | `085008xxxx` | Backend Lead & DB Architect | Thiết kế ERD (14 model), Prisma Schema (^5.18.0), Core REST API (Auth với Refresh/Logout, Catalog, Products, Orders), Cơ chế Cart Merge |
| 3 | **Hoàng Đình Tân** | `085008xxxx` | Fullstack Developer | **Module Outfit Builder (Canvas 2D + Outfit API)**, **Thuật toán Smart Fit Advisor (Backend + Modal)**, **Cart API (CRUD số lượng, chống IDOR)** & **Voucher Apply API** |
| 4 | **Nhan Phi Phố** | `085008xxxx` | Payment, Security & Operations Lead | Cổng VietQR/PayOS + Mock Signature Gateway, Khóa kho Atomic, **Chống xung đột Cron-Webhook**, Rate Limit (`express-rate-limit`), RBAC Admin Backend, 06 ca kiểm thử |

*Chi tiết kế hoạch triển khai, tiến độ và phân rã công việc (WBS) được lưu trữ tại [PLAN.md](./PLAN.md).*  
*Bảng phân tích mối đe dọa và kế hoạch kiểm thử an toàn được lưu trữ tại [docs/threat-model.md](./docs/threat-model.md).*

---

## 2. Công nghệ sử dụng (Tech Stack)

### 2.1. Frontend
* **Framework:** Next.js 16 (App Router, Turbopack, TypeScript)
* **Styling:** Tailwind CSS, Shadcn UI (Radix UI primitives), Lucide React
* **State Management:** Zustand (quản lý trạng thái giỏ hàng và canvas phối đồ)
* **HTTP Client:** Axios (cấu hình Request Interceptor tự động gửi Bearer token và Response Interceptor tự làm mới token)

### 2.2. Backend
* **Runtime & Framework:** Node.js, Express.js với TypeScript (kiến trúc phân tầng Controller - Service, cấu hình `app.set('trust proxy', 1)`)
* **Database & ORM:** PostgreSQL (Supabase Pooler), Prisma ORM (`prisma@^5.18.0` và `@prisma/client@^5.18.0`, hỗ trợ seed tự động qua `npx prisma db seed` và `npm run db:seed`)
* **Authentication & Authorization:** JWT (Access Token gửi qua header `Authorization: Bearer <token>`, Refresh Token lưu trong HttpOnly Cookie), Phân quyền RBAC0 qua Middleware
* **Validation & Security:** Zod (kiểm tra chặt chẽ đầu vào, chống số lượng âm), `express-rate-limit` (phòng chống Brute-force & DoS)
* **Tác vụ nền (Background Worker):** `node-cron` xử lý quét khóa kho hết hạn (mỗi 60 giây)

### 2.3. Tích hợp & Kiểm thử
* **Thanh toán:** Cổng VietQR qua PayOS API (kèm chế độ Mock Gateway nội bộ tự động ký chữ ký HMAC-SHA256 phục vụ demo)
* **Tunneling Webhook:** Ngrok
* **Kiểm thử API & Tải:** Postman, k6

---

## 3. Cấu trúc thư mục dự án

```text
trendyfit/
├── client/                     # Mã nguồn Frontend (Next.js 16 Turbopack)
│   ├── src/
│   │   ├── app/                # App Router (pages & layouts)
│   │   │   ├── (storefront)/   # Giao diện khách hàng (Home, Products, Outfit, Cart, Checkout)
│   │   │   └── admin/          # Giao diện quản trị (Dashboard, Products, Orders, Vouchers)
│   │   ├── components/         # Reusable UI components (ProductCard, SmartFitModal, Canvas...)
│   │   ├── hooks/              # Custom React hooks
│   │   ├── lib/                # Tiện ích, Axios client, utils
│   │   └── stores/             # Zustand stores (cartStore, outfitStore)
│   └── public/                 # Static assets, ảnh sản phẩm tách nền PNG
│
├── server/                     # Mã nguồn Backend (Express + TypeScript)
│   ├── src/
│   │   ├── config/             # Cấu hình môi trường, database, PayOS
│   │   ├── controllers/        # Request handlers
│   │   ├── middlewares/        # AuthGuard, RoleGuard, RateLimit, ErrorHandler
│   │   ├── repositories/       # Tầng truy vấn cơ sở dữ liệu
│   │   ├── routes/             # Định tuyến API
│   │   ├── services/           # Nghiệp vụ: Order, InventoryLock, FitAdvisor...
│   │   └── workers/            # Cron jobs quét kho hết hạn
│   └── prisma/
│       ├── schema.prisma       # Mô hình cơ sở dữ liệu Prisma (14 models)
│       └── seed.ts             # Dữ liệu khởi tạo (seed data)
│
├── docs/                       # Tài liệu đồ án
│   ├── architecture.png        # Sơ đồ kiến trúc hệ thống
│   ├── erd.png                 # Sơ đồ cơ sở dữ liệu quan hệ (14 bảng)
│   ├── sequence-checkout.png   # Sơ đồ tuần tự: Đặt hàng & Khóa kho
│   ├── sequence-payment.png    # Sơ đồ tuần tự: Thanh toán & Webhook
│   ├── order-state.png         # Sơ đồ máy trạng thái đơn hàng
│   ├── threat-model.md         # Phân tích mô hình đe dọa & 06 ca kiểm thử an toàn
│   └── DEMO_SCRIPT.md          # Kịch bản demo nội bộ của nhóm
│
├── .env.example                # Biến môi trường mẫu
├── PLAN.md                     # Kế hoạch tiến độ và checklist nhiệm vụ
└── README.md                   # Tài liệu giới thiệu dự án
```

---

## 4. Hướng dẫn cài đặt và Chạy thử nghiệm

### 4.1. Yêu cầu môi trường
* Node.js >= 18.17.0
* PostgreSQL >= 14
* Prisma CLI: `5.18.0` (đã khai báo cố định trong `package.json`)
* Trình quản lý gói: `npm` hoặc `pnpm`

### 4.2. Cấu hình biến môi trường
Tạo file `.env` tại thư mục `server/` theo mẫu:

```env
# Server Config
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:3000

# Database Connection
DATABASE_URL="postgresql://postgres:password@localhost:5432/trendyfit_db?schema=public"

# JWT Secret Keys
JWT_ACCESS_SECRET="your_access_token_secret_key"
JWT_REFRESH_SECRET="your_refresh_token_secret_key"

# PayOS Payment Config
PAYOS_CLIENT_ID="your_payos_client_id"
PAYOS_API_KEY="your_payos_api_key"
PAYOS_CHECKSUM_KEY="your_payos_checksum_key"

# Mock Mode (true: cho phép dùng Mock Engine tự ký chữ ký số khi dev/demo; false: bắt buộc PayOS thật)
PAYMENT_MOCK_MODE=true
```

Tạo file `.env.local` tại thư mục `client/`:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

### 4.3. Khởi tạo Cơ sở Dữ liệu
Tại thư mục `server/`:
```bash
# Cài đặt thư viện
npm install

# Đồng bộ schema với database
npx prisma migrate dev --name init

# Nạp dữ liệu mẫu (sản phẩm, biến thể, tài khoản demo)
npx prisma db seed
```

### 4.4. Khởi chạy ứng dụng
Chạy Backend (Port 5000):
```bash
cd server
npm run dev
```

Chạy Frontend (Port 3000):
```bash
cd client
npm run dev
```

Truy cập hệ thống tại: `http://localhost:3000`

---

## 5. Tài khoản dùng thử (Demo Accounts)

Sau khi chạy lệnh `prisma db seed`, hệ thống tạo sẵn các tài khoản sau:

| Loại tài khoản | Email đăng nhập | Mật khẩu | Quyền hạn |
| :--- | :--- | :--- | :--- |
| **Quản trị viên (Admin)** | `admin@trendyfit.vn` | `Admin@123456` | Toàn quyền quản trị kho, sản phẩm, đơn hàng, voucher, thống kê |
| **Nhân viên (Staff)** | `staff@trendyfit.vn` | `Staff@123456` | Quản lý danh sách đơn hàng, cập nhật trạng thái vận chuyển |
| **Khách hàng (Customer)** | `customer@gmail.com` | `Customer@123456` | Mua sắm, thử đồ, đo size, thanh toán đơn hàng |

---

## 6. Thiết kế Cơ sở Dữ liệu (14 Bảng Thực thể)

Hệ thống được thiết kế chuẩn hóa bậc 3 (3NF) gồm chính xác **14 bảng thực thể**:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

enum Role {
  CUSTOMER
  ADMIN
  STAFF
}

enum LockStatus {
  LOCKED      // Đã trừ kho và đang khóa giữ trong 10 phút
  COMMITTED   // Đã thanh toán, chốt trừ kho vĩnh viễn
  EXPIRED     // Hết 10 phút chưa trả tiền, đã hoàn trả lại kho
}

enum OrderStatus {
  PENDING_PAYMENT                // Chờ thanh toán (đã khóa hàng 10 phút)
  PAID                           // Đã thanh toán thành công
  PROCESSING                     // Đang đóng gói
  SHIPPING                       // Đang giao hàng
  DELIVERED                      // Đã giao hàng thành công
  CANCELLED                      // Đã hủy (do quá hạn 10 phút)
  PAYMENT_EXPIRED_PENDING_REFUND // Thanh toán muộn khi kho đã hết, chờ hoàn tiền
}

// 1. Người dùng
model User {
  id           String    @id @default(uuid())
  email        String    @unique
  passwordHash String
  fullName     String
  phone        String?
  role         Role      @default(CUSTOMER)
  createdAt    DateTime  @default(now())
  orders       Order[]
  cart         Cart?
}

// 2. Danh mục sản phẩm (Phân cấp)
model Category {
  id       String     @id @default(uuid())
  name     String
  slug     String     @unique
  parentId String?
  parent   Category?  @relation("SubCategories", fields: [parentId], references: [id])
  children Category[] @relation("SubCategories")
  products Product[]
}

// 3. Sản phẩm chung
model Product {
  id          String           @id @default(uuid())
  name        String
  slug        String           @unique
  description String           @db.Text
  basePrice   Decimal          @db.Decimal(12, 2)
  categoryId  String
  category    Category         @relation(fields: [categoryId], references: [id])
  variants    ProductVariant[]
  sizeCharts  SizeChart[]
  isActive    Boolean          @default(true)
  createdAt   DateTime         @default(now())
  updatedAt   DateTime         @default(now()) @updatedAt
}

// 4. Bảng thông số kích thước chuẩn (Phục vụ Smart Fit Advisor)
model SizeChart {
  id          String  @id @default(uuid())
  productId   String
  product     Product @relation(fields: [productId], references: [id])
  size        String  // S, M, L, XL
  minHeightCm Int
  maxHeightCm Int
  minWeightKg Int
  maxWeightKg Int
  chestCm     Int?
  waistCm     Int?
}

// 5. Biến thể sản phẩm (SKU chi tiết)
model ProductVariant {
  id              String          @id @default(uuid())
  productId       String
  product         Product         @relation(fields: [productId], references: [id])
  sku             String          @unique
  color           String
  size            String
  priceAdjustment Decimal         @default(0) @db.Decimal(12, 2)
  stockQuantity   Int             // Tồn kho thực tế (đã bị trừ ngay khi tạo lock)
  imageUrl        String
  outfitItems     OutfitItem[]
  cartItems       CartItem[]
  orderItems      OrderItem[]
  inventoryLocks  InventoryLock[]
}

// 6. Bộ phối đồ Outfit (Lookbook)
model Outfit {
  id           String       @id @default(uuid())
  title        String
  description  String?
  bannerUrl    String?
  discountRate Float        @default(0.15)
  items        OutfitItem[]
  isActive     Boolean      @default(true)
}

// 7. Món đồ cấu thành Outfit
model OutfitItem {
  id        String         @id @default(uuid())
  outfitId  String
  outfit    Outfit         @relation(fields: [outfitId], references: [id])
  variantId String
  variant   ProductVariant @relation(fields: [variantId], references: [id])
  slotType  String         // TOP, BOTTOM, OUTERWEAR, SHOES
}

// 8. Giỏ hàng (Hỗ trợ khách vãng lai qua sessionId, gộp vào user khi đăng nhập)
model Cart {
  id        String     @id @default(uuid())
  userId    String?    @unique
  user      User?      @relation(fields: [userId], references: [id])
  sessionId String?    @unique
  items     CartItem[]
  createdAt DateTime   @default(now())
  updatedAt DateTime   @updatedAt
}

// 9. Chi tiết giỏ hàng
model CartItem {
  id        String         @id @default(uuid())
  cartId    String
  cart      Cart           @relation(fields: [cartId], references: [id])
  variantId String
  variant   ProductVariant @relation(fields: [variantId], references: [id])
  quantity  Int            @default(1)
}

// 10. Khóa kho tạm thời (Theo dõi thời hạn và hoàn kho)
model InventoryLock {
  id        String         @id @default(uuid())
  variantId String
  variant   ProductVariant @relation(fields: [variantId], references: [id])
  orderId   String
  order     Order          @relation(fields: [orderId], references: [id])
  quantity  Int
  lockedAt  DateTime       @default(now())
  expiresAt DateTime
  status    LockStatus     @default(LOCKED)
}

// 11. Đơn hàng
model Order {
  id              String          @id @default(uuid())
  orderCode       Int             @unique
  userId          String
  user            User            @relation(fields: [userId], references: [id])
  recipientName   String
  recipientPhone  String
  shippingAddress String
  voucherId       String?
  voucher         Voucher?        @relation(fields: [voucherId], references: [id])
  totalAmount     Decimal         @db.Decimal(12, 2)
  discountAmount  Decimal         @default(0) @db.Decimal(12, 2)
  finalAmount     Decimal         @db.Decimal(12, 2)
  status          OrderStatus     @default(PENDING_PAYMENT)
  paymentStatus   String          @default("UNPAID")
  createdAt       DateTime        @default(now())
  items           OrderItem[]
  locks           InventoryLock[]
  payment         PaymentTransaction?
}

// 12. Chi tiết đơn hàng
model OrderItem {
  id        String         @id @default(uuid())
  orderId   String
  order     Order          @relation(fields: [orderId], references: [id])
  variantId String
  variant   ProductVariant @relation(fields: [variantId], references: [id])
  quantity  Int
  unitPrice Decimal        @db.Decimal(12, 2)
}

// 13. Giao dịch thanh toán & Webhook Log
model PaymentTransaction {
  id             String   @id @default(uuid())
  orderId        String   @unique
  order          Order    @relation(fields: [orderId], references: [id])
  transactionRef String?
  amount         Decimal  @db.Decimal(12, 2)
  provider       String   @default("PAYOS")
  status         String
  webhookPayload Json?
  createdAt      DateTime @default(now())
  updatedAt      DateTime @default(now()) @updatedAt
}

// 14. Mã giảm giá
model Voucher {
  id            String    @id @default(uuid())
  code          String    @unique
  discountType  String    // PERCENT / FIXED
  discountValue Decimal   @db.Decimal(12, 2)
  minOrderValue Decimal   @default(0) @db.Decimal(12, 2)
  usageLimit    Int       @default(100)
  usedCount     Int       @default(0)
  expiresAt     DateTime
  isActive      Boolean   @default(true)
  orders        Order[]
}
```

---

## 7. Danh mục Endpoint API cốt lõi

### 7.1. Khách hàng (Customer API)
* `POST /api/auth/register` - Đăng ký tài khoản
* `POST /api/auth/login` - Đăng nhập, cấp Access/Refresh Token (tự động gộp giỏ hàng guest vào user)
* `POST /api/auth/refresh` - Cấp mới Access Token từ HttpOnly Refresh Token
* `POST /api/auth/logout` - Đăng xuất và xóa Refresh Token cookie
* `GET /api/auth/me` - Kiểm tra thông tin phiên đăng nhập
* `GET /api/products?q=&category=&minPrice=&maxPrice=&color=&size=&page=&limit=` - Tìm kiếm từ khóa và lọc sản phẩm
* `GET /api/products/:slug` - Chi tiết sản phẩm, danh sách biến thể SKU và Size Chart
* `GET /api/categories` - Danh mục sản phẩm
* `GET /api/outfits` - Danh sách bộ phối Lookbook
* `GET /api/outfits/slots` - Danh sách sản phẩm phân loại theo tầng phối đồ (Top, Bottom, Shoes, Outerwear)
* `POST /api/fit-advisor/recommend` - Thuật toán tính độ vừa vặn và khuyến nghị size
* `GET /api/cart` - Lấy thông tin giỏ hàng
* `POST /api/cart/items` - Thêm sản phẩm vào giỏ hàng
* `PATCH /api/cart/items/:id` - Cập nhật số lượng món trong giỏ hàng
* `DELETE /api/cart/items/:id` - Xóa món khỏi giỏ
* `POST /api/vouchers/apply` - Kiểm tra tính hợp lệ của mã giảm giá và tính toán số tiền giảm trước khi checkout
* `POST /api/checkout/lock` - Tạo đơn hàng, áp voucher và khóa giữ kho tạm thời 10 phút (Yêu cầu đăng nhập)
* `GET /api/orders` - Danh sách đơn hàng của khách hàng hiện tại
* `GET /api/orders/:code` - Tra cứu trạng thái chi tiết đơn hàng theo mã
* `POST /api/payments/create-qr` - Sinh mã VietQR (qua PayOS hoặc Mock Engine)
* `POST /api/payments/webhook` - Tiếp nhận webhook xác thực chữ ký số HMAC-SHA256 và kiểm tra khớp số tiền
* `POST /api/payments/mock-simulate` - Kích hoạt giả lập thanh toán (chỉ cho phép khi dev/demo, yêu cầu đăng nhập chính chủ, tự động ký chữ ký HMAC-SHA256 rồi gọi vào webhook handler)

### 7.2. Phân hệ Quản trị (Admin & Staff API)
* `GET /api/admin/orders` - Quản lý danh sách đơn hàng (Quyền: **`ADMIN`** và **`STAFF`**)
* `PATCH /api/admin/orders/:id/status` - Cập nhật trạng thái đơn hàng (`PROCESSING`, `SHIPPING`, `DELIVERED`, `CANCELLED`) (Quyền: **`ADMIN`** và **`STAFF`**)
* `GET /api/admin/products` - Danh sách quản lý sản phẩm (Quyền: **`ADMIN`**)
* `POST /api/admin/products` - Thêm mới sản phẩm và các biến thể SKU (Quyền: **`ADMIN`**)
* `PUT /api/admin/products/:id` - Cập nhật sản phẩm, tồn kho biến thể (Quyền: **`ADMIN`**)
* `DELETE /api/admin/products/:id` - Ẩn/xóa sản phẩm (Quyền: **`ADMIN`**)
* `GET /api/admin/vouchers` - Danh sách mã giảm giá (Quyền: **`ADMIN`**)
* `POST /api/admin/vouchers` - Tạo mã giảm giá mới (Quyền: **`ADMIN`**)
* `GET /api/admin/stats` - Báo cáo tổng quan doanh thu, số lượng đơn (Quyền: **`ADMIN`**)

---

## 8. Xử lý các Vấn đề Kỹ thuật Trọng yếu

### 8.1. Kiểm soát tranh chấp kho (Atomic Conditional Update & Tránh Deadlock)
Hệ thống áp dụng mô hình quản lý kho **Cách A (Trừ kho ngay lúc khóa - Hoàn trả khi quá hạn)**:
1. **Sắp xếp thứ tự ID để tránh Deadlock:** Khi giỏ hàng có nhiều món, Backend luôn sắp xếp các món theo thứ tự `variantId` tăng dần trước khi thực thi truy vấn.
2. **Cập nhật có điều kiện nguyên tử (Atomic Conditional Update):** Trong cùng một Database Transaction, thực thi câu lệnh SQL nguyên tử:
   ```sql
   UPDATE "ProductVariant"
   SET "stockQuantity" = "stockQuantity" - $quantity
   WHERE "id" = $variantId AND "stockQuantity" >= $quantity;
   ```
   Nếu số dòng bị ảnh hưởng bằng 0 $\rightarrow$ Có ít nhất một món trong giỏ bị hết hàng, giao dịch tự động Rollback và ném lỗi `HTTP 409 Conflict: Sản phẩm tạm thời hết hàng`.
3. **Ghi nhận bản ghi khóa kho:** Nếu thành công, tạo bản ghi `InventoryLock` với `status = LOCKED` và `expiresAt = now() + 10 phút`.

### 8.2. Xác thực Webhook: 4 Bước Kiểm tra Bắt buộc
Để ngăn chặn hoàn toàn gian lận thanh toán (ví dụ: chuyển 1.000đ cho đơn 1.000.000đ), Webhook handler thực thi **4 bước kiểm tra bắt buộc**:
1. **Xác thực chữ ký số:** Kiểm tra tính hợp lệ của mã băm HMAC-SHA256 từ `PAYOS_CHECKSUM_KEY`.
2. **Kiểm tra sự tồn tại của đơn hàng:** Truy vấn theo `orderCode` nhận từ Webhook.
3. **So khớp số tiền tuyệt đối:** So sánh `payload.amount === Number(order.finalAmount)`. Nếu không khớp, từ chối cập nhật trạng thái `PAID` và ghi log cảnh báo gian lận tài chính.
4. **Idempotency:** Nếu `order.paymentStatus === 'PAID'`, lập tức trả về `HTTP 200 OK` mà không can thiệp thêm lần nào.

### 8.3. Triệt tiêu Tranh chấp giữa Cron Job và Webhook (Chốt chặn duy nhất trên Order.status)
Để tránh lỗ hổng: *"Webhook vừa cập nhật Order thành PAID thì Cron quét thấy lock đang LOCKED nên cộng lại kho"*, hệ thống thiết lập **`Order.status` làm chốt chặn duy nhất** cho cả hai bên trong một Database Transaction:
* **Cron Job (Quét hủy đơn quá hạn 10 phút):**
  ```sql
  -- Bước 1: Chốt chặn duy nhất trên Order
  UPDATE "Order" SET "status" = 'CANCELLED' WHERE "id" = $orderId AND "status" = 'PENDING_PAYMENT';
  ```
  *Chỉ khi câu lệnh trên trả về đúng 1 dòng bị ảnh hưởng (affected === 1)*, Cron Job mới thực thi:
  ```sql
  UPDATE "InventoryLock" SET "status" = 'EXPIRED' WHERE "orderId" = $orderId AND "status" = 'LOCKED';
  UPDATE "ProductVariant" SET "stockQuantity" = "stockQuantity" + $quantity WHERE "id" = $variantId;
  ```
* **Webhook (Xác nhận thanh toán thành công):**
  ```sql
  -- Bước 1: Chốt chặn duy nhất trên Order
  UPDATE "Order" SET "status" = 'PAID', "paymentStatus" = 'PAID' WHERE "id" = $orderId AND "status" = 'PENDING_PAYMENT';
  ```
  *Chỉ khi câu lệnh trên trả về đúng 1 dòng bị ảnh hưởng (affected === 1)*, Webhook mới thực thi:
  ```sql
  UPDATE "InventoryLock" SET "status" = 'COMMITTED' WHERE "orderId" = $orderId AND "status" = 'LOCKED';
  UPDATE "Voucher" SET "usedCount" = "usedCount" + 1 WHERE "id" = $voucherId AND "usedCount" < "usageLimit";
  ```
* 👉 **Kết quả:** Vì `Order.status` chỉ có thể được chuyển từ `PENDING_PAYMENT` bởi **duy nhất một bên**, nếu Webhook đến trước thì Cron cập nhật trả về 0 dòng và không bao giờ hoàn kho; nếu Cron đến trước thì Webhook cập nhật trả về 0 dòng và rơi vào case thanh toán muộn.

### 8.4. Xử lý Webhook Thanh toán Muộn (Late Webhook - Conservative Refund)
* Nếu khách hàng chuyển khoản muộn (ở phút thứ 11) khi đơn hàng đã bị Cron Job hủy:
* Hệ thống áp dụng **chính sách an toàn đơn giản hóa (Conservative Refund Policy)**: Mọi Webhook hợp lệ gửi đến đơn hàng đã ở trạng thái `CANCELLED` sẽ tự động chuyển sang trạng thái **`PAYMENT_EXPIRED_PENDING_REFUND`**.
* Hệ thống không tự ý cấp lại kho hàng (để tránh xung đột nếu hàng đã bị người khác mua mất), mà thông báo để Quản trị viên đối soát và hoàn tiền an toàn cho khách hàng.

### 8.5. Khách vãng lai, Gộp giỏ hàng (Cart Merge) và Ràng buộc Checkout
* Khách vãng lai (Guest) được phép duyệt web, phối đồ và thêm sản phẩm vào giỏ hàng gắn với `sessionId`.
* **Ràng buộc:** Khách hàng **bắt buộc phải đăng nhập/đăng ký tài khoản** trước khi chuyển sang bước Checkout để tạo đơn hàng (`Order.userId` là trường bắt buộc).
* **Cơ chế Gộp giỏ (Cart Merge):** Tại thời điểm đăng nhập thành công:
  - Nếu sản phẩm trong guest cart đã tồn tại trong user cart (trùng `variantId`): **Cộng dồn số lượng**: `userItem.quantity += guestItem.quantity`.
  - Nếu sản phẩm chưa có trong user cart: Chuyển món đồ sang user cart.
  - Xóa giỏ hàng của guest và hủy `sessionId`.

### 8.6. An toàn Bảo mật cho Endpoint Mock Thanh toán (`/api/payments/mock-simulate`)
Để endpoint giả lập thanh toán không trở thành lỗ hổng bảo mật, hệ thống thiết lập **chốt chặn 3 lớp nghiêm ngặt**:
1. **Kiểm tra môi trường:** Endpoint chỉ hoạt động khi `NODE_ENV !== 'production'` VÀ `PAYMENT_MOCK_MODE === 'true'`. Trên môi trường production, API trả về `HTTP 404 Not Found`.
2. **Kiểm tra xác thực & Sở hữu:** Bắt buộc đăng nhập (`AuthGuard`) và đơn hàng phải thuộc quyền sở hữu của chính người dùng đó (`order.userId === currentUser.id` hoặc quyền `ADMIN`).
3. **Ký chữ ký số hợp lệ:** API mock tự động đóng gói payload chuẩn PayOS, tính toán mã băm HMAC-SHA256 bằng `PAYOS_CHECKSUM_KEY`, sau đó POST vào chính handler `/api/payments/webhook`, đảm bảo quy trình kiểm tra bảo mật chạy đầy đủ 100% như thật.

### 8.7. Phòng chống Spam Giữ Kho (Denial of Inventory) & Cấu hình Proxy
* **Chống chiếm dụng kho:** Giới hạn mỗi tài khoản người dùng chỉ được phép duy trì tối đa **02 đơn hàng ở trạng thái `PENDING_PAYMENT`** cùng một thời điểm (kết hợp câu lệnh khóa dòng `FOR UPDATE` trong database transaction để chặn triệt để race condition khi đặt hàng đồng thời). Đồng thời, hệ thống áp dụng cơ chế **Rate Limit theo địa chỉ IP (tối đa 10 lượt checkout/phút)** để ngăn ngừa tấn công brute-force và spam request.
* **Cấu hình Trust Proxy:** Khi triển khai qua Ngrok hoặc Reverse Proxy, Backend cấu hình `app.set('trust proxy', 1)` trong Express để trích xuất chính xác địa chỉ IP thực của client thông qua header `X-Forwarded-For`, ngăn ngừa việc toàn bộ request bị gán chung IP của proxy.

### 8.8. Quy tắc Vòng đời Mã Giảm Giá (Voucher Lifecycle & Concurrency)
* Khách hàng có thể gọi `/api/vouchers/apply` để xem trước số tiền được giảm.
* Khi gọi `/api/checkout/lock`, hệ thống kiểm tra lại tính hợp lệ của voucher và gán `voucherId` vào đơn hàng.
* **Quy tắc đếm lượt dùng:** Trường `usedCount` của Voucher **CHỈ TĂNG KHI đơn hàng chuyển sang trạng thái `PAID`** (thông qua Webhook) với câu lệnh cập nhật có điều kiện:
  ```sql
  UPDATE "Voucher" SET "usedCount" = "usedCount" + 1 WHERE "id" = $voucherId AND "usedCount" < "usageLimit";
  ```
* Nếu đơn hàng bị quá hạn 10 phút và chuyển sang `CANCELLED`, lượt sử dụng của voucher không bị tiêu hao.

### 8.9. Quản lý Máy trạng thái Đơn hàng (Order State Machine) & Thu hồi Kho Nguyên tử
Nhằm ngăn chặn hành vi chuyển trạng thái đơn hàng tùy tiện làm gãy chu trình nghiệp vụ hoặc thất thoát kho:
* **State Machine nghiêm ngặt (`allowedTransitions`):**
  - `PENDING_PAYMENT` $\rightarrow$ Chỉ được chuyển sang `CANCELLED`. Tuyệt đối không thể chuyển sang `PROCESSING` hay `SHIPPING` khi khách chưa hoàn tất thanh toán.
  - `PAID` $\rightarrow$ `PROCESSING` hoặc `CANCELLED`.
  - `PROCESSING` $\rightarrow$ `SHIPPING` hoặc `CANCELLED`.
  - `SHIPPING` $\rightarrow$ `DELIVERED` hoặc `CANCELLED`.
  - `DELIVERED` / `CANCELLED` $\rightarrow$ Trạng thái kết thúc, không được phép thay đổi.
* **Hoàn kho nguyên tử khi Hủy đơn `PENDING_PAYMENT`:**
  - Nếu Quản trị viên/Nhân viên chủ động hủy một đơn hàng đang ở trạng thái `PENDING_PAYMENT`, Backend thực thi trong Database `$transaction`:
    1. Cập nhật `Order.status = 'CANCELLED'`.
    2. Chuyển toàn bộ bản ghi `InventoryLock` liên quan từ `LOCKED` sang `EXPIRED`.
    3. Cộng trả lại số lượng tồn kho cho các biến thể sản phẩm tương ứng (`stockQuantity = stockQuantity + quantity`).
  - Đảm bảo hàng hóa không bị thất thoát hoặc bị "treo khóa kho vĩnh viễn".

### 8.10. Phòng chống Lỗ hổng Phân quyền & Thao túng Dữ liệu (IDOR Prevention & Input Guard)
* **Chống thao túng số lượng tồn kho (Anti-Stock Inflation):**
  - Áp dụng Zod Schema và chốt chặn kiểm tra bắt buộc `quantity` phải là số nguyên dương $\ge 1$.
  - Triệt tiêu hoàn toàn lỗ hổng kẻ gian truyền số lượng âm nhằm biến câu lệnh trừ kho thành cộng kho và làm sai lệch giá trị hóa đơn.
* **Chống truy cập trái phép đối tượng Giỏ hàng (Cart IDOR):**
  - Mọi thao tác cập nhật số lượng (`PATCH /api/cart/items/:id`) hoặc xóa món (`DELETE /api/cart/items/:id`) đều bắt buộc kiểm tra món hàng đó phải thuộc giỏ hàng của chính người dùng (`cartItem.cartId === cart.id`). Kẻ xấu không thể sửa/xóa giỏ hàng của người khác khi biết ID.
* **Chống gian lận liên kết thanh toán (Payment IDOR):**
  - Endpoint tạo QR code thanh toán (`POST /api/payments/create-qr`) kiểm tra chặt chẽ quyền sở hữu: Khách hàng chỉ được phép tạo mã thanh toán cho đơn hàng của chính tài khoản mình (`order.userId === req.user.id`).
* **Cơ chế Idempotency Webhook toàn diện:**
  - Webhook thanh toán trả về thành công ngay lập tức (Idempotent OK) nếu đơn hàng đã có `paymentStatus === 'PAID'` hoặc đã chuyển sang các bước xử lý tiếp theo (`PAID`, `PROCESSING`, `SHIPPING`, `DELIVERED`), bảo đảm không bị từ chối lỗi khi PayOS gửi lại thông báo nhiều lần.

---

## 9. Liên kết Tài liệu
* Kế hoạch triển khai & Phân rã công việc: [PLAN.md](./PLAN.md)
* Bảng phân tích mô hình đe dọa (Threat Model): [docs/threat-model.md](./docs/threat-model.md)
* Kịch bản Demo buổi báo cáo: [docs/DEMO_SCRIPT.md](./docs/DEMO_SCRIPT.md)
* Báo cáo đề xuất đồ án (Word): `Do_an_cuoi_ky/Ban_hang.docx`
