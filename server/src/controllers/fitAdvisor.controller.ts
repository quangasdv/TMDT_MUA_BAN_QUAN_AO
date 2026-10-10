import { Request, Response, NextFunction } from "express";
import prisma from "../config/db";

export class FitAdvisorController {
  /**
   * Thuật toán gợi ý size thông minh dựa trên thông số nhân trắc học:
   * So khớp Chiều cao (cm), Cân nặng (kg), Vòng ngực/Vòng eo với bảng SizeChart chuẩn của sản phẩm.
   */
  static async recommendSize(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { productId, heightCm, weightKg, chestCm, waistCm } = req.body;

      if (!productId || !heightCm || !weightKg) {
        res.status(400).json({
          success: false,
          message: "Vui lòng cung cấp productId, chiều cao (cm) và cân nặng (kg).",
        });
        return;
      }

      const sizeCharts = await prisma.sizeChart.findMany({
        where: { productId },
      });

      if (sizeCharts.length === 0) {
        res.status(404).json({
          success: false,
          message: "Sản phẩm này chưa có bảng thông số kích thước chi tiết.",
        });
        return;
      }

      const height = parseInt(heightCm, 10);
      const weight = parseInt(weightKg, 10);

      // Tính điểm phù hợp cho từng size
      let bestMatch: any = null;
      let highestScore = -1;

      for (const sc of sizeCharts) {
        let score = 0;

        // Chiều cao
        if (height >= sc.minHeightCm && height <= sc.maxHeightCm) {
          score += 40;
        } else {
          const diffH = Math.min(Math.abs(height - sc.minHeightCm), Math.abs(height - sc.maxHeightCm));
          score += Math.max(0, 40 - diffH * 3);
        }

        // Cân nặng
        if (weight >= sc.minWeightKg && weight <= sc.maxWeightKg) {
          score += 40;
        } else {
          const diffW = Math.min(Math.abs(weight - sc.minWeightKg), Math.abs(weight - sc.maxWeightKg));
          score += Math.max(0, 40 - diffW * 4);
        }

        // Vòng ngực / Vòng eo (nếu có)
        if (chestCm && sc.chestCm) {
          const diffC = Math.abs(parseInt(chestCm, 10) - sc.chestCm);
          score += Math.max(0, 10 - diffC);
        }
        if (waistCm && sc.waistCm) {
          const diffWa = Math.abs(parseInt(waistCm, 10) - sc.waistCm);
          score += Math.max(0, 10 - diffWa);
        }

        if (score > highestScore) {
          highestScore = score;
          bestMatch = sc;
        }
      }

      const confidence = Math.min(99, Math.max(65, Math.round(highestScore)));

      res.status(200).json({
        success: true,
        data: {
          recommendedSize: bestMatch ? bestMatch.size : "M",
          confidenceScore: `${confidence}%`,
          fitType: confidence > 85 ? "Rất vừa vặn (Standard Fit)" : "Tương đối vừa (Relaxed Fit)",
          matchedChart: bestMatch,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}
