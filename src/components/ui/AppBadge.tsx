import React from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { useAppTheme } from '@/hooks';
import { AppIcon, type AppIconName } from './AppIcon';

export type AppBadgeVariant = 'success' | 'warning' | 'error' | 'neutral' | 'lavender';

export interface AppBadgeProps {
  label: string;
  variant?: AppBadgeVariant;
  icon?: AppIconName;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export function AppBadge({ label, variant = 'neutral', icon, style, testID }: AppBadgeProps) {
  const { tokens } = useAppTheme();

  const palette = {
    success: {
      bg: tokens.colors.successLight,
      text: tokens.colors.success,
    },
    warning: {
      bg: tokens.colors.warningLight,
      text: tokens.colors.warningText,
    },
    error: {
      bg: tokens.colors.errorLight,
      text: tokens.colors.error,
    },
    neutral: {
      bg: tokens.colors.surfaceSecondary,
      text: tokens.colors.textSecondary,
    },
    lavender: {
      bg: tokens.colors.lavender,
      text: tokens.colors.primary,
    },
  }[variant];

  return (
    <View
      testID={testID}
      style={[
        styles.badge,
        {
          backgroundColor: palette.bg,
          borderRadius: tokens.radius.radiusFull,
          paddingHorizontal: tokens.spacing.space2 + 2,
          paddingVertical: tokens.spacing.space1,
          gap: tokens.spacing.space1,
        },
        style,
      ]}
    >
      {icon ? <AppIcon name={icon} size={13} color={palette.text} /> : null}
      <Text
        numberOfLines={1}
        style={[
          styles.label,
          {
            fontFamily: tokens.typography.families.semiBold,
            color: palette.text,
          },
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  label: {
    fontSize: 12,
    lineHeight: 16,
  },
});
