# BẢNG PHÂN TÍCH MÔ HÌNH ĐE DỌA VÀ KẾ HOẠCH KIỂM THỬ AN TOÀN (THREAT MODELING)
> Tài liệu kỹ thuật phục vụ thẩm định an toàn thông tin đồ án môn Thương Mại Điện Tử - Hệ thống TrendyFit.

---

## 1. Phương pháp luận Đánh giá
Hệ thống TrendyFit áp dụng mô hình phân loại mối đe dọa **STRIDE** kết hợp khung chuẩn bảo mật ứng dụng web **OWASP Top 10** nhằm nhận diện, khoanh vùng rủi ro và thiết lập các chốt chặn an toàn tương ứng trên toàn bộ luồng nghiệp vụ TMĐT.

---

## 2. Bảng Ma trận Mối đe dọa & Biện pháp Khắc phục (Threat Matrix)

| Mã nguy cơ | Tên mối đe dọa (Threat) | Phân loại (STRIDE) | Tác nhân & Kịch bản tấn công | Mức độ | Biện pháp ngăn chặn kỹ thuật (Mitigation) | Ca kiểm thử đối chiếu |
| :---: | :--- | :---: | :--- | :---: | :--- | :---: |
| **TH-01** | **Bán âm kho do tranh chấp tài nguyên (Race Condition)** | Tampering / DoS | Nhiều người dùng hoặc script tự động cùng gửi request checkout cho 01 sản phẩm tồn kho duy nhất cùng một thời điểm. | **Nghiêm trọng** | Sử dụng **Atomic Conditional Update** trong Database Transaction: `UPDATE ... WHERE stockQuantity >= quantity`. Sắp xếp các `variantId` theo thứ tự tăng dần trước khi cập nhật để triệt tiêu Deadlock. | **TC-01** |
| **TH-02** | **Giả mạo Webhook Thanh toán (Webhook Forgery)** | Spoofing / Tampering | Kẻ tấn công gửi HTTP POST giả mạo tới `/api/payments/webhook` báo đơn đã thanh toán để chiếm đoạt hàng hóa. | **Nghiêm trọng** | Backend tính toán mã băm và **xác thực chữ ký số HMAC-SHA256** đính kèm trong header/payload bằng `PAYOS_CHECKSUM_KEY`. Từ chối request nếu sai lệch. | **TC-02a** |
| **TH-03** | **Gian lận số tiền thanh toán (Payment Amount Tampering)** | Tampering | Kẻ xấu thanh toán số tiền nhỏ hơn (ví dụ đơn 1.000.000đ nhưng chỉ trả 1.000đ) hòng chiếm đoạt đơn hàng. | **Nghiêm trọng** | Backend bắt buộc kiểm tra sự tồn tại của `orderCode` VÀ **so khớp số tiền tuyệt đối**: `payload.amount === Number(order.finalAmount)`. Nếu sai lệch, từ chối cập nhật `PAID`. | **TC-02b** |
| **TH-04** | **Tranh chấp đồng thời giữa Cron Job và Webhook** | Tampering / Consistency | Webhook báo thành công ở giây 599 đúng lúc Cron Job đang chạy hủy đơn 10 phút, dẫn đến nguy cơ vừa thành công vừa hoàn kho. | **Cao** | **Chốt chặn duy nhất trên `Order.status`**: Cả Cron và Webhook đều bắt đầu bằng `UPDATE "Order" ... WHERE status = 'PENDING_PAYMENT'`. Chỉ bên nào cập nhật thành công (affected === 1) mới được đổi lock và hoàn/trừ kho. | **TC-02c** |
| **TH-05** | **Gọi trùng lặp Webhook (Webhook Replay Attack)** | Tampering | Cổng thanh toán gửi lại webhook nhiều lần do mạng chập chờn, hoặc kẻ xấu cố tình replay request hợp lệ cũ sau khi đơn đã xử lý. | **Trung bình** | **Idempotent Webhook Handler**: Kiểm tra `order.paymentStatus === 'PAID'` hoặc `['PAID', 'PROCESSING', 'SHIPPING', 'DELIVERED'].includes(order.status)`. Nếu đã thanh toán, trả về ngay HTTP 200 OK (Idempotent) mà không can thiệp CSDL. | **TC-02d** |
| **TH-06** | **Lạm dụng endpoint giả lập thanh toán (Mock Endpoint Abuse)** | Elevation of Privilege | Kẻ xấu tự ý gọi API `/api/payments/mock-simulate` trên môi trường thật để tự đánh dấu đơn hàng là đã thanh toán mà không trả tiền. | **Nghiêm trọng** | **Chốt chặn 3 lớp**: 1. Chỉ kích hoạt khi `NODE_ENV !== 'production'` VÀ `PAYMENT_MOCK_MODE === 'true'`. 2. Bắt buộc đăng nhập (`AuthGuard`). 3. Kiểm tra tính sở hữu: `order.userId === currentUser.id`. | **TC-06** |
| **TH-07** | **Truy cập trái phép dữ liệu đối tượng (BOLA / IDOR)** | Information Disclosure / Elevation | Khách hàng A sửa `id` món trong giỏ hàng, `orderId` hoặc tạo mã QR đơn hàng của Khách hàng B. | **Cao** | 1. **Đơn hàng:** `order.userId === currentUserId`. 2. **Giỏ hàng:** Bắt buộc kiểm tra `cartItem.cartId === cart.id` khi sửa/xóa món. 3. **Tạo QR:** Kiểm tra `order.userId === currentUser.id`. Trả về HTTP 403 Forbidden nếu không sở hữu. | **TC-03a** |
| **TH-08** | **Leo thang đặc quyền phân hệ quản trị (Privilege Escalation)** | Elevation of Privilege | Tài khoản người dùng thông thường cố tình gọi các endpoint `/api/admin/products` hoặc `/api/admin/vouchers`. | **Cao** | Áp dụng **RBAC** qua middleware `RoleGuard`. Chặn mọi request không có claim `role === 'ADMIN'`. Cho phép `STAFF` xử lý duyệt đơn tại `/api/admin/orders`. | **TC-03b** |
| **TH-09** | **Chèn mã độc dữ liệu (SQL Injection & Stored XSS)** | Tampering / Info Disclosure | Kẻ xấu nhập `' OR 1=1 --` vào thanh tìm kiếm từ khóa `q` hoặc chèn thẻ `<script>` vào form địa chỉ giao hàng. | **Cao** | Sử dụng **Prisma Parameterized Queries** cho mọi câu truy vấn; áp dụng thư viện `DOMPurify` và cơ chế escape ký tự mặc định của React/Next.js cho mọi dữ liệu hiển thị. | **TC-04** |
| **TH-10** | **Spam request làm tê liệt hệ thống (API Abuse / DoS)** | Denial of Service | Tấn công Brute-force mật khẩu tại `/api/auth/login` hoặc spam tạo hàng trăm đơn hàng rác để làm nghẽn hệ thống. | **Cao** | Cài đặt `express-rate-limit`: Giới hạn tối đa 100 requests/phút cho route thường (`apiLimiter`), 10 requests/phút cho Auth (`authLimiter`) và 10 requests/phút cho Checkout (`checkoutLimiter`) trên mỗi IP. | **TC-05a** |
| **TH-11** | **Spam giữ kho làm kiệt quệ hàng hóa (Denial of Inventory)** | Denial of Service | Kẻ xấu liên tục tạo đơn hàng mới để chiếm giữ khóa kho 10 phút, khiến khách hàng thực sự không mua được đồ. | **Trung bình** | Giới hạn mỗi tài khoản hoặc IP chỉ được duy trì tối đa **02 đơn hàng `PENDING_PAYMENT`** cùng lúc. Bật `app.set('trust proxy', 1)` để nhận đúng IP thực của client qua proxy. | **TC-05b** |
| **TH-12** | **Vượt giới hạn sử dụng mã giảm giá khi thanh toán đồng thời** | Tampering / Financial | Nhiều đơn hàng cùng áp dụng một mã voucher sắp hết lượt dùng, khi cùng thanh toán có thể làm `usedCount` vượt quá `usageLimit`. | **Thấp** | Khi Webhook chuyển đơn sang `PAID`, cập nhật có điều kiện nguyên tử: `UPDATE "Voucher" SET usedCount = usedCount + 1 WHERE id = $id AND usedCount < usageLimit`. Nếu trả về 0 dòng, ghi log cảnh báo đối soát. | **TC-02e** |
| **TH-13** | **Thao túng số lượng đầu vào làm tăng tồn kho (Negative Quantity Guard)** | Tampering / Integrity | Kẻ xấu gửi số lượng âm (`quantity < 0`) khi checkout hoặc sửa giỏ hàng nhằm biến lệnh trừ kho thành cộng kho và làm giảm tổng tiền. | **Nghiêm trọng** | Dùng Zod Schema kiểm tra bắt buộc `quantity: z.number().int().min(1)`. Tầng Service kiểm tra `!Number.isInteger(quantity) || quantity <= 0` trả về HTTP 400. | **TC-07a** |
| **TH-14** | **Chuyển trạng thái đơn hàng sai luồng & Thất thoát tồn kho khi Admin hủy đơn** | Tampering / Consistency | Admin/Staff chuyển sai luồng (đơn chưa trả tiền nhảy sang `SHIPPING`), hoặc hủy đơn `PENDING_PAYMENT` khiến kho bị thất thoát. | **Nghiêm trọng** | Cài đặt **Order State Machine** chặt chẽ (`allowedTransitions`). Khi hủy đơn `PENDING_PAYMENT`, tự động thực thi transaction đổi Lock sang `EXPIRED` và hoàn lại `stockQuantity` ngay lập tức. | **TC-07b** |

---

## 3. Quy trình Thực thi 06 Ca Kiểm thử Bảo mật Chính

### Ca kiểm thử TC-01: Kiểm soát tranh chấp kho đồng thời (Concurrency Race Condition Test)
* **Điều kiện tiên quyết:**
  - 01 sản phẩm biến thể (SKU: `AO-BLAZER-DEN-L`) được cấu hình số lượng tồn kho khả dụng đúng **1 cái** (`stockQuantity = 1`).
  - Môi trường kiểm thử kích hoạt biến môi trường `DISABLE_RATE_LIMIT_FOR_TEST=true` để tránh bị middleware chặn nhầm request thử nghiệm.
  - Chuẩn bị **10 tài khoản khách hàng thử nghiệm khác nhau** (từ `test_user_01` đến `test_user_10`) với 10 JWT Token riêng biệt (mỗi tài khoản tạo đúng 1 đơn hàng để không bị chốt chặn tối đa 2 đơn pending/user của TH-11).
* **Kịch bản kiểm thử:** Sử dụng công cụ `k6` cấu hình 10 Virtual Users (10 VUs) hoặc script Node.js với `Promise.all` gửi đồng thời 10 HTTP POST request tới endpoint `/api/checkout/lock` để mua sản phẩm này.
* **Kết quả kỳ vọng:**
  - Đúng **01 request** đầu tiên xử lý thành công, trả về HTTP 201 Created kèm mã khóa kho `InventoryLock`.
  - **09 request** còn lại bị câu lệnh Atomic Update từ chối, nhận mã phản hồi HTTP 409 Conflict với thông báo `"Sản phẩm tạm thời hết hàng"`.
  - Tồn kho của sản phẩm không bị âm (`stockQuantity = 0`).

### Ca kiểm thử TC-02: Kiểm tra 4 Bước Xác thực Webhook, Tranh chấp Cron & Concurrency Voucher
* **TC-02a (Bước 1 - Giả mạo chữ ký):** Gửi POST request tới `/api/payments/webhook` với chữ ký sai.
  - *Kết quả:* Bị từ chối với HTTP 401 Unauthorized do không khớp mã băm HMAC-SHA256.
* **TC-02b (Bước 2 & 3 - Gian lận số tiền):** Đơn hàng trị giá 500.000đ, nhưng gửi payload Webhook có số tiền `amount = 50000` (50.000đ) dù có chữ ký hợp lệ.
  - *Kết quả:* Backend so khớp `payload.amount !== order.finalAmount`, từ chối cập nhật `PAID`, ghi log cảnh báo chênh lệch số tiền thanh toán.
* **TC-02c (Chống đè Cron và Webhook):** Mô phỏng request Webhook gửi đến đúng giây 599 khi Cron Job đang thực thi hủy đơn quá hạn.
  - *Kết quả:* Cả hai bên đều dùng chốt chặn nguyên tử trên `Order.status = 'PENDING_PAYMENT'`. Chỉ một bên cập nhật thành công (affected === 1); hệ thống không bao giờ bị tình trạng vừa `PAID` vừa cộng hoàn kho hai lần.
* **TC-02d (Bước 4 - Idempotency):** Gửi liên tiếp 3 lần Webhook hợp lệ giống hệt nhau.
  - *Kết quả:* Lần đầu xử lý thành công đổi sang `PAID`; lần 2 và 3 nhận diện `order.paymentStatus === 'PAID'` lập tức trả về HTTP 200 OK mà không đụng vào kho hay dữ liệu.
* **TC-02e (Kiểm thử tranh chấp mã giảm giá Voucher):** Mã voucher còn đúng 1 lượt dùng cuối cùng (`usageLimit - usedCount = 1`), có 2 đơn hàng khác nhau cùng áp dụng mã này và cùng thanh toán thành công qua Webhook gần như đồng thời.
  - *Kết quả:* Câu lệnh `UPDATE "Voucher" ... WHERE usedCount < usageLimit` đảm bảo chỉ có đúng **01 đơn hàng** cập nhật tăng `usedCount` thành công, `usedCount` tuyệt đối không vượt quá `usageLimit`.
  - *Xử lý ngoại lệ:* Đơn hàng thứ hai (cập nhật voucher trả về 0 dòng) vẫn được công nhận là **`PAID`** vì khách hàng đã chuyển tiền thực tế, hệ thống tự động ghi log cảnh báo: `"VOUCHER_OVER_LIMIT_ACCEPTED: Voucher đã chạm giới hạn lúc thanh toán"` để quản trị viên hạch toán chiết khấu.

### Ca kiểm thử TC-03: Kiểm tra phân quyền RBAC và Chống truy cập trái phép IDOR
* **TC-03a (IDOR):** Khách hàng A (ID: `user-01`) dùng Token của mình gọi `GET /api/orders/{orderId_cua_Customer_B}`.
  - *Kết quả:* Trả về HTTP 403 Forbidden.
* **TC-03b (Admin RBAC):** Khách hàng A dùng Token gọi `POST /api/admin/products` để tạo sản phẩm mới.
  - *Kết quả:* Trả về HTTP 403 Forbidden.
* **TC-03c (Staff RBAC):** Tài khoản Staff dùng Token gọi `PATCH /api/admin/orders/{id}/status`.
  - *Kết quả:* Được chấp thuận xử lý đơn hàng (HTTP 200 OK); nhưng nếu gọi `POST /api/admin/vouchers` thì bị chặn (HTTP 403 Forbidden).

### Ca kiểm thử TC-04: Kiểm thử an toàn dữ liệu đầu vào (SQL Injection & XSS)
* **Kịch bản 1:** Nhập chuỗi `' OR '1'='1' --` vào ô tìm kiếm sản phẩm `GET /api/products?q=...`.
  - *Kết quả:* Prisma ORM tham số hóa câu truy vấn, hệ thống tìm kiếm đúng chuỗi ký tự thô, không gây lộ cấu trúc bảng hay trả về toàn bộ database.
* **Kịch bản 2:** Nhập chuỗi `<script>alert('XSS')</script>` vào trường địa chỉ giao hàng (`shippingAddress`) hoặc tên người nhận (`recipientName`).
  - *Kết quả:* Dữ liệu được lưu và render an toàn dưới dạng text thuần, không thực thi mã JavaScript trên trình duyệt.

### Ca kiểm thử TC-05: Kiểm tra giới hạn tần suất request (Rate Limiting) & Chống Spam giữ kho
* **TC-05a:** Gửi liên tục 30 request đăng nhập sai mật khẩu tới `/api/auth/login` trong 3 giây.
  - *Kết quả:* Từ request thứ 6 trở đi, server chặn lại với mã lỗi HTTP 429 Too Many Requests.
* **TC-05b:** Một tài khoản tạo liên tiếp 3 đơn hàng ở trạng thái `PENDING_PAYMENT` mà chưa thanh toán.
  - *Kết quả:* Tại đơn thứ 3, hệ thống chặn lại với thông báo: *"Bạn đang có 2 đơn hàng chờ thanh toán, vui lòng hoàn tất hoặc hủy đơn cũ trước khi tạo đơn mới."*

### Ca kiểm thử TC-06: Kiểm thử an toàn Endpoint Giả lập thanh toán (`/api/payments/mock-simulate`)
* **Kịch bản 1 (Môi trường cấm):** Đổi cấu hình `NODE_ENV=production` hoặc `PAYMENT_MOCK_MODE=false` rồi gọi API mock.
  - *Kết quả:* Trả về HTTP 404 Not Found hoặc HTTP 403 Forbidden. Chức năng mock bị vô hiệu hóa hoàn toàn trên môi trường production.
* **Kịch bản 2 (Xâm phạm quyền sở hữu):** Khách hàng A đăng nhập và cố tình gọi API mock để thanh toán cho đơn hàng của Khách hàng B.
  - *Kết quả:* Trả về HTTP 403 Forbidden vì `order.userId !== currentUser.id`.

### Ca kiểm thử TC-07: Kiểm thử Toàn vẹn Dữ liệu Đầu vào & Order State Machine
* **TC-07a (Chống số lượng âm):** Gửi POST `/api/checkout/lock` với `items: [{ variantId: "...", quantity: -2 }]`.
  - *Kết quả:* Zod Validation và Inventory Service chặn ngay lập tức với HTTP 400 Bad Request: `"Số lượng sản phẩm đặt mua phải là số nguyên dương (tối thiểu là 1)."`. Tồn kho không bị thay đổi.
* **TC-07b (State Machine & Hoàn kho khi Hủy đơn):** 
  - Khách hàng tạo đơn ở trạng thái `PENDING_PAYMENT` (đã khóa 2 sản phẩm). 
  - Admin gọi `PATCH /api/admin/orders/:id/status` với `status = "SHIPPING"`.
    - *Kết quả:* Bị từ chối HTTP 400: `"Không thể chuyển trạng thái từ 'PENDING_PAYMENT' sang 'SHIPPING'"`.
  - Admin gọi tiếp `status = "CANCELLED"`.
    - *Kết quả:* Đơn chuyển sang `CANCELLED`, toàn bộ bản ghi `InventoryLock` chuyển sang `EXPIRED`, và 2 sản phẩm được hoàn trả lại `stockQuantity` ngay lập tức trong Database Transaction.

