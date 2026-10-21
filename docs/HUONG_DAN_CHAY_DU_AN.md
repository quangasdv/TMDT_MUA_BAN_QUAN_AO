# HƯỚNG DẪN KHỞI CHẠY HỆ THỐNG TRENDYFIT (RUNNING GUIDE)
> Hướng dẫn từng bước cách chạy đồng thời Backend (Port 5000) và Frontend (Port 3000) để kết nối hệ thống trơn tru, không bị lỗi `Network Error`.

---

## 1. Nguyên nhân lỗi "Network Error" (như trong ảnh kiểm thử)

Khi bạn mở giao diện Frontend tại `http://localhost:3000` và bấm các nút:
* `Gọi GET /api/auth/me`
* `Gọi POST /api/auth/refresh`

Trình duyệt báo **`Lỗi: Network Error`** là vì: **Hệ thống Backend (Port 5000) CHƯA ĐƯỢC BẬT**. Frontend không tìm thấy server tại `http://localhost:5000/api` nên kết nối bị gián đoạn.

👉 **Cách khắc phục:** Chỉ cần mở thêm một cửa sổ Terminal để chạy Backend theo hướng dẫn bên dưới.

---

## 2. Hướng dẫn Chạy Backend (Port 5000)

Mở một cửa sổ **Terminal thứ nhất** (PowerShell hoặc Command Prompt) tại thư mục gốc dự án:

### Bước 2.1. Di chuyển vào thư mục server
```bash
cd server
```

### Bước 2.2. Cài đặt thư viện (nếu là lần đầu tải code về)
```bash
npm install
```

### Bước 2.3. Sinh Prisma Client & Đồng bộ CSDL Supabase
```bash
npx prisma generate
npx prisma db push
```

### Bước 2.4. Nạp dữ liệu mẫu (Sản phẩm, Bảng size, Tài khoản Demo)
```bash
npm run db:seed
```
*(Nếu đã seed trước đó rồi thì có thể bỏ qua bước này).*

### Bước 2.5. Khởi động Backend Server
```bash
npm run dev
```

Khi khởi động thành công, màn hình Terminal sẽ hiển thị:
```text
🚀 TrendyFit Server đang lắng nghe tại: http://localhost:5000
⏰ [Cron Service] Đã kích hoạt tiến trình tự động quét đơn quá hạn 10 phút.
```
> ⚠️ **LƯU Ý QUAN TRỌNG:** Giữ nguyên cửa sổ Terminal này để Backend luôn hoạt động. Không được bấm `Ctrl + C` tắt đi.

---

## 3. Hướng dẫn Chạy Frontend (Port 3000)

Mở thêm một cửa sổ **Terminal thứ hai** (tách biệt với Terminal của Backend):

### Bước 3.1. Di chuyển vào thư mục client
```bash
cd client
```

### Bước 3.2. Cài đặt thư viện (nếu là lần đầu chạy)
```bash
npm install
```

### Bước 3.3. Khởi động Frontend Next.js
```bash
npm run dev
```

Khi chạy thành công, Terminal sẽ hiển thị:
```text
▲ Next.js 16.3.8 (Turbopack)
- Local: http://localhost:3000
```

---

## 4. Kiểm tra Kết quả trên Trình duyệt

1. Mở trình duyệt web và truy cập vào: **`http://localhost:3000`**
2. Bấm lại nút **`Gọi GET /api/auth/me`** hoặc **`Gọi POST /api/auth/refresh`**:
   - Lúc này kết quả sẽ trả về JSON thành công, **không còn bị `Network Error` nữa!**
3. Thử đăng nhập bằng các tài khoản có sẵn trong hệ thống:

| Vai trò | Email đăng nhập | Mật khẩu | Chức năng test |
| :--- | :--- | :--- | :--- |
| **Quản trị viên (Admin)** | `admin@trendyfit.vn` | `Admin@123456` | Thử truy cập phân hệ Admin Dashboard |
| **Nhân viên (Staff)** | `staff@trendyfit.vn` | `Staff@123456` | Quản lý duyệt đơn hàng |
| **Khách hàng (Customer)** | `customer@gmail.com` | `Customer@123456` | Mua sắm, đo size, thêm giỏ, thanh toán |
