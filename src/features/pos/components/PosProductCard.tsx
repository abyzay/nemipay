import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { AppIcon } from '@/components/ui';
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
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Agregar ${product.name}, ${formatCurrencyFromCents(product.priceCents)}`}
      onPress={() => onIncrement(product)}
      testID={`pos-product-card-${product.id}`}
      style={({ pressed }) => [
        styles.card,
        tokens.elevations.xs,
        {
          backgroundColor: pressed ? tokens.colors.secondary : tokens.colors.surface,
          borderColor: isInCart ? tokens.colors.primary : tokens.colors.border,
          borderWidth: isInCart ? 1.5 : 1,
          borderRadius: tokens.radii.lg,
          padding: tokens.spacing.sm,
        },
      ]}
    >
      <View style={styles.topRow}>
        {product.imageUri ? (
          <Image
            source={{ uri: product.imageUri }}
            style={[
              styles.productImage,
              {
                borderRadius: tokens.radii.md,
                backgroundColor: tokens.colors.background,
              },
            ]}
            testID={`pos-product-image-${product.id}`}
          />
        ) : (
          <View
            style={[
              styles.iconBox,
              {
                backgroundColor: tokens.colors.secondary,
                borderRadius: tokens.radii.md,
              },
            ]}
          >
            <AppIcon name={product.iconName} size={22} color={tokens.colors.primaryDark} />
          </View>
        )}

        <View style={styles.topActions}>
          {isInCart ? (
            <View
              testID={`pos-product-badge-${product.id}`}
              style={[
                styles.qtyBadge,
                {
                  backgroundColor: tokens.colors.primary,
                  borderRadius: tokens.radii.full,
                },
              ]}
            >
              <Text
                style={[
                  styles.qtyBadgeText,
                  {
                    fontFamily: tokens.typography.families.bold,
                    color: tokens.colors.onPrimary,
                  },
                ]}
              >
                {quantity}
              </Text>
            </View>
          ) : null}

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Editar o eliminar ${product.name}`}
            hitSlop={8}
            onPress={() => onEditPress(product)}
            testID={`pos-product-edit-${product.id}`}
            style={({ pressed }) => [
              styles.editButton,
              {
                borderRadius: tokens.radii.full,
                backgroundColor: pressed ? tokens.colors.secondary : tokens.colors.background,
              },
            ]}
          >
            <AppIcon name="ellipsis-vertical" size={14} color={tokens.colors.textSecondary} />
          </Pressable>
        </View>
      </View>

      <Text
        numberOfLines={1}
        style={[
          styles.name,
          {
            fontFamily: tokens.typography.families.semiBold,
            color: tokens.colors.textPrimary,
            marginTop: tokens.spacing.xs,
          },
        ]}
      >
        {product.name}
      </Text>

      <View style={[styles.bottomRow, { marginTop: tokens.spacing.xxs }]}>
        <Text
          style={[
            styles.price,
            {
              fontFamily: tokens.typography.families.bold,
              color: tokens.colors.primary,
            },
          ]}
        >
          {formatCurrencyFromCents(product.priceCents, { omitZeroCents: true })}
        </Text>

        {isInCart ? (
          <View style={[styles.stepper, { gap: tokens.spacing.xxs }]}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Quitar uno de ${product.name}`}
              hitSlop={6}
              onPress={() => onDecrement(product.id)}
              testID={`pos-product-minus-${product.id}`}
              style={[
                styles.stepBtn,
                {
                  backgroundColor: tokens.colors.secondary,
                  borderRadius: tokens.radii.full,
                },
              ]}
            >
              <AppIcon name="remove" size={14} color={tokens.colors.primaryDark} />
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
                  borderRadius: tokens.radii.full,
                },
              ]}
            >
              <AppIcon name="add" size={14} color={tokens.colors.onPrimary} />
            </Pressable>
          </View>
        ) : (
          <Text
            style={[
              styles.tapHint,
              {
                fontFamily: tokens.typography.families.medium,
                color: tokens.colors.textSecondary,
              },
            ]}
          >
            + Agregar
          </Text>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minHeight: 112,
    justifyContent: 'space-between',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  iconBox: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  productImage: {
    width: 40,
    height: 40,
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
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    fontSize: 14,
    lineHeight: 19,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  price: {
    fontSize: 15,
    lineHeight: 20,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepBtn: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tapHint: {
    fontSize: 11,
    lineHeight: 15,
  },
});
