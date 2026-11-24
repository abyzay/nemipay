import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AppIcon } from '@/components/ui';
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
          borderTopColor: tokens.colors.border,
          paddingTop: tokens.spacing.xs,
          paddingBottom: tokens.spacing.xs,
          gap: tokens.spacing.sm,
        },
      ]}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Cobrar con QR"
        accessibilityState={{ disabled }}
        disabled={disabled}
        onPress={onQrCheckoutPress}
        testID="pos-checkout-qr-button"
        style={({ pressed }) => [
          styles.button,
          {
            borderRadius: tokens.radii.full,
            backgroundColor: disabled
              ? tokens.colors.disabled
              : pressed
                ? tokens.colors.primaryDark
                : tokens.colors.primary,
            borderColor: disabled
              ? tokens.colors.disabled
              : pressed
                ? tokens.colors.primaryDark
                : tokens.colors.primary,
            gap: tokens.spacing.xs,
          },
        ]}
      >
        <AppIcon name="qr-code-outline" size={20} color={tokens.colors.onPrimary} />
        <Text
          numberOfLines={1}
          style={[
            styles.label,
            {
              fontFamily: tokens.typography.families.semiBold,
              color: tokens.colors.onPrimary,
            },
          ]}
        >
          Cobrar con QR
        </Text>
      </Pressable>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Cobrar en efectivo"
        accessibilityState={{ disabled }}
        disabled={disabled}
        onPress={onCashCheckoutPress}
        testID="pos-checkout-cash-button"
        style={({ pressed }) => [
          styles.button,
          {
            borderRadius: tokens.radii.full,
            backgroundColor: pressed ? tokens.colors.secondary : tokens.colors.surface,
            borderColor: disabled ? tokens.colors.disabled : tokens.colors.primary,
            gap: tokens.spacing.xs,
          },
        ]}
      >
        <AppIcon
          name="cash-outline"
          size={20}
          color={disabled ? tokens.colors.disabled : tokens.colors.primary}
        />
        <Text
          numberOfLines={1}
          style={[
            styles.label,
            {
              fontFamily: tokens.typography.families.semiBold,
              color: disabled ? tokens.colors.disabled : tokens.colors.primary,
            },
          ]}
        >
          Efectivo
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderTopWidth: 1,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    borderWidth: 1.5,
    paddingHorizontal: 12,
  },
  label: {
    fontSize: 14,
    lineHeight: 20,
  },
});
