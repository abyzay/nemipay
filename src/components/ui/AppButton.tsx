import React from 'react';
import { Pressable, StyleSheet, Text, type StyleProp, type ViewStyle } from 'react-native';
import { useAppTheme } from '@/hooks';

export type AppButtonVariant = 'primary' | 'outlined';

export interface AppButtonProps {
  label: string;
  onPress: () => void;
  variant?: AppButtonVariant;
  disabled?: boolean;
  fullWidth?: boolean;
  accessibilityLabel?: string;
  testID?: string;
  style?: StyleProp<ViewStyle>;
}

export function AppButton({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  fullWidth = true,
  accessibilityLabel,
  testID,
  style,
}: AppButtonProps) {
  const { tokens } = useAppTheme();
  const isPrimary = variant === 'primary';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      testID={testID}
      style={({ pressed }) => [
        styles.base,
        {
          borderRadius: tokens.radii.full,
          minHeight: 54,
          paddingHorizontal: tokens.spacing.lg,
          width: fullWidth ? '100%' : undefined,
        },
        isPrimary
          ? {
              backgroundColor: disabled
                ? tokens.colors.disabled
                : pressed
                  ? tokens.colors.primaryDark
                  : tokens.colors.primary,
              borderWidth: 1.5,
              borderColor: disabled
                ? tokens.colors.disabled
                : pressed
                  ? tokens.colors.primaryDark
                  : tokens.colors.primary,
            }
          : {
              backgroundColor: pressed ? tokens.colors.secondary : tokens.colors.surface,
              borderWidth: 1.5,
              borderColor: disabled ? tokens.colors.disabled : tokens.colors.primary,
            },
        style,
      ]}
    >
      <Text
        style={[
          styles.label,
          {
            fontFamily: tokens.typography.families.semiBold,
            color: isPrimary
              ? tokens.colors.onPrimary
              : disabled
                ? tokens.colors.disabled
                : tokens.colors.primary,
          },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 16,
    lineHeight: 22,
    letterSpacing: 0.1,
  },
});
