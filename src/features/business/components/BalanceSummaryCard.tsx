import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AppIcon, SurfaceCard } from '@/components/ui';
import { useAppTheme } from '@/hooks';
import type { CurrencyCode } from '@/types/common';
import { formatCurrencyFromCents } from '@/utils/currency';

export interface BalanceSummaryCardProps {
  todayReceivedCents: number;
  todayCount: number;
  currency: CurrencyCode;
}

export function BalanceSummaryCard({
  todayReceivedCents,
  todayCount,
  currency,
}: BalanceSummaryCardProps) {
  const { tokens } = useAppTheme();

  return (
    <SurfaceCard padding="sm" testID="dashboard-balance-card">
      <View style={[styles.row, { paddingHorizontal: tokens.spacing.xxs }]}>
        <View style={styles.textGroup}>
          <View style={[styles.labelRow, { gap: tokens.spacing.xs }]}>
            <Text
              style={[
                styles.label,
                {
                  fontFamily: tokens.typography.families.medium,
                  color: tokens.colors.textSecondary,
                },
              ]}
            >
              Cobros de hoy
            </Text>
            <View
              style={[
                styles.countPill,
                {
                  backgroundColor: tokens.colors.secondary,
                  borderRadius: tokens.radii.full,
                  paddingHorizontal: tokens.spacing.xs,
                },
              ]}
            >
              <Text
                style={[
                  styles.countText,
                  {
                    fontFamily: tokens.typography.families.semiBold,
                    color: tokens.colors.primaryDark,
                  },
                ]}
              >
                {`${todayCount} recibidos`}
              </Text>
            </View>
          </View>

          <Text
            testID="dashboard-balance-amount"
            style={[
              styles.amount,
              {
                fontFamily: tokens.typography.families.bold,
                color: tokens.colors.textPrimary,
              },
            ]}
          >
            {formatCurrencyFromCents(todayReceivedCents, { currency })}
          </Text>
        </View>

        <View
          style={[
            styles.walletBadge,
            {
              backgroundColor: tokens.colors.secondary,
              borderRadius: tokens.radii.md,
            },
          ]}
        >
          <AppIcon name="wallet-outline" size={24} color={tokens.colors.primary} />
        </View>
      </View>
    </SurfaceCard>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  textGroup: {
    flex: 1,
    gap: 2,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  label: {
    fontSize: 13,
    lineHeight: 18,
  },
  countPill: {
    paddingVertical: 2,
  },
  countText: {
    fontSize: 11,
    lineHeight: 15,
  },
  amount: {
    fontSize: 28,
    lineHeight: 34,
    letterSpacing: -0.5,
  },
  walletBadge: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
