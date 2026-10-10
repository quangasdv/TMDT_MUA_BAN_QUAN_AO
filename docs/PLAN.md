# Kế hoạch Triển khai Dự án TRENDYFIT (Project Implementation Plan)

Tài liệu quản lý tiến độ, phân rã công việc (WBS) và theo dõi đầu việc của nhóm 4 sinh viên thực hiện đồ án môn Thương mại điện tử.

---

## 1. Phân bổ Vai trò & Trách nhiệm (RACI Matrix)

| Thành viên | Vai trò | Trách nhiệm chính (Accountable) |
| :--- | :--- | :--- |
| **Nguyễn Đăng Quang** | Nhóm trưởng / Frontend Lead | • Kiến trúc dự án Next.js 16 (Turbopack), Tailwind CSS, Shadcn UI.<br>• Xây dựng giao diện Storefront: Trang chủ, Danh mục, Chi tiết sản phẩm, Giỏ hàng.<br>• **Xây dựng Giao diện Admin Dashboard (UI Layout, Table quản lý, Biểu đồ thống kê)**.<br>• Quản trị mã nguồn, điều phối tiến độ chung và phụ trách Slide báo cáo. |
| **Trần Nguyên** | Backend Lead & Database Architect | • Thiết kế chuẩn hóa cơ sở dữ liệu (ERD - 14 model), viết Prisma Schema (^5.18.0) & Migration.<br>• Xây dựng hệ thống RESTful API cho Sản phẩm, Biến thể, Danh mục, Đơn hàng, Auth (có Refresh Token/Logout).<br>• Tối ưu hóa truy vấn dữ liệu, chống Deadlock khi cập nhật nhiều biến thể, cơ chế Cart Merge (cộng dồn số lượng). |
| **Hoàng Đình Tân** | Fullstack Developer | • **Xây dựng Module Phòng phối đồ tương tác (Outfit Builder Canvas 2D + Outfit API)**.<br>• **Xây dựng Thuật toán Smart Fit Advisor (Backend service + Modal đo size)**.<br>• **Xây dựng Cart API (CRUD & Cập nhật số lượng `PATCH /api/cart/items/:id`, chống IDOR)**.<br>• **Xây dựng Voucher Apply API (`POST /api/vouchers/apply` kiểm tra tính hợp lệ & xem trước giảm giá)**. |
| **Nhan Phi Phố** | Payment, Security & Operations Lead | • Tích hợp cổng VietQR/PayOS kèm 4 bước xác thực Webhook và **chống đè Cron-Webhook (chốt chặn duy nhất trên `Order.status`)**.<br>• Xây dựng Mock Signature API an toàn 3 lớp (`NODE_ENV`, `PAYMENT_MOCK_MODE`, `AuthGuard`).<br>• Xây dựng cơ chế khóa giữ kho Atomic & Cron hoàn kho, cấu hình `trust proxy` trong Express, Rate limit (`express-rate-limit`).<br>• Xây dựng Admin Backend APIs (`/api/admin/*`, Order State Machine), thực hiện 07 ca kiểm thử an toàn và hoàn thiện [docs/threat-model.md](./docs/threat-model.md). |

---

## 2. Kế hoạch Tiến độ 5 Tuần (5-Week Roadmap)

### Tuần 1: Khởi động, Khảo sát & Thiết kế Kiến trúc
- [ ] Hoàn thiện bản đề xuất đề tài nộp Thầy phê duyệt.
- [ ] Thiết kế Sơ đồ Kiến trúc hệ thống tổng thể (Headless Architecture).
- [ ] Thiết kế Sơ đồ Cơ sở Dữ liệu quan hệ (ERD - chính xác 14 bảng thực thể, Prisma ^5.18.0).
- [ ] Vẽ 02 Sơ đồ Tuần tự (Sequence Diagram): Luồng đặt hàng & Khóa kho Atomic, Luồng Webhook thanh toán (có 4 bước kiểm tra & Idempotency).
- [ ] Vẽ Sơ đồ Máy trạng thái đơn hàng (Order State Machine bao gồm `PAYMENT_EXPIRED_PENDING_REFUND`).
- [ ] Hoàn thiện tài liệu Phân tích mô hình đe dọa [docs/threat-model.md](./docs/threat-model.md) (14 mối đe dọa).
- [ ] Thiết lập Git Repository, quy ước đặt tên nhánh (`feature/`, `fix/`) và commit.
- [ ] Khởi tạo khung dự án (Boilerplate): `client/` (Next.js 16 Turbopack) và `server/` (Express + TypeScript, `trust proxy`).

### Tuần 2: Xây dựng Core MVP (Cơ sở dữ liệu, Xác thực & Danh mục)
- [ ] Chạy migration Prisma schema cho 14 models và viết script nạp dữ liệu mẫu (`seed.ts`).
- [ ] Xây dựng luồng Xác thực: Đăng ký, Đăng nhập, Cấp mới Token (`/api/auth/refresh`), Đăng xuất (`/api/auth/logout`), middleware RBAC phân quyền `ADMIN`, `STAFF`, `CUSTOMER`.
- [ ] Xây dựng cơ chế Gộp giỏ hàng (Cart Merge): Khi đăng nhập, nếu món trùng `variantId` thì cộng dồn số lượng, chuyển món mới sang user cart và xóa guest cart.
- [ ] Xây dựng API Sản phẩm & Danh mục: Hỗ trợ tìm kiếm từ khóa `q`, lọc theo khoảng giá, màu sắc, size.
- [ ] Xây dựng Frontend: Trang chủ, Trang danh mục (Sidebar bộ lọc), Trang chi tiết sản phẩm (Bộ chọn màu/size), Giỏ hàng có cập nhật số lượng (`PATCH /api/cart/items/:id`).

### Tuần 3: Phát triển Module Đột phá (Outfit Builder & Smart Fit Advisor)
- [ ] Thu thập và xử lý bộ ảnh sản phẩm mẫu tách nền PNG trong suốt.
- [ ] Phát triển giao diện Phòng phối đồ tương tác (Outfit Builder Canvas 2D xếp lớp theo slot).
- [ ] Xây dựng logic tự động tính tổng tiền cả set và áp dụng chiết khấu combo 15%.
- [ ] Xây dựng Modal Smart Fit Advisor: Nhập chiều cao, cân nặng, số đo, sở thích mặc ôm/rộng.
- [ ] Viết thuật toán Backend `/api/fit-advisor/recommend` tính độ lệch so với bảng `SizeChart` và trả về `FitScore (%)`.
- [ ] Xây dựng API `/api/vouchers/apply` kiểm tra tính hợp lệ và tính số tiền giảm giá trước khi checkout.
- [ ] Xây dựng giao diện Admin Dashboard UI (Next.js Admin Layout: quản lý sản phẩm, đơn hàng, biểu đồ).

### Tuần 4: Tích hợp Thanh toán, Khóa kho Concurrency & Admin Dashboard
- [ ] Xây dựng logic Khóa giữ kho 10 phút (Atomic Conditional Update trừ kho ngay, sắp xếp `variantId` tăng dần chống Deadlock).
- [ ] Tích hợp SDK PayOS sinh mã VietQR động kèm đồng hồ đếm ngược 10:00.
- [ ] Xây dựng API `/api/payments/mock-simulate` bảo vệ 3 lớp, tự động ký chữ ký HMAC-SHA256 rồi gọi vào handler Webhook phục vụ demo an toàn.
- [ ] Xây dựng Webhook handler: 4 bước kiểm tra bắt buộc (Chữ ký HMAC-SHA256, orderCode, so khớp `payload.amount === order.finalAmount`, Idempotency).
- [ ] Xử lý chống đè Cron Job và Webhook: **Lấy `Order.status` làm chốt chặn duy nhất** cho cả hai bên trong Database Transaction (`WHERE status = 'PENDING_PAYMENT'`).
- [ ] Áp dụng chính sách an toàn đơn giản hóa (Conservative Refund Policy) cho ca thanh toán muộn (`PAYMENT_EXPIRED_PENDING_REFUND`).
- [ ] Cài đặt giới hạn chống Denial of Inventory (tối đa 2 đơn `PENDING_PAYMENT`/user hoặc IP, cấu hình `trust proxy`).
- [ ] Cập nhật có điều kiện `usedCount < usageLimit` cho Voucher lúc đơn chuyển sang `PAID`.
- [ ] Hoàn thiện Admin Backend APIs: Phân quyền duyệt đơn (cho phép cả Admin và Staff).

### Tuần 5: Kiểm thử An toàn, Đóng gói & Báo cáo
- [ ] Thực thi 06 ca kiểm thử an toàn bắt buộc theo kịch bản trong `docs/threat-model.md` (TC01: Race condition, TC02: Webhook 4 bước, TC03: IDOR/RBAC, TC04: SQLi/XSS, TC05: Rate limiting & Denial of inventory, TC06: Mock security).
- [ ] Viết Báo cáo đồ án chính thức (Word - tối đa 5 trang theo đúng quy định của đề cương).
- [ ] Thiết kế Slide thuyết trình bảo vệ đồ án.
- [ ] Tập dượt kịch bản Demo trực tiếp theo tài liệu nội bộ [docs/DEMO_SCRIPT.md](./docs/DEMO_SCRIPT.md).
- [ ] Quay 01 video clip demo dự phòng (đề phòng sự cố mạng hoặc lỗi phần cứng khi bảo vệ).
