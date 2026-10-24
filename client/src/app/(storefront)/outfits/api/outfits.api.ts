import { baseAPI } from "@/api/axios.api";
import {
  CombosResponse,
  ComboDetailResponse,
  OutfitsResponse,
  OutfitSlotsResponse,
} from "../validation/outfits.validation";

/**
 * 1. Lấy danh sách các Combo / Set thời trang ưu đãi
 * GET /api/combos hoặc alias GET /api/outfits
 */
export async function getCombosApi(): Promise<CombosResponse> {
  const response = await baseAPI.get<CombosResponse>("/combos");
  return response.data;
}

/**
 * 2. Lấy chi tiết 1 Combo theo ID kèm đầy đủ biến thể sản phẩm
 * GET /api/combos/:id hoặc alias GET /api/outfits/:id
 */
export async function getComboByIdApi(id: string): Promise<ComboDetailResponse> {
  const response = await baseAPI.get<ComboDetailResponse>(`/combos/${encodeURIComponent(id)}`);
  return response.data;
}

/**
 * 3. Alias tương thích ngược cho Lookbook Outfit
 * GET /api/outfits
 */
export async function getOutfitsApi(): Promise<OutfitsResponse> {
  const response = await baseAPI.get<OutfitsResponse>("/outfits");
  return response.data;
}

/**
 * 4. Lấy danh sách sản phẩm phân tầng theo các Slot (TOP, BOTTOM, OUTERWEAR, SHOES, ACCESSORY)
 * GET /api/outfits/slots
 */
export async function getOutfitSlotsApi(): Promise<OutfitSlotsResponse> {
  const response = await baseAPI.get<OutfitSlotsResponse>("/outfits/slots");
  return response.data;
}
