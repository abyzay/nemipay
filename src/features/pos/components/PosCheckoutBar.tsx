import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AppButton } from '@/components/ui';
import { useAppTheme } from '@/hooks';
import { formatCurrencyFromCents } from '@/utils/currency';

export interface PosCheckoutBarProps {
  unitsCount: number;
  totalCents: number;
  disabled: boolean;
  loading?: boolean;
  onQrCheckoutPress: () => void;
  onClearCartPress: () => void;
}

export function PosCheckoutBar({
  unitsCount,
  totalCents,
  disabled,
  loading = false,
  onQrCheckoutPress,
  onClearCartPress,
}: PosCheckoutBarProps) {
  const { tokens } = useAppTheme();
  const unitsLabel = unitsCount === 1 ? '1 artículo' : `${unitsCount} artículos`;

  return (
    <View
      testID="pos-checkout-bar"
      style={[
        styles.container,
        {
          backgroundColor: tokens.colors.background,
          borderTopColor: tokens.colors.divider,
          paddingTop: tokens.spacing.space3,
          paddingBottom: tokens.spacing.space2,
          gap: tokens.spacing.space2,
        },
      ]}
    >
      <View style={styles.summaryRow}>
        <Text
          testID="pos-checkout-summary"
          style={[
            styles.summaryText,
            tokens.typography.tabularNums,
            {
              fontFamily: tokens.typography.families.semiBold,
              color: tokens.colors.textPrimary,
            },
          ]}
        >
          {`${unitsLabel} · Total ${formatCurrencyFromCents(totalCents)}`}
        </Text>

        {unitsCount > 0 ? (
          <Pressable
            accessibilityRole="button"
            onPress={onClearCartPress}
            disabled={loading}
            hitSlop={8}
            testID="pos-clear-cart-button"
          >
            <Text
              style={[
                styles.clearText,
                {
                  fontFamily: tokens.typography.families.semiBold,
                  color: tokens.colors.error,
                },
              ]}
            >
              Vaciar
            </Text>
          </Pressable>
        ) : null}
      </View>

      <AppButton
        variant="primary"
        size="md"
        leftIcon="qr-code"
        label={loading ? 'Generando QR…' : 'Cobrar con CoDi'}
        loading={loading}
        disabled={disabled || loading}
        onPress={onQrCheckoutPress}
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
  },
  summaryText: {
    fontSize: 15,
    lineHeight: 20,
  },
  clearText: {
    fontSize: 13,
    lineHeight: 18,
  },
});
