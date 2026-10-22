import { baseAPI } from "./axios.api";

export type FitPreference = "TIGHT" | "REGULAR" | "LOOSE";

export interface FitAdvisorRequest {
  productId: string;
  heightCm: number;
  weightKg: number;
  height?: number;
  weight?: number;
  chestCm?: number;
  chest?: number;
  waistCm?: number;
  waist?: number;
  hipsCm?: number;
  hips?: number;
  fitPreference?: FitPreference;
}

export interface MatchedChart {
  id?: string;
  productId?: string;
  size: string;
  minHeightCm: number;
  maxHeightCm: number;
  minWeightKg: number;
  maxWeightKg: number;
  chestCm?: number | null;
  waistCm?: number | null;
}

export interface FitAdvisorResult {
  recommendedSize: string;
  confidenceScore: string | number;
  fitScore?: number;
  fitScorePercentage?: number;
  fitType?: string;
  advice?: string;
  preference?: string;
  confidenceLevel?: string;
  matchedChart?: MatchedChart;
}

export interface FitAdvisorResponse {
  success: boolean;
  message?: string;
  data: FitAdvisorResult;
  errorCode?: string;
}

/**
 * Gợi ý size quần áo thông minh từ backend Smart Fit Advisor
 * POST /api/fit-advisor/recommend
 */
export async function getFitRecommendationApi(
  payload: FitAdvisorRequest
): Promise<FitAdvisorResponse> {
  // Gửi cả 2 định dạng (heightCm/height, weightKg/weight) để tương thích tuyệt đối
  const body = {
    productId: payload.productId,
    heightCm: payload.heightCm,
    height: payload.heightCm,
    weightKg: payload.weightKg,
    weight: payload.weightKg,
    ...(payload.chestCm ? { chestCm: payload.chestCm, chest: payload.chestCm } : {}),
    ...(payload.waistCm ? { waistCm: payload.waistCm, waist: payload.waistCm } : {}),
    ...(payload.hipsCm ? { hipsCm: payload.hipsCm, hips: payload.hipsCm } : {}),
    ...(payload.fitPreference ? { fitPreference: payload.fitPreference } : {}),
  };

  const response = await baseAPI.post<FitAdvisorResponse>(
    "/fit-advisor/recommend",
    body
  );
  return response.data;
}

