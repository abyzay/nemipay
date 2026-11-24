import type { IoniconsIconName } from '@react-native-vector-icons/ionicons';
import mockProducts from '../data/mockProducts.json';
import type { PosCartItem, PosCategory, PosProduct } from '../types';

const CATEGORY_ICON_MAP: Record<PosCategory, IoniconsIconName> = {
  Bebidas: 'cafe-outline',
  Alimentos: 'restaurant-outline',
  Snacks: 'fast-food-outline',
  Despensa: 'basket-outline',
  Otros: 'pricetag-outline',
};

export function getDefaultIconForCategory(category: PosCategory): IoniconsIconName {
  return CATEGORY_ICON_MAP[category];
}

export function getInitialPosProducts(): PosProduct[] {
  return (mockProducts.products as PosProduct[]).map((item) => ({ ...item }));
}

export function filterPosProducts(
  products: readonly PosProduct[],
  searchQuery: string,
  selectedCategory: PosCategory | 'Todos'
): PosProduct[] {
  const normalizedQuery = searchQuery.trim().toLowerCase();

  return products.filter((product) => {
    const matchesCategory = selectedCategory === 'Todos' || product.category === selectedCategory;
    if (!matchesCategory) {
      return false;
    }

    if (!normalizedQuery) {
      return true;
    }

    return (
      product.name.toLowerCase().includes(normalizedQuery) ||
      product.category.toLowerCase().includes(normalizedQuery)
    );
  });
}

export function calculateCartTotalCents(cartItems: readonly PosCartItem[]): number {
  return cartItems.reduce((sum, item) => sum + item.product.priceCents * item.quantity, 0);
}

export function calculateCartUnitsCount(cartItems: readonly PosCartItem[]): number {
  return cartItems.reduce((sum, item) => sum + item.quantity, 0);
}

export function buildCartConceptSummary(cartItems: readonly PosCartItem[]): string {
  if (cartItems.length === 0) {
    return 'Venta POS';
  }
  if (cartItems.length === 1) {
    const first = cartItems[0];
    return first ? `${first.quantity}x ${first.product.name}` : 'Venta POS';
  }
  const units = calculateCartUnitsCount(cartItems);
  return `Venta POS (${units} artículos)`;
}
