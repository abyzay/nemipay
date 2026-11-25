export interface PosProduct {
  id: string;
  name: string;
  priceCents: number;
}

export interface PosProductDraft {
  name: string;
  priceCents: number;
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
