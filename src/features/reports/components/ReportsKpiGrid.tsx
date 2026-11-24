import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AmountDisplay } from '@/components/financial';
import { AppCard, AppIcon } from '@/components/ui';
import { useAppTheme } from '@/hooks';

export interface ReportsKpiGridProps {
  totalReceivedCents: number;
  paymentsCount: number;
}

export function ReportsKpiGrid({ totalReceivedCents, paymentsCount }: ReportsKpiGridProps) {
  const { tokens } = useAppTheme();

  return (
    <View style={[styles.row, { gap: tokens.spacing.space3 }]}>
      <AppCard variant="standard" padding="md" testID="reports-kpi-sales" style={styles.kpiCard}>
        <View
          style={[
            styles.iconBox,
            {
              backgroundColor: tokens.colors.lavender,
              borderRadius: tokens.radius.radiusMD,
            },
          ]}
        >
          <AppIcon name="chart-no-axes-column" size={20} color={tokens.colors.primary} />
        </View>
        <Text
          style={[
            styles.kpiLabel,
            {
              fontFamily: tokens.typography.families.medium,
              color: tokens.colors.textSecondary,
              marginTop: tokens.spacing.space3,
            },
          ]}
        >
          Ventas
        </Text>
        <AmountDisplay
          amountCents={totalReceivedCents}
          size="md"
          tone="default"
          omitZeroCents
          adjustsFontSizeToFit
          testID="reports-total-amount"
          style={{ marginTop: tokens.spacing.space1 }}
        />
      </AppCard>

      <AppCard variant="standard" padding="md" testID="reports-kpi-count" style={styles.kpiCard}>
        <View
          style={[
            styles.iconBox,
            {
              backgroundColor: tokens.colors.successLight,
              borderRadius: tokens.radius.radiusMD,
            },
          ]}
        >
          <AppIcon name="circle-check" size={20} color={tokens.colors.success} />
        </View>
        <Text
          style={[
            styles.kpiLabel,
            {
              fontFamily: tokens.typography.families.medium,
              color: tokens.colors.textSecondary,
              marginTop: tokens.spacing.space3,
            },
          ]}
        >
          Pagos recibidos
        </Text>
        <Text
          testID="reports-payments-count"
          style={[
            styles.kpiValue,
            tokens.typography.tabularNums,
            {
              fontFamily: tokens.typography.families.bold,
              color: tokens.colors.textPrimary,
              marginTop: tokens.spacing.space1,
            },
          ]}
        >
          {paymentsCount}
        </Text>
      </AppCard>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
  },
  kpiCard: {
    flex: 1,
    minHeight: 120,
    justifyContent: 'space-between',
  },
  iconBox: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kpiLabel: {
    fontSize: 13,
    lineHeight: 18,
  },
  kpiValue: {
    fontSize: 24,
    lineHeight: 30,
    letterSpacing: -0.4,
  },
});
