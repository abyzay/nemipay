export interface PosCategory {
  id: string;
  name: string;
  description?: string | null;
  imageUrl?: string | null;
}

export interface PosCategoryDraft {
  name: string;
  description?: string | null;
  imageUri?: string | null;
  imageBase64?: string | null;
  imageMimeType?: string | null;
}

export interface PosProduct {
  id: string;
  name: string;
  priceCents: number;
  description?: string | null;
  category?: string;
  categoryId?: string | null;
  imageUrl?: string | null;
}

export interface PosProductDraft {
  name: string;
  priceCents: number;
  description?: string | null;
  category?: string;
  categoryId?: string | null;
  imageUri?: string | null;
  imageBase64?: string | null;
  imageMimeType?: string | null;
}

export interface PosCartItem {
  product: PosProduct;
  quantity: number;
}

export interface PosTemplateOption {
  id: string;
  label: string;
  items: PosProductDraft[];
}

export interface PosCategorySummary {
  name: string;
  count: number;
}
