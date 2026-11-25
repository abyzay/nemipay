import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AmountDisplay } from '@/components/financial';
import { AppIcon, type AppIconName } from '@/components/ui';
import { useAppTheme } from '@/hooks';
import type { ColorPalette } from '@/theme/colors';
import type { MovementStatus, TodayMovement } from '../types';

export interface MovementRowProps {
  movement: TodayMovement;
  onPress?: (movement: TodayMovement) => void;
  testID?: string;
}

interface StatusVisualConfig {
  label: string;
  icon: AppIconName;
  getColors: (colors: ColorPalette) => { background: string; icon: string; statusText: string };
}

export const MOVEMENT_STATUS_META: Record<MovementStatus, StatusVisualConfig> = {
  CONFIRMED: {
    label: 'Pagado',
    icon: 'circle-check',
    getColors: (colors) => ({
      background: colors.successLight,
      icon: colors.success,
      statusText: colors.success,
    }),
  },
  AWAITING_PAYMENT: {
    label: 'Esperando pago',
    icon: 'clock',
    getColors: (colors) => ({
      background: colors.warningLight,
      icon: colors.warning,
      statusText: colors.warningText,
    }),
  },
  CREATING: {
    label: 'Creando QR',
    icon: 'qr-code',
    getColors: (colors) => ({
      background: colors.lavender,
      icon: colors.primary,
      statusText: colors.primary,
    }),
  },
  EXPIRED: {
    label: 'Expirado',
    icon: 'timer-off',
    getColors: (colors) => ({
      background: colors.surfaceSecondary,
      icon: colors.textSecondary,
      statusText: colors.textSecondary,
    }),
  },
  CANCELLED: {
    label: 'Cancelado',
    icon: 'ban',
    getColors: (colors) => ({
      background: colors.surfaceSecondary,
      icon: colors.gray[600],
      statusText: colors.gray[600],
    }),
  },
  FAILED: {
    label: 'Fallido',
    icon: 'circle-alert',
    getColors: (colors) => ({
      background: colors.errorLight,
      icon: colors.error,
      statusText: colors.error,
    }),
  },
  UNDER_REVIEW: {
    label: 'En revisión',
    icon: 'shield-alert',
    getColors: (colors) => ({
      background: colors.warningLight,
      icon: colors.warningText,
      statusText: colors.warningText,
    }),
  },
};

export function MovementRow({ movement, onPress, testID }: MovementRowProps) {
  const { tokens } = useAppTheme();
  const isConfirmed = movement.status === 'CONFIRMED';
  const meta = MOVEMENT_STATUS_META[movement.status];
  const visual = meta.getColors(tokens.colors);
  const statusLabel = isConfirmed && movement.paidAfterExpiry ? 'Pagado (tardío)' : meta.label;

  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={`${movement.concept}, ${statusLabel}, ${movement.timeLabel}`}
      disabled={!onPress}
      onPress={() => onPress?.(movement)}
      testID={testID}
      style={({ pressed }) => [
        styles.row,
        {
          paddingVertical: tokens.spacing.space3,
          paddingHorizontal: tokens.spacing.space1,
          gap: tokens.spacing.space3,
          borderRadius: tokens.radius.radiusMD,
          backgroundColor: pressed ? tokens.colors.lavenderSoft : 'transparent',
        },
      ]}
    >
      <View
        style={[
          styles.iconContainer,
          {
            backgroundColor: visual.background,
            borderRadius: tokens.radius.radiusFull,
          },
        ]}
      >
        <AppIcon
          name={meta.icon}
          size={20}
          strokeWidth={2.1}
          color={visual.icon}
          testID={testID ? `${testID}-icon-${meta.icon}` : undefined}
        />
      </View>

      <View style={styles.detailsColumn}>
        <Text
          numberOfLines={1}
          style={[
            styles.title,
            {
              fontFamily: tokens.typography.families.semiBold,
              color: tokens.colors.textPrimary,
            },
          ]}
        >
          {movement.concept}
        </Text>
        <Text
          numberOfLines={1}
          style={[
            styles.subtitle,
            {
              fontFamily: tokens.typography.families.regular,
              color: tokens.colors.textSecondary,
            },
          ]}
        >
          {movement.timeLabel}
        </Text>
      </View>

      <View style={styles.amountColumn}>
        <AmountDisplay
          amountCents={movement.amountCents}
          currency={movement.currency}
          size="sm"
          tone={isConfirmed ? 'received' : 'default'}
          showPlusSign={isConfirmed}
        />
        <Text
          numberOfLines={1}
          style={[
            styles.statusText,
            {
              fontFamily: tokens.typography.families.medium,
              color: visual.statusText,
            },
          ]}
        >
          {statusLabel}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailsColumn: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 15,
    lineHeight: 20,
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 18,
  },
  amountColumn: {
    alignItems: 'flex-end',
    gap: 2,
  },
  statusText: {
    fontSize: 11,
    lineHeight: 15,
  },
});
