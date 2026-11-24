import React from 'react';
import { StyleSheet, View } from 'react-native';
import { AppButton } from '@/components/ui';
import { useAppTheme } from '@/hooks';

export interface PosCheckoutBarProps {
  disabled: boolean;
  onQrCheckoutPress: () => void;
  onCashCheckoutPress: () => void;
}

export function PosCheckoutBar({
  disabled,
  onQrCheckoutPress,
  onCashCheckoutPress,
}: PosCheckoutBarProps) {
  const { tokens } = useAppTheme();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: tokens.colors.background,
          borderTopColor: tokens.colors.divider,
          paddingTop: tokens.spacing.space3,
          paddingBottom: tokens.spacing.space2,
          gap: tokens.spacing.space3,
        },
      ]}
    >
      <View style={styles.buttonCol}>
        <AppButton
          variant="primary"
          size="md"
          leftIcon="qr-code"
          label="Cobrar con QR"
          disabled={disabled}
          onPress={onQrCheckoutPress}
          testID="pos-checkout-qr-button"
        />
      </View>

      <View style={styles.buttonCol}>
        <AppButton
          variant="outlined"
          size="md"
          leftIcon="banknote"
          label="Efectivo"
          disabled={disabled}
          onPress={onCashCheckoutPress}
          testID="pos-checkout-cash-button"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderTopWidth: 1,
  },
  buttonCol: {
    flex: 1,
  },
});
