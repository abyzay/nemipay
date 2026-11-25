import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AmountDisplay } from '@/components/financial';
import { AppCard, AppIcon } from '@/components/ui';
import { useAppTheme } from '@/hooks';
import { formatCurrencyFromCents } from '@/utils/currency';
import type { PosProduct } from '../types';

export interface PosProductCardProps {
  product: PosProduct;
  quantity: number;
  onIncrement: (product: PosProduct) => void;
  onDecrement: (productId: string) => void;
  onEditPress: (product: PosProduct) => void;
}

export function PosProductCard({
  product,
  quantity,
  onIncrement,
  onDecrement,
  onEditPress,
}: PosProductCardProps) {
  const { tokens } = useAppTheme();
  const isInCart = quantity > 0;

  return (
    <AppCard
      variant={isInCart ? 'selected' : 'standard'}
      padding="sm"
      elevated={!isInCart}
      onPress={() => onIncrement(product)}
      accessibilityLabel={`Agregar ${product.name}, ${formatCurrencyFromCents(product.priceCents)}`}
      testID={`pos-product-card-${product.id}`}
      style={styles.card}
    >
      <View style={styles.topRow}>
        <Text
          numberOfLines={2}
          style={[
            styles.name,
            {
              fontFamily: tokens.typography.families.semiBold,
              color: tokens.colors.textPrimary,
            },
          ]}
        >
          {product.name}
        </Text>

        <View style={styles.topActions}>
          {isInCart ? (
            <View
              testID={`pos-product-badge-${product.id}`}
              style={[
                styles.qtyBadge,
                {
                  backgroundColor: tokens.colors.primary,
                  borderRadius: tokens.radius.radiusFull,
                },
              ]}
            >
              <Text
                style={[
                  styles.qtyBadgeText,
                  tokens.typography.tabularNums,
                  {
                    fontFamily: tokens.typography.families.bold,
                    color: tokens.colors.textOnPrimary,
                  },
                ]}
              >
                {quantity}
              </Text>
            </View>
          ) : null}

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Editar ${product.name}`}
            hitSlop={8}
            onPress={() => onEditPress(product)}
            testID={`pos-product-edit-${product.id}`}
            style={({ pressed }) => [
              styles.editButton,
              {
                borderRadius: tokens.radius.radiusFull,
                backgroundColor: pressed
                  ? tokens.colors.lavender
                  : isInCart
                    ? tokens.colors.background
                    : tokens.colors.surface,
              },
            ]}
          >
            <AppIcon name="pencil" size={14} color={tokens.colors.textSecondary} />
          </Pressable>
        </View>
      </View>

      <View style={[styles.bottomRow, { marginTop: tokens.spacing.space3 }]}>
        <AmountDisplay amountCents={product.priceCents} size="sm" tone="primary" omitZeroCents />

        {isInCart ? (
          <View style={[styles.stepper, { gap: tokens.spacing.space1 }]}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Quitar uno de ${product.name}`}
              hitSlop={6}
              onPress={() => onDecrement(product.id)}
              testID={`pos-product-minus-${product.id}`}
              style={[
                styles.stepBtn,
                {
                  backgroundColor: tokens.colors.background,
                  borderColor: tokens.colors.lavenderBorder,
                  borderRadius: tokens.radius.radiusFull,
                },
              ]}
            >
              <AppIcon name="minus" size={14} color={tokens.colors.primary} />
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Agregar uno de ${product.name}`}
              hitSlop={6}
              onPress={() => onIncrement(product)}
              testID={`pos-product-plus-${product.id}`}
              style={[
                styles.stepBtn,
                {
                  backgroundColor: tokens.colors.primary,
                  borderColor: tokens.colors.primary,
                  borderRadius: tokens.radius.radiusFull,
                },
              ]}
            >
              <AppIcon name="plus" size={14} color={tokens.colors.textOnPrimary} />
            </Pressable>
          </View>
        ) : (
          <Text
            style={[
              styles.tapHint,
              {
                fontFamily: tokens.typography.families.medium,
                color: tokens.colors.textMuted,
              },
            ]}
          >
            + Tocar
          </Text>
        )}
      </View>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minHeight: 108,
    justifyContent: 'space-between',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 6,
  },
  topActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  qtyBadge: {
    minWidth: 22,
    height: 22,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyBadgeText: {
    fontSize: 12,
    lineHeight: 15,
  },
  editButton: {
    width: 26,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    flex: 1,
    fontSize: 15,
    lineHeight: 20,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepBtn: {
    width: 26,
    height: 26,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tapHint: {
    fontSize: 12,
    lineHeight: 16,
  },
});
