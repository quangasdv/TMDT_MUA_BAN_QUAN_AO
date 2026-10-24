import { Router } from "express";
import { uploadMiddleware } from "../middleware/upload.middleware";
import { UploadController } from "../controllers/upload.controller";

const router = Router();

// Endpoint upload 1 hình ảnh (Hỗ trợ linh hoạt key 'image' hoặc 'file' từ FormData)
router.post("/upload", uploadMiddleware.any(), UploadController.uploadSingle);

// Endpoint upload nhiều hình ảnh cùng lúc (tối đa 10 ảnh)
router.post(
  "/upload/multiple",
  uploadMiddleware.array("images", 10),
  UploadController.uploadMultiple
);

export default router;
