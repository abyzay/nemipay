import type { IoniconsIconName } from '@react-native-vector-icons/ionicons';

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
  iconName: IoniconsIconName;
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
