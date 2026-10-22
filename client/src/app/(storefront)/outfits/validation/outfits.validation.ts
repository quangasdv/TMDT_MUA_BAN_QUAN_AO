export type OutfitSlotType = "TOP" | "BOTTOM" | "OUTERWEAR" | "SHOES" | "ACCESSORY";

export interface SlotProductVariant {
  id: string;
  productId: string;
  sku: string;
  color: string;
  size: string;
  priceAdjustment: string | number;
  stockQuantity: number;
  imageUrl?: string;
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
  variants: SlotProductVariant[];
}

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
  name: string;
  description?: string;
  imageUrl?: string;
  discountPercent?: number;
  isActive: boolean;
  items: OutfitItem[];
}

export interface OutfitsResponse {
  success: boolean;
  data: {
    outfits: Outfit[];
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
  SHOES: { label: "Giày dép", iconName: "Footprints", hint: "Sneakers, boots, sandals" },
  ACCESSORY: { label: "Phụ kiện", iconName: "Sparkles", hint: "Mũ, túi xách, kính" },
};
