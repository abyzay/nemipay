import React from 'react';
import type { PosCategory } from '../types';
import { PosCatalogCard, resolvePosCategoryIcon } from './PosCatalogCard';

export interface PosCategoryCardProps {
  category: PosCategory;
  productsCount: number;
  selected?: boolean;
  onSingleTap: (category: PosCategory) => void;
  onDoubleTapEdit: (category: PosCategory) => void;
  onLongPressEdit?: (category: PosCategory) => void;
}

export function PosCategoryCard({
  category,
  productsCount,
  selected = false,
  onSingleTap,
  onDoubleTapEdit,
  onLongPressEdit,
}: PosCategoryCardProps) {
  const countLabel = productsCount === 1 ? '1 producto' : `${productsCount} productos`;

  return (
    <PosCatalogCard
      title={category.name}
      subtitle={countLabel}
      description={category.description}
      imageUrl={category.imageUrl}
      fallbackIcon={resolvePosCategoryIcon(category.name)}
      badgeCount={productsCount}
      selected={selected}
      isActive={selected}
      highlightSubtitle
      deferSingleTapMs={240}
      accessibilityLabel={`Categoría ${category.name}, ${countLabel}. Toca para ver productos o toca dos veces para editar.`}
      testID={`pos-category-card-${category.id}`}
      badgeTestID={`pos-category-badge-${category.id}`}
      imageTestID={`pos-category-image-${category.id}`}
      onSingleTap={() => onSingleTap(category)}
      onDoubleTapEdit={() => onDoubleTapEdit(category)}
      onLongPressEdit={() => (onLongPressEdit ?? onDoubleTapEdit)(category)}
    />
  );
}
