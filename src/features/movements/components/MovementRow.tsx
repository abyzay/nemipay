import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AppIcon, SurfaceCard } from '@/components/ui';
import { useAppTheme } from '@/hooks';
import { formatCurrencyFromCents } from '@/utils/currency';
import type { ReceivedMovement } from '../types';

export interface MovementRowProps {
  movement: ReceivedMovement;
  compact?: boolean;
  testID?: string;
}

export function MovementRow({ movement, compact = false, testID }: MovementRowProps) {
  const { tokens } = useAppTheme();

  return (
    <SurfaceCard padding="sm" testID={testID}>
      <View style={[styles.row, { gap: tokens.spacing.sm }]}>
        <View
          style={[
            styles.iconBadge,
            {
              width: compact ? 38 : 42,
              height: compact ? 38 : 42,
              borderRadius: tokens.radii.md,
              backgroundColor: tokens.colors.secondary,
            },
          ]}
        >
          <AppIcon
            name={movement.iconName}
            size={compact ? 19 : 21}
            color={tokens.colors.primaryDark}
          />
        </View>

        <View style={styles.detailsColumn}>
          <Text
            numberOfLines={1}
            style={[
              styles.concept,
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
              styles.timeLabel,
              {
                fontFamily: tokens.typography.families.regular,
                color: tokens.colors.textSecondary,
              },
            ]}
          >
            {compact ? movement.timeLabel : `${movement.payerReference} · ${movement.timeLabel}`}
          </Text>
        </View>

        <View style={styles.amountColumn}>
          <Text
            style={[
              styles.amount,
              {
                fontFamily: tokens.typography.families.bold,
                color: tokens.colors.success,
              },
            ]}
          >
            {formatCurrencyFromCents(movement.amountCents, {
              currency: movement.currency,
              showPlusSign: true,
            })}
          </Text>
          <Text
            style={[
              styles.statusLabel,
              {
                fontFamily: tokens.typography.families.medium,
                color: tokens.colors.textSecondary,
              },
            ]}
          >
            Recibido
          </Text>
        </View>
      </View>
    </SurfaceCard>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBadge: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailsColumn: {
    flex: 1,
    gap: 1,
  },
  concept: {
    fontSize: 14,
    lineHeight: 19,
  },
  timeLabel: {
    fontSize: 12,
    lineHeight: 16,
  },
  amountColumn: {
    alignItems: 'flex-end',
    gap: 1,
  },
  amount: {
    fontSize: 15,
    lineHeight: 20,
  },
  statusLabel: {
    fontSize: 11,
    lineHeight: 14,
  },
});
