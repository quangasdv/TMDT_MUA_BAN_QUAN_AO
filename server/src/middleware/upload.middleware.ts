import multer from "multer";
import path from "path";
import fs from "fs";

// Đảm bảo thư mục lưu trữ ảnh tồn tại: server/public/uploads
const uploadsDir = path.join(__dirname, "../../public/uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Cấu hình lưu trữ file vào ổ đĩa
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const cleanName = path
      .basename(file.originalname, ext)
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "-")
      .replace(/-+/g, "-")
      .slice(0, 40);
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
    cb(null, `${cleanName || "image"}-${uniqueSuffix}${ext}`);
  },
});

// Bộ lọc định dạng file: chỉ cho phép tải lên file hình ảnh
const fileFilter = (
  _req: any,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowedMimes = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
    "image/avif",
  ];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Định dạng file không được hỗ trợ. Chỉ chấp nhận các file ảnh JPG, PNG, WEBP, GIF, AVIF."
      )
    );
  }
};

export const uploadMiddleware = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // Giới hạn kích thước tối đa 5MB mỗi ảnh
  },
});
