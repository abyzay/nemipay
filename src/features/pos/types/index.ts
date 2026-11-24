import type { AppIconName } from '@/components/ui';

export type PosCategory = 'Bebidas' | 'Alimentos' | 'Snacks' | 'Despensa' | 'Otros';

export const POS_CATEGORIES: readonly PosCategory[] = [
  'Bebidas',
  'Alimentos',
  'Snacks',
  'Despensa',
  'Otros',
];

export interface PosProduct {
  id: string;
  name: string;
  priceCents: number;
  category: PosCategory;
  iconName: AppIconName;
  imageUri?: string;
}

export interface PosProductDraft {
  name: string;
  priceCents: number;
  category: PosCategory;
  imageUri?: string;
}

export interface PosCartItem {
  product: PosProduct;
  quantity: number;
}
