trigger:

- always_run
  description: Quy chuẩn kiến trúc dự án và quy tắc tổ chức thư mục cập nhật mới nhất

# Hướng dẫn Kiến trúc Dự án (Architecture & Directory Conventions)

## 1. Tổng quan Kiến trúc

Dự án sử dụng **Next.js App Router** kết hợp mô hình **Feature-based Architecture**.
Các thành phần dùng chung (UI primitives, helpers) được đặt ngang hàng với thư mục `src`, trong khi logic và giao diện của từng trang/tính năng được cô lập bên trong `src/app/`.

## 2. Cấu trúc Thư mục Dự án (Directory Structure)

Dự án tuân thủ nghiêm ngặt cấu trúc phân cấp sau:

```text
client/
├── .agent/
│   └── rule/
│       ├── ai.md
│       ├── ai2.md
│       └── architecture-guide.md
├── components/
│   ├── auth/
│   │   └── role-guard.tsx
│   ├── storefront/
│   │   ├── footer.tsx
│   │   ├── header.tsx
│   │   └── product-card.tsx
│   └── ui/
│       ├── badge.tsx
│       ├── button.tsx
│       ├── input.tsx
│       ├── label.tsx
│       └── skeleton.tsx
├── lib/
│   ├── error.ts
│   └── utils.ts
├── public/
│   ├── file.svg
│   ├── globe.svg
│   ├── next.svg
│   ├── vercel.svg
│   └── window.svg
├── src/
│   ├── api/
│   │   ├── auth.api.ts
│   │   ├── axios.api.ts
│   │   └── products.api.ts
│   ├── app/
│   │   ├── (auth-layout)/
│   │   │   ├── login/
│   │   │   │   ├── api/login.api.ts
│   │   │   │   ├── hooks/use-login.ts
│   │   │   │   ├── store/login.store.ts
│   │   │   │   ├── style/login.css
│   │   │   │   ├── validation/login.validation.ts
│   │   │   │   └── page.tsx
│   │   │   ├── register/
│   │   │   │   ├── api/register.api.ts
│   │   │   │   ├── hooks/use-register.ts
│   │   │   │   ├── style/register.css
│   │   │   │   ├── validation/register.validation.ts
│   │   │   │   └── page.tsx
│   │   │   └── layout.tsx
│   │   ├── (storefront)/
│   │   │   ├── home/style/home.css
│   │   │   ├── products/
│   │   │   │   ├── [slug]/
│   │   │   │   │   ├── hooks/use-product-detail.ts
│   │   │   │   │   ├── style/product-detail.css
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── hooks/use-products.ts
│   │   │   │   ├── style/products.css
│   │   │   │   └── page.tsx
│   │   │   ├── layout.tsx
│   │   │   └── page.tsx
│   │   ├── global.css
│   │   ├── globals.css
│   │   └── layout.tsx
│   ├── providers/
│   │   ├── auth-provider.tsx
│   │   └── query-provider.tsx
│   ├── stores/auth.store.ts
│   └── theme/
├── test/
├── .gitignore
├── AGENTS.md
├── CLAUDE.md
├── components.json
├── eslint.config.mjs
├── next.config.ts
├── next-env.d.ts
├── package.json
├── package-lock.json
├── postcss.config.mjs
├── README.md
├── tsconfig.json
└── tsconfig.tsbuildinfo
```

## 3. Quy tắc phân tách cho AI Agent (Rules for Agent)

Khi sinh code mới hoặc chỉnh sửa dự án, Agent BẮT BUỘC tuân thủ các quy tắc sau:

### 3.1. Quy tắc sử dụng Component & Lib (Nằm ngoài `src`)

- **`components/ui/`**: Khi cần xây dựng giao diện, hãy ưu tiên tái sử dụng các component sẵn có tại đây (`button.tsx`, `input.tsx`, `label.tsx`,...). Nếu không có components cần thiết thì tự tải bằng CLI của shadcn.
- **`lib/`**: Chứa các utility function, helper dùng chung cho toàn bộ ứng dụng.
- **`shadcn/ui`**: có thể tùy biến components gốc theo chủ đề của đề tài nhưng phải thống nhất 1 style và theme.
- Giao diện kết hợp với `shadcn/ui` + Storefront, Storefront làm chủ đạo.

### 3.2. Quy tắc cho từng Feature trong `src/app/`

Mỗi khi tạo một trang hoặc tính năng mới trong `src/app/`, bắt buộc chia nhỏ thành các thư mục con tương tự module `register`:

1. **`api/[feature-name].api.ts`**: Chỉ chứa các hàm gọi API sử dụng `axios.api.ts`. Tuyệt đối không viết logic UI ở đây.
2. **`hooks/use-[feature-name].ts`**: Xử lý logic gọi API, quản lý state, side effects cho feature.
3. **`validation/[feature-name].validation.ts`**: Định nghĩa schema validate form (Zod/Yup) và TypeScript interfaces.
4. **`style/[feature-name].css`**: Chứa CSS tùy chỉnh riêng của feature.
5. **`page.tsx`**: Chỉ thực hiện import hook, validation schema và các UI components từ `components/ui/` để ráp thành giao diện hoàn chỉnh.
6. **`store/[feature-name].store.ts`**: chứa file xử lý của zustand

### 3.3. Quy tắc không được sửa

- Không được sửa folder server, chỉ làm việc trên folder client

### 3.4. Quy tắc thiết kế

- Thiết kế phong cách theo link: https://www.figma.com/design/durxJaayMhZ6z9I4iHoID9/Modern-E-Commerce-Website-Design-Template--Community-?node-id=49-4172&t=FtqjEyDuAuTjXSuD-0
- Nhớ có responsive
- Dùng toast để tạo thông báo có thể config toast theo style, theme theo link figma để đồng bộ giao diện
- Nếu backend không cung cấp ảnh thì dùng ảnh mặc định trong folder public/images/default.jpg

### 3.5. Quy tắc kiểm thử

- Đọc file testAPI.md để test
- Tự viết unit test
- Kiểm tra toàn bộ API, viết thành 1 bảng trong file testAPI.md, những API nào test rồi sẽ không test nữa
- Viết file kiểm thử vào folder test
- Tự chụp màn hình lại, tự sửa lại nếu có lỗi về style hoặc không đồng bộ style

## 4. Hướng dẫn Đọc Ngữ cảnh (Context Files to Read First)

Trước khi viết code cho bất kỳ feature nào, Agent cần tham khảo:

1. `components/ui/*` để biết danh sách các UI component có sẵn.
2. `src/api/axios.api.ts` để hiểu cấu hình HTTP client.
3. Thư mục mẫu chuẩn (`src/app/.../register/`) để bắt chước chính xác phong cách tổ chức code.
4. Đọc cấu hình api request & response trong file TMDT/docs/API_DOCUMENTATION.md
