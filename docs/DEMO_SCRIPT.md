# TÀI LIỆU NỘI BỘ: KỊCH BẢN DEMO BẢO VỆ ĐỒ ÁN CUỐI KỲ (12 - 15 PHÚT)
> Dành riêng cho nhóm 4 thành viên chuẩn bị trước buổi vấn đáp với Hội đồng môn Thương mại điện tử.

---

## 1. Phân vai Trình bày trong Buổi Báo Cáo

* **Người thuyết trình slide & Mở đầu (0 - 3 phút):** Nguyễn Đăng Quang (Trưởng nhóm).
* **Người thao tác demo trực tiếp giao diện (3 - 10 phút):** Hoàng Đình Tân (Phối đồ & Đo size) và Nguyễn Đăng Quang (Storefront).
* **Người trình bày kiến trúc Backend & Kiểm soát đồng thời (10 - 13 phút):** Trần Nguyên (Backend Lead).
* **Người trình bày thanh toán, bảo mật & Admin Dashboard (13 - 15 phút):** Nhan Phi Phố (Payment & Security).

---

## 2. Kịch bản Diễn biến Từng Bước (Step-by-Step Script)

### Phần 1: Giới thiệu Bài toán và Kiến trúc Hệ thống (Phút 1 - 3)
* **Quang trình bày:**
  - Chào Thầy và Hội đồng. Giới thiệu đề tài: *Hệ thống TMĐT thời trang TrendyFit giải quyết 2 bài toán nhức nhối của ngành: Tỷ lệ hoàn hàng 30% do sai kích cỡ và trải nghiệm mua sắm rời rạc thiếu đồng bộ outfit.*
  - Trình bày nhanh slide Sơ đồ Kiến trúc Headless: Tách biệt Next.js 14 và Express TypeScript, cơ sở dữ liệu PostgreSQL chuẩn hóa 12 bảng.

### Phần 2: Trình diễn Module Phòng Phối Đồ Tương Tác - Outfit Builder (Phút 4 - 6)
* **Tân thao tác trên màn hình:**
  - Truy cập route `/outfit-builder`.
  - Màn hình hiển thị khung canvas phối đồ chia theo tầng: Áo khoác, Áo trong, Quần, Giày.
  - Thao tác click chọn thử: Chọn Áo blazer da đen $\rightarrow$ Chọn Áo thun trắng $\rightarrow$ Chọn Quần jean ống suông $\rightarrow$ Chọn Giày sneaker trắng.
  - Chỉ cho Thầy thấy: Thanh giá tự động cộng dồn 4 món và áp dụng chiết khấu combo 15%.
  - Bấm nút **"Thêm trọn bộ vào giỏ hàng"** $\rightarrow$ Hệ thống tự động tạo 4 CartItem cùng lúc chỉ trong 1 thao tác click.

### Phần 3: Trình diễn Thuật toán Gợi ý Size Thông Minh - Smart Fit Advisor (Phút 7 - 9)
* **Tân thao tác tiếp:**
  - Vào xem 1 sản phẩm chi tiết (ví dụ: Áo khoác Blazer).
  - Bấm nút **"Gợi ý kích cỡ thông minh"** $\rightarrow$ Modal popup hiện lên.
  - Nhập thông số thực tế của một bạn trong nhóm: Chiều cao `172 cm`, Cân nặng `64 kg`, Vòng ngực `92 cm`, chọn form `Oversize (Rộng rãi)`.
  - Bấm nút **"Tính toán kích cỡ"** $\rightarrow$ Thuật toán Backend trả về kết quả ngay lập tức: *Đề xuất Size L (Độ vừa vặn 94%)*.
  - Bấm *"Áp dụng kích cỡ này"* $\rightarrow$ Nút chọn size trên trang tự động nhảy sang Size L.

### Phần 4: Trình diễn Khóa Kho Đồng Thời & Thanh Toán VietQR (Phút 10 - 12)
* **Nguyên & Phố phối hợp trình bày:**
  - Chuyển sang giỏ hàng và bấm **"Thanh toán"**.
  - **Nguyên giải thích kỹ thuật:** *Tại thời điểm bấm thanh toán, hệ thống thực hiện một Database Transaction với Pessimistic Lock, ghi nhận bản ghi `InventoryLock` giữ hàng trong 10 phút. Nếu 2 người cùng tranh mua 1 sản phẩm cuối cùng, người thứ 2 sẽ bị từ chối ngay với HTTP 409.*
  - **Phố thao tác thanh toán:**
    - Màn hình hiện mã VietQR động cùng đồng hồ đếm ngược `10:00`.
    - Dùng điện thoại quét mã VietQR (hoặc dùng nút "Mô phỏng quét mã thành công" nếu mạng trường chập chờn).
    - Webhook bắn về Backend, kiểm tra chữ ký HMAC-SHA256, chuyển trạng thái đơn sang `PAID` và cập nhật khóa kho sang `COMMITTED`. Màn hình tự động chuyển sang trang *"Đặt hàng thành công"*.

### Phần 5: Quản trị Admin Dashboard & Báo cáo Doanh thu (Phút 13 - 15)
* **Phố thao tác:**
  - Mở tab Admin Dashboard: Đăng nhập tài khoản `admin@trendyfit.vn`.
  - Cho Thầy thấy đơn hàng vừa thanh toán đã xuất hiện ở đầu danh sách đơn hàng với trạng thái `PAID`.
  - Vào mục Quản lý Kho: Số lượng tồn kho của chiếc áo vừa mua đã tự động giảm đi 1.
  - Mở trang Thống kê: Biểu đồ doanh thu tự động cập nhật doanh số của đơn hàng vừa tạo.

---

## 3. Câu hỏi Dự phòng Thầy Cô Có Thể Hỏi (Q&A Preparation)

**Câu 1: "Tại sao nhóm chọn Headless thay vì Monolith?"**
* *Trả lời (Nguyên):* Dạ thưa Thầy, thời trang yêu cầu trải nghiệm tương tác giao diện rất cao (như phòng phối đồ Outfit Builder hay Modal đo size) cần render mượt mà ở Client, trong khi trang sản phẩm cần Server-Side Rendering để tối ưu SEO. Kiến trúc Headless tách biệt giúp nhóm linh hoạt công nghệ, Backend chuẩn RESTful API có thể tái sử dụng cho Mobile App trong tương lai.

**Câu 2: "Khóa kho 10 phút nếu khách không thanh toán thì xử lý thế nào?"**
* *Trả lời (Phố):* Dạ thưa Thầy, nhóm cài đặt một tác vụ nền Cron Job chạy định kỳ mỗi 60 giây. Khi quét thấy các bản ghi `InventoryLock` có `status = LOCKED` nhưng đã quá thời hạn `expiresAt`, hệ thống tự động đổi sang `EXPIRED`, hủy đơn và nhả số lượng hàng đó lại cho kho khả dụng để người khác có thể mua được ngay.

**Câu 3: "Làm sao chống việc PayOS gửi Webhook trùng lặp?"**
* *Trả lời (Phố):* Dạ thưa Thầy, nhóm áp dụng cơ chế Idempotency. Trước khi xử lý đơn, hệ thống kiểm tra trường `paymentStatus` trong bảng `Order`. Nếu đơn đã ở trạng thái `PAID`, hệ thống lập tức trả về HTTP 200 OK và không can thiệp trừ kho hay cập nhật trạng thái thêm lần nào nữa.
