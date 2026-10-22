import { baseAPI } from "@/api/axios.api";
import {
  OutfitsResponse,
  OutfitSlotsResponse,
} from "../validation/outfits.validation";

/**
 * Lấy danh sách các Lookbook Outfit phối sẵn
 * GET /api/outfits
 */
export async function getOutfitsApi(): Promise<OutfitsResponse> {
  const response = await baseAPI.get<OutfitsResponse>("/outfits");
  return response.data;
}

/**
 * Lấy danh sách sản phẩm phân tầng theo các Slot (TOP, BOTTOM, OUTERWEAR, SHOES, ACCESSORY)
 * GET /api/outfits/slots
 */
export async function getOutfitSlotsApi(): Promise<OutfitSlotsResponse> {
  const response = await baseAPI.get<OutfitSlotsResponse>("/outfits/slots");
  return response.data;
}

