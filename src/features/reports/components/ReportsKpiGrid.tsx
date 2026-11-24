import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AppIcon } from '@/components/ui';
import { useAppTheme } from '@/hooks';
import { formatCurrencyFromCents } from '@/utils/currency';

export interface ReportsKpiGridProps {
  totalReceivedCents: number;
  paymentsCount: number;
}

export function ReportsKpiGrid({ totalReceivedCents, paymentsCount }: ReportsKpiGridProps) {
  const { tokens } = useAppTheme();

  return (
    <View style={[styles.row, { gap: tokens.spacing.sm }]}>
      <View
        testID="reports-kpi-sales"
        style={[
          styles.kpiCard,
          {
            backgroundColor: tokens.colors.secondary,
            borderColor: tokens.colors.border,
            borderRadius: tokens.radii.lg,
            padding: tokens.spacing.md,
          },
        ]}
      >
        <AppIcon name="stats-chart" size={24} color={tokens.colors.primaryDark} />
        <Text
          style={[
            styles.kpiLabel,
            {
              fontFamily: tokens.typography.families.medium,
              color: tokens.colors.onSecondary,
              marginTop: tokens.spacing.xs,
            },
          ]}
        >
          Ventas
        </Text>
        <Text
          testID="reports-total-amount"
          numberOfLines={1}
          adjustsFontSizeToFit
          style={[
            styles.kpiValue,
            {
              fontFamily: tokens.typography.families.bold,
              color: tokens.colors.textPrimary,
            },
          ]}
        >
          {formatCurrencyFromCents(totalReceivedCents, { omitZeroCents: true })}
        </Text>
      </View>

      <View
        testID="reports-kpi-count"
        style={[
          styles.kpiCard,
          {
            backgroundColor: tokens.colors.secondary,
            borderColor: tokens.colors.border,
            borderRadius: tokens.radii.lg,
            padding: tokens.spacing.md,
          },
        ]}
      >
        <AppIcon name="checkmark-circle" size={26} color={tokens.colors.success} />
        <Text
          style={[
            styles.kpiLabel,
            {
              fontFamily: tokens.typography.families.medium,
              color: tokens.colors.onSecondary,
              marginTop: tokens.spacing.xs,
            },
          ]}
        >
          Pagos recibidos
        </Text>
        <Text
          testID="reports-payments-count"
          style={[
            styles.kpiValue,
            {
              fontFamily: tokens.typography.families.bold,
              color: tokens.colors.textPrimary,
            },
          ]}
        >
          {paymentsCount}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
  },
  kpiCard: {
    flex: 1,
    borderWidth: 1,
    justifyContent: 'space-between',
    minHeight: 112,
  },
  kpiLabel: {
    fontSize: 13,
    lineHeight: 18,
  },
  kpiValue: {
    fontSize: 26,
    lineHeight: 32,
    letterSpacing: -0.5,
  },
});
