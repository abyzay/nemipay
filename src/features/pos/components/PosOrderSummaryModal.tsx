import React from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { AppBottomSheet, AppButton, AppCheckbox, AppDivider, AppIcon } from '@/components/ui';
import { useAppTheme } from '@/hooks';
import { formatCurrencyFromCents } from '@/utils/currency';
import type { PosCartItem, PosProduct } from '../types';

export interface PosOrderSummaryModalProps {
  visible: boolean;
  cartItems: readonly PosCartItem[];
  unitsCount: number;
  totalCents: number;
  isGeneratingQr: boolean;
  errorMessage?: string | null;
  splitEnabled?: boolean;
  onToggleSplit?: (next: boolean) => void;
  onIncrement: (product: PosProduct) => void;
  onDecrement: (productId: string) => void;
  onRemoveItem: (productId: string) => void;
  onModifyOrder: () => void;
  onConfirmGenerateQr: () => void;
}

export function PosOrderSummaryModal({
  visible,
  cartItems,
  unitsCount,
  totalCents,
  isGeneratingQr,
  errorMessage,
  splitEnabled = false,
  onToggleSplit,
  onIncrement,
  onDecrement,
  onRemoveItem,
  onModifyOrder,
  onConfirmGenerateQr,
}: PosOrderSummaryModalProps) {
  const { tokens } = useAppTheme();
  const unitsLabel = unitsCount === 1 ? '1 artículo' : `${unitsCount} artículos`;
  const minTotal = splitEnabled ? 200 : 100;
  const canGenerate = totalCents >= minTotal && cartItems.length > 0 && !isGeneratingQr;

  return (
    <AppBottomSheet
      visible={visible}
      onClose={onModifyOrder}
      title="Resumen de tu pedido"
      closeAccessibilityLabel="Volver a modificar pedido"
      closeButtonTestID="pos-summary-close-button"
      testID="pos-order-summary-modal"
    >
      <View style={styles.sheetBody}>
        <Text
          style={[
            styles.subtitle,
            {
              fontFamily: tokens.typography.families.medium,
              color: tokens.colors.textSecondary,
              marginBottom: tokens.spacing.space3,
            },
          ]}
        >
          {`${unitsLabel} · Ajusta cantidades antes de generar el QR CoDi`}
        </Text>

        <ScrollView
          showsVerticalScrollIndicator={false}
          style={styles.itemsScroll}
          contentContainerStyle={{
            gap: tokens.spacing.space3,
            paddingBottom: tokens.spacing.space2,
          }}
        >
          {cartItems.map((item) => {
            const lineTotalCents = item.product.priceCents * item.quantity;
            return (
              <View
                key={item.product.id}
                testID={`pos-summary-item-${item.product.id}`}
                style={[
                  styles.itemCard,
                  {
                    backgroundColor: tokens.colors.surface,
                    borderColor: tokens.colors.border,
                    borderRadius: tokens.radius.radiusCard,
                    padding: tokens.spacing.space3,
                  },
                ]}
              >
                <View style={styles.itemTopRow}>
                  <View
                    style={[
                      styles.thumbBox,
                      {
                        backgroundColor: tokens.colors.background,
                        borderRadius: tokens.radius.radiusSM,
                      },
                    ]}
                  >
                    {item.product.imageUrl ? (
                      <Image
                        source={{ uri: item.product.imageUrl }}
                        style={styles.thumbImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <AppIcon name="store" size={18} color={tokens.colors.primary} />
                    )}
                  </View>

                  <View style={styles.itemMeta}>
                    <Text
                      numberOfLines={1}
                      style={[
                        styles.itemName,
                        {
                          fontFamily: tokens.typography.families.semiBold,
                          color: tokens.colors.textPrimary,
                        },
                      ]}
                    >
                      {item.product.name}
                    </Text>
                    <Text
                      numberOfLines={1}
                      style={[
                        styles.itemUnitPrice,
                        tokens.typography.tabularNums,
                        {
                          fontFamily: tokens.typography.families.regular,
                          color: tokens.colors.textSecondary,
                        },
                      ]}
                    >
                      {`${formatCurrencyFromCents(item.product.priceCents)} c/u`}
                    </Text>
                  </View>

                  <Text
                    testID={`pos-summary-line-total-${item.product.id}`}
                    style={[
                      styles.itemLineTotal,
                      tokens.typography.tabularNums,
                      {
                        fontFamily: tokens.typography.families.bold,
                        color: tokens.colors.textPrimary,
                      },
                    ]}
                  >
                    {formatCurrencyFromCents(lineTotalCents)}
                  </Text>
                </View>

                <View style={styles.itemControlsRow}>
                  <View style={styles.itemStepper}>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Quitar uno de ${item.product.name}`}
                      onPress={() => onDecrement(item.product.id)}
                      disabled={isGeneratingQr}
                      testID={`pos-summary-minus-${item.product.id}`}
                      style={[
                        styles.stepBtn,
                        {
                          backgroundColor: tokens.colors.background,
                          borderColor: tokens.colors.border,
                          borderRadius: tokens.radius.radiusMD,
                        },
                      ]}
                    >
                      <AppIcon name="minus" size={16} color={tokens.colors.primary} />
                    </Pressable>

                    <Text
                      testID={`pos-summary-qty-${item.product.id}`}
                      style={[
                        styles.stepQty,
                        tokens.typography.tabularNums,
                        {
                          fontFamily: tokens.typography.families.bold,
                          color: tokens.colors.textPrimary,
                        },
                      ]}
                    >
                      {item.quantity}
                    </Text>

                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Agregar uno de ${item.product.name}`}
                      onPress={() => onIncrement(item.product)}
                      disabled={isGeneratingQr}
                      testID={`pos-summary-plus-${item.product.id}`}
                      style={[
                        styles.stepBtn,
                        {
                          backgroundColor: tokens.colors.primary,
                          borderColor: tokens.colors.primary,
                          borderRadius: tokens.radius.radiusMD,
                        },
                      ]}
                    >
                      <AppIcon name="plus" size={16} color={tokens.colors.textOnPrimary} />
                    </Pressable>
                  </View>

                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Eliminar ${item.product.name} del pedido`}
                    onPress={() => onRemoveItem(item.product.id)}
                    disabled={isGeneratingQr}
                    hitSlop={8}
                    testID={`pos-summary-remove-${item.product.id}`}
                    style={[
                      styles.removeBtn,
                      {
                        backgroundColor: tokens.colors.errorLight,
                        borderRadius: tokens.radius.radiusMD,
                      },
                    ]}
                  >
                    <AppIcon name="trash-2" size={15} color={tokens.colors.error} />
                    <Text
                      style={[
                        styles.removeText,
                        {
                          fontFamily: tokens.typography.families.semiBold,
                          color: tokens.colors.error,
                        },
                      ]}
                    >
                      Quitar
                    </Text>
                  </Pressable>
                </View>
              </View>
            );
          })}
        </ScrollView>

        <AppDivider style={{ marginVertical: tokens.spacing.space3 }} />

        <View style={styles.totalRow}>
          <Text
            style={[
              styles.totalLabel,
              {
                fontFamily: tokens.typography.families.semiBold,
                color: tokens.colors.textSecondary,
              },
            ]}
          >
            Total a cobrar
          </Text>
          <Text
            testID="pos-summary-grand-total"
            style={[
              styles.totalValue,
              tokens.typography.tabularNums,
              {
                fontFamily: tokens.typography.families.bold,
                color: tokens.colors.primary,
              },
            ]}
          >
            {`${formatCurrencyFromCents(totalCents)} MXN`}
          </Text>
        </View>

        {errorMessage ? (
          <Text
            testID="pos-summary-error"
            style={[
              styles.errorText,
              {
                fontFamily: tokens.typography.families.medium,
                color: tokens.colors.error,
                marginTop: tokens.spacing.space2,
              },
            ]}
          >
            {errorMessage}
          </Text>
        ) : null}

        {onToggleSplit ? (
          <View style={{ marginTop: tokens.spacing.space3 }}>
            <AppCheckbox
              checked={splitEnabled}
              onToggle={onToggleSplit}
              error={
                splitEnabled && totalCents < 200
                  ? 'El monto mínimo para dividir cuenta es de $2.00 MXN ($1.00 por persona).'
                  : undefined
              }
              accessibilityLabel="Dividir cuenta entre varias personas"
              testID="pos-summary-split-checkbox"
            >
              <Pressable onPress={() => onToggleSplit(!splitEnabled)}>
                <Text
                  style={{
                    fontFamily: tokens.typography.families.semiBold,
                    fontSize: 14,
                    color: tokens.colors.textPrimary,
                  }}
                >
                  Dividir cuenta
                </Text>
              </Pressable>
            </AppCheckbox>
          </View>
        ) : null}

        <View
          style={[
            styles.actionsStack,
            { gap: tokens.spacing.space2 + 2, marginTop: tokens.spacing.space3 },
          ]}
        >
          <AppButton
            variant="primary"
            size="lg"
            leftIcon={splitEnabled ? 'user-round' : 'qr-code'}
            label={
              isGeneratingQr
                ? 'Generando QR…'
                : splitEnabled
                  ? `Dividir cuenta · ${formatCurrencyFromCents(totalCents)}`
                  : `Generar QR · ${formatCurrencyFromCents(totalCents)}`
            }
            loading={isGeneratingQr}
            disabled={!canGenerate}
            onPress={onConfirmGenerateQr}
            style={{ borderRadius: tokens.radius.radiusFull }}
            testID="pos-summary-generate-qr-button"
          />

          <AppButton
            variant="outlined"
            size="md"
            label="Regresar y modificar"
            disabled={isGeneratingQr}
            onPress={onModifyOrder}
            style={{ borderRadius: tokens.radius.radiusFull }}
            testID="pos-summary-modify-button"
          />
        </View>
      </View>
    </AppBottomSheet>
  );
}

const styles = StyleSheet.create({
  sheetBody: {
    width: '100%',
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 18,
  },
  itemsScroll: {
    maxHeight: 300,
  },
  itemCard: {
    borderWidth: 1,
    gap: 10,
  },
  itemTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  thumbBox: {
    width: 42,
    height: 42,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbImage: {
    width: '100%',
    height: '100%',
  },
  itemMeta: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  itemName: {
    fontSize: 14,
    lineHeight: 19,
  },
  itemUnitPrice: {
    fontSize: 12,
    lineHeight: 16,
  },
  itemLineTotal: {
    fontSize: 15,
    lineHeight: 20,
  },
  itemControlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  itemStepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  stepBtn: {
    width: 34,
    height: 34,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepQty: {
    minWidth: 24,
    textAlign: 'center',
    fontSize: 16,
    lineHeight: 20,
  },
  removeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  removeText: {
    fontSize: 12,
    lineHeight: 16,
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  totalLabel: {
    fontSize: 14,
    lineHeight: 20,
  },
  totalValue: {
    fontSize: 22,
    lineHeight: 28,
  },
  errorText: {
    fontSize: 13,
    lineHeight: 18,
  },
  actionsStack: {
    width: '100%',
  },
});
