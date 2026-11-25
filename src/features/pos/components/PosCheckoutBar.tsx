import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AppButton, AppIcon } from '@/components/ui';
import { useAppTheme } from '@/hooks';
import { formatCurrencyFromCents } from '@/utils/currency';
import type { PosCartItem, PosProduct } from '../types';

export interface PosCheckoutBarProps {
  unitsCount: number;
  totalCents: number;
  activeItem: PosCartItem | null;
  disabled: boolean;
  loading?: boolean;
  onIncrementActive: (product: PosProduct) => void;
  onDecrementActive: (productId: string) => void;
  onRemoveActive: (productId: string) => void;
  onOpenSummaryPress: () => void;
  onCobrarPress: () => void;
}

export function PosCheckoutBar({
  unitsCount,
  totalCents,
  activeItem,
  disabled,
  loading = false,
  onIncrementActive,
  onDecrementActive,
  onRemoveActive,
  onOpenSummaryPress,
  onCobrarPress,
}: PosCheckoutBarProps) {
  const { tokens } = useAppTheme();
  const hasItems = unitsCount > 0 && activeItem !== null;

  return (
    <View
      testID="pos-checkout-bar"
      style={[
        styles.container,
        {
          backgroundColor: tokens.colors.background,
          borderTopColor: tokens.colors.divider,
          paddingTop: tokens.spacing.space3,
          paddingBottom: tokens.spacing.space3,
          gap: tokens.spacing.space3,
        },
      ]}
    >
      {hasItems ? (
        <>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Ver resumen de tu pedido, ${unitsCount} artículos, total ${formatCurrencyFromCents(totalCents)}`}
            onPress={onOpenSummaryPress}
            testID="pos-order-summary-trigger"
            style={({ pressed }) => [styles.summaryRow, { opacity: pressed ? 0.78 : 1 }]}
          >
            <View style={styles.summaryLeft}>
              <Text
                testID="pos-checkout-summary"
                style={[
                  styles.summaryTitle,
                  tokens.typography.tabularNums,
                  {
                    fontFamily: tokens.typography.families.bold,
                    color: tokens.colors.textPrimary,
                  },
                ]}
              >
                {`Tu pedido (${unitsCount})`}
              </Text>
              <View
                style={[
                  styles.activePill,
                  {
                    backgroundColor: tokens.colors.lavender,
                    borderRadius: tokens.radius.radiusFull,
                  },
                ]}
              >
                <Text
                  numberOfLines={1}
                  style={[
                    styles.activePillText,
                    {
                      fontFamily: tokens.typography.families.semiBold,
                      color: tokens.colors.primary,
                    },
                  ]}
                >
                  {activeItem.product.name}
                </Text>
              </View>
            </View>

            <View style={styles.summaryRight}>
              <Text
                testID="pos-checkout-total"
                style={[
                  styles.summaryTotal,
                  tokens.typography.tabularNums,
                  {
                    fontFamily: tokens.typography.families.bold,
                    color: tokens.colors.textPrimary,
                  },
                ]}
              >
                {formatCurrencyFromCents(totalCents)}
              </Text>
              <AppIcon name="chevron-right" size={16} color={tokens.colors.textSecondary} />
            </View>
          </Pressable>

          <View style={styles.controlsRow}>
            <View style={styles.stepperGroup}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Disminuir ${activeItem.product.name}`}
                onPress={() => onDecrementActive(activeItem.product.id)}
                testID="pos-active-minus-button"
                style={({ pressed }) => [
                  styles.stepPillButton,
                  {
                    backgroundColor: pressed
                      ? tokens.colors.lavender
                      : tokens.colors.surfaceSecondary,
                    borderRadius: tokens.radius.radiusButton,
                  },
                ]}
              >
                <AppIcon name="minus" size={20} color={tokens.colors.primary} />
              </Pressable>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Cantidad actual de ${activeItem.product.name}: ${activeItem.quantity}`}
                onPress={onOpenSummaryPress}
                testID="pos-active-qty-value"
                style={[
                  styles.qtyBox,
                  {
                    backgroundColor: tokens.colors.surface,
                    borderRadius: tokens.radius.radiusButton,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.qtyText,
                    tokens.typography.tabularNums,
                    {
                      fontFamily: tokens.typography.families.bold,
                      color: tokens.colors.textPrimary,
                    },
                  ]}
                >
                  {activeItem.quantity}
                </Text>
              </Pressable>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Aumentar ${activeItem.product.name}`}
                onPress={() => onIncrementActive(activeItem.product)}
                testID="pos-active-plus-button"
                style={({ pressed }) => [
                  styles.stepPillButton,
                  {
                    backgroundColor: pressed
                      ? tokens.colors.lavender
                      : tokens.colors.surfaceSecondary,
                    borderRadius: tokens.radius.radiusButton,
                  },
                ]}
              >
                <AppIcon name="plus" size={20} color={tokens.colors.primary} />
              </Pressable>
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Quitar ${activeItem.product.name} del pedido`}
              onPress={() => onRemoveActive(activeItem.product.id)}
              testID="pos-active-remove-button"
              style={({ pressed }) => [
                styles.trashButton,
                {
                  backgroundColor: pressed ? tokens.colors.errorLight : tokens.colors.lavenderSoft,
                  borderRadius: tokens.radius.radiusButton,
                },
              ]}
            >
              <AppIcon name="trash-2" size={19} color={tokens.colors.primary} />
            </Pressable>
          </View>
        </>
      ) : (
        <View style={styles.emptyPromptRow}>
          <Text
            testID="pos-checkout-summary"
            style={[
              styles.emptyPromptText,
              {
                fontFamily: tokens.typography.families.medium,
                color: tokens.colors.textSecondary,
              },
            ]}
          >
            Toca un producto para iniciar tu pedido
          </Text>
        </View>
      )}

      <AppButton
        variant="primary"
        size="lg"
        label={
          hasItems
            ? `Cobrar ${formatCurrencyFromCents(totalCents)}`
            : `Cobrar ${formatCurrencyFromCents(0)}`
        }
        loading={loading}
        disabled={disabled || loading}
        onPress={onCobrarPress}
        style={{ borderRadius: tokens.radius.radiusFull }}
        testID="pos-checkout-qr-button"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderTopWidth: 1,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  summaryLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minWidth: 0,
  },
  summaryTitle: {
    fontSize: 16,
    lineHeight: 22,
  },
  activePill: {
    maxWidth: 140,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  activePillText: {
    fontSize: 12,
    lineHeight: 16,
  },
  summaryRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  summaryTotal: {
    fontSize: 18,
    lineHeight: 22,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  stepperGroup: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepPillButton: {
    flex: 1,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyBox: {
    minWidth: 68,
    height: 46,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyText: {
    fontSize: 18,
    lineHeight: 22,
  },
  trashButton: {
    width: 48,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyPromptRow: {
    alignItems: 'center',
  },
  emptyPromptText: {
    fontSize: 13,
    lineHeight: 18,
  },
});
