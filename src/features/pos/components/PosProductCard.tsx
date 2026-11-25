import React from 'react';
import { formatCurrencyFromCents } from '@/utils/currency';
import type { PosProduct } from '../types';
import { PosCatalogCard, resolvePosCategoryIcon } from './PosCatalogCard';

export interface PosProductCardProps {
  product: PosProduct;
  quantity: number;
  isActive?: boolean;
  onSingleTap: (product: PosProduct) => void;
  onDoubleTapEdit: (product: PosProduct) => void;
  onLongPressEdit?: (product: PosProduct) => void;
}

export function PosProductCard({
  product,
  quantity,
  isActive = false,
  onSingleTap,
  onDoubleTapEdit,
  onLongPressEdit,
}: PosProductCardProps) {
  const isInCart = quantity > 0;

  return (
    <PosCatalogCard
      title={product.name}
      subtitle={formatCurrencyFromCents(product.priceCents)}
      description={product.description}
      imageUrl={product.imageUrl}
      fallbackIcon={resolvePosCategoryIcon(product.category)}
      badgeCount={quantity}
      selected={isInCart}
      isActive={isActive}
      highlightSubtitle={isInCart}
      accessibilityLabel={`${product.name}, ${formatCurrencyFromCents(product.priceCents)}. Toca para agregar o toca dos veces para editar.`}
      testID={`pos-product-card-${product.id}`}
      badgeTestID={`pos-product-badge-${product.id}`}
      imageTestID={`pos-product-image-${product.id}`}
      onSingleTap={() => onSingleTap(product)}
      onDoubleTapEdit={() => onDoubleTapEdit(product)}
      onLongPressEdit={() => (onLongPressEdit ?? onDoubleTapEdit)(product)}
    />
  );
}
