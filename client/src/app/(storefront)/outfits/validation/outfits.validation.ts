export type OutfitSlotType = "TOP" | "BOTTOM" | "OUTERWEAR" | "SHOES" | "ACCESSORY";

/**
 * Phân định: Quần áo thuộc gói Combo cứng (Áo, Quần, Áo khoác)
 */
export function isClothingSlot(slotType: string): boolean {
  return slotType === "TOP" || slotType === "BOTTOM" || slotType === "OUTERWEAR";
}

/**
 * Phân định: Phụ kiện không tính vào combo (Giày dép, Mắt kính, Nón, Túi...)
 */
export function isAccessorySlot(slotType: string): boolean {
  return slotType === "SHOES" || slotType === "ACCESSORY";
}

export interface SlotProductVariant {
  id: string;
  productId: string;
  sku: string;
  color: string;
  size: string;
  priceAdjustment: string | number;
  stockQuantity: number;
  imageUrl?: string;
  price?: number;
  product?: {
    id: string;
    name: string;
    slug: string;
    basePrice: string | number;
  };
}

export interface SlotProduct {
  id: string;
  name: string;
  basePrice: string | number;
  slug: string;
  description?: string;
  variants: SlotProductVariant[];
  allVariants?: SlotProductVariant[];
}

export interface ComboItem {
  id: string;
  slotType: OutfitSlotType;
  productId: string;
  productName: string;
  productSlug: string;
  variantId: string;
  sku: string;
  color: string;
  size: string;
  imageUrl: string;
  price: number;
  stockQuantity: number;
  product?: {
    id: string;
    name: string;
    slug: string;
    description?: string;
    basePrice: number | string;
    allVariants: SlotProductVariant[];
  };
  defaultVariant?: SlotProductVariant;
}

export interface Combo {
  id: string;
  title: string;
  description: string;
  bannerUrl?: string;
  discountRate: number;
  discountPercent: number;
  originalPrice: number;
  comboPrice: number;
  savedAmount: number;
  items: ComboItem[];
}

export interface CombosResponse {
  success: boolean;
  data: {
    combos: Combo[];
    outfits?: Combo[];
  };
}

export interface ComboDetailResponse {
  success: boolean;
  data: {
    combo: Combo;
  };
}

// Giữ lại các kiểu cũ cho tính tương thích ngược
export interface OutfitItem {
  id: string;
  outfitId: string;
  variantId: string;
  variant: SlotProductVariant & {
    product: SlotProduct;
  };
}

export interface Outfit {
  id: string;
  name?: string;
  title?: string;
  description?: string;
  imageUrl?: string;
  bannerUrl?: string;
  discountPercent?: number;
  discountRate?: number;
  originalPrice?: number;
  comboPrice?: number;
  savedAmount?: number;
  isActive?: boolean;
  items: OutfitItem[] | ComboItem[];
}

export interface OutfitsResponse {
  success: boolean;
  data: {
    outfits: Outfit[];
    combos?: Combo[];
  };
}

export interface OutfitSlotsResponse {
  success: boolean;
  data: {
    slots: {
      TOP?: SlotProduct[];
      BOTTOM?: SlotProduct[];
      OUTERWEAR?: SlotProduct[];
      SHOES?: SlotProduct[];
      ACCESSORY?: SlotProduct[];
      [key: string]: SlotProduct[] | undefined;
    };
  };
}

export const outfitSlotNames: Record<OutfitSlotType, { label: string; iconName: string; hint: string }> = {
  TOP: { label: "Áo", iconName: "Shirt", hint: "Áo thun, sơ mi, polo" },
  BOTTOM: { label: "Quần / Váy", iconName: "Scissors", hint: "Quần jean, kaki, short" },
  OUTERWEAR: { label: "Áo khoác", iconName: "Layers", hint: "Áo khoác, blazer, hoodie" },
  SHOES: { label: "Giày dép (Phụ kiện)", iconName: "Footprints", hint: "Sneakers, boots, sandals (Mua kèm)" },
  ACCESSORY: { label: "Phụ kiện", iconName: "Sparkles", hint: "Mũ, túi xách, kính (Mua kèm)" },
};
