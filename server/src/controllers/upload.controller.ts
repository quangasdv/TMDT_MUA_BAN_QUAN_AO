import { Request, Response, NextFunction } from "express";

export class UploadController {
  /**
   * Upload 1 hình ảnh
   * POST /api/upload
   * Nhận multipart/form-data với field: 'image' hoặc 'file'
   */
  static uploadSingle(req: Request, res: Response, next: NextFunction): void {
    try {
      // Hỗ trợ cả req.file hoặc nếu FE gửi mảng file thì lấy phần tử đầu tiên
      let file: Express.Multer.File | undefined = req.file;
      if (!file && Array.isArray((req as any).files) && (req as any).files.length > 0) {
        file = (req as any).files[0];
      }

      if (!file) {
        res.status(400).json({
          success: false,
          errorCode: "NO_FILE_UPLOADED",
          message: "Vui lòng chọn 1 file hình ảnh để tải lên (key: 'image' hoặc 'file').",
        });
        return;
      }

      // Xây dựng đường dẫn URL trả về cho Frontend
      const relativePath = `/uploads/${file.filename}`;
      const fullUrl = `${req.protocol}://${req.get("host")}/uploads/${file.filename}`;

      res.status(201).json({
        success: true,
        message: "Tải hình ảnh lên máy chủ thành công!",
        data: {
          url: fullUrl,
          path: relativePath,
          filename: file.filename,
          originalName: file.originalname,
          mimetype: file.mimetype,
          size: file.size,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Upload nhiều hình ảnh cùng lúc (tối đa 10 ảnh)
   * POST /api/upload/multiple
   */
  static uploadMultiple(req: Request, res: Response, next: NextFunction): void {
    try {
      const files = req.files as Express.Multer.File[];
      if (!files || !Array.isArray(files) || files.length === 0) {
        res.status(400).json({
          success: false,
          errorCode: "NO_FILES_UPLOADED",
          message: "Vui lòng chọn ít nhất 1 file hình ảnh để tải lên (key: 'images' hoặc 'files').",
        });
        return;
      }

      const uploadedImages = files.map((file) => {
        const relativePath = `/uploads/${file.filename}`;
        const fullUrl = `${req.protocol}://${req.get("host")}/uploads/${file.filename}`;
        return {
          url: fullUrl,
          path: relativePath,
          filename: file.filename,
          originalName: file.originalname,
          mimetype: file.mimetype,
          size: file.size,
        };
      });

      res.status(201).json({
        success: true,
        message: `Đã tải lên ${uploadedImages.length} hình ảnh thành công!`,
        data: {
          images: uploadedImages,
          urls: uploadedImages.map((img) => img.url),
        },
      });
    } catch (error) {
      next(error);
    }
  }
}
