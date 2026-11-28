import React, { useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ScreenContainer } from '@/components/layout';
import {
  AppButton,
  AppEmptyState,
  AppHeader,
  AppIcon,
  AppSkeleton,
  type AppIconName,
} from '@/components/ui';
import { useAppTheme } from '@/hooks';
import { useUiStore } from '@/stores';
import { formatCurrencyFromCents } from '@/utils/currency';
import { reportKeys } from '../queries/keys';
import { fetchSalesReport } from '../services';
import type { ReportRange } from '../types';
import { PaymentMethodsCard } from './PaymentMethodsCard';
import { ReportRangeSelector } from './ReportRangeSelector';
import { SalesBarChart } from './SalesBarChart';

export interface ReportsScreenProps {
  onBackPress: () => void;
}

interface GrowthBadgeConfig {
  label: string;
  icon: AppIconName | null;
  backgroundColor: string;
  textColor: string;
}

export function ReportsScreen({ onBackPress }: ReportsScreenProps) {
  const { tokens } = useAppTheme();
  const queryClient = useQueryClient();
  const authenticatedUser = useUiStore((state) => state.authenticatedUser);
  const enabled = Boolean(authenticatedUser?.id);

  const [range, setRange] = useState<ReportRange>('7d');

  const reportQuery = useQuery({
    queryKey: reportKeys.sales(range),
    queryFn: () => fetchSalesReport(range),
    enabled,
  });

  const isRefreshing = reportQuery.isRefetching && !reportQuery.isLoading;

  const handleRefresh = () => {
    void queryClient.invalidateQueries({ queryKey: reportKeys.sales(range) });
  };

  const getGrowthBadge = (growthPercent: number | null): GrowthBadgeConfig => {
    if (growthPercent === null) {
      return {
        label: 'Nuevo',
        icon: 'arrow-up',
        backgroundColor: tokens.colors.successLight,
        textColor: tokens.colors.success,
      };
    }

    if (growthPercent > 0) {
      return {
        label: `+${growthPercent}%`,
        icon: 'arrow-up',
        backgroundColor: tokens.colors.successLight,
        textColor: tokens.colors.success,
      };
    }

    if (growthPercent < 0) {
      return {
        label: `${growthPercent}%`,
        icon: 'arrow-down',
        backgroundColor: tokens.colors.errorLight,
        textColor: tokens.colors.error,
      };
    }

    return {
      label: '0%',
      icon: null,
      backgroundColor: tokens.colors.surfaceSecondary,
      textColor: tokens.colors.textSecondary,
    };
  };

  const report = reportQuery.data;
  const growthBadge = report ? getGrowthBadge(report.growthPercent) : null;

  return (
    <ScreenContainer edges={['top', 'bottom']} showBackdrop backdropTestID="reports-backdrop">
      <AppHeader
        title="Reportes"
        onBackPress={onBackPress}
        backTestID="reports-back-button"
        testID="reports-header"
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={tokens.colors.primary}
          />
        }
        contentContainerStyle={{
          paddingTop: tokens.spacing.space3,
          paddingBottom: tokens.spacing.space8,
          gap: tokens.spacing.space5,
        }}
      >
        <ReportRangeSelector value={range} onChange={setRange} />

        {reportQuery.isLoading ? (
          <View
            style={[
              styles.salesCard,
              tokens.shadows.card,
              {
                backgroundColor: tokens.colors.surfaceCard,
                borderRadius: 24,
                borderColor: 'rgba(114, 0, 217, 0.06)',
              },
            ]}
            testID="reports-loading"
          >
            <AppSkeleton width={110} height={14} />
            <AppSkeleton width={200} height={34} style={{ marginTop: 8 }} />
            <View style={styles.skeletonBadgeRow}>
              <AppSkeleton width={76} height={26} borderRadius={13} />
            </View>
            <View style={styles.skeletonBarsRow}>
              {[42, 64, 52, 82, 74, 102, 118].map((barHeight, idx) => (
                <AppSkeleton key={idx} width={22} height={barHeight} borderRadius={8} />
              ))}
            </View>
          </View>
        ) : reportQuery.isError ? (
          <AppEmptyState
            icon="circle-alert"
            title="No pudimos cargar tus reportes"
            description={reportQuery.error?.message ?? 'Intenta actualizar en unos segundos.'}
            actions={
              <AppButton
                variant="primary"
                size="md"
                label="Reintentar"
                onPress={handleRefresh}
                testID="reports-retry-button"
              />
            }
            testID="reports-error"
          />
        ) : report ? (
          <>
            <View
              style={[
                styles.salesCard,
                tokens.shadows.card,
                {
                  backgroundColor: tokens.colors.surfaceCard,
                  borderRadius: 24,
                  borderColor: 'rgba(114, 0, 217, 0.06)',
                },
              ]}
              testID="reports-sales-card"
            >
              <Text
                style={[
                  styles.cardLabel,
                  {
                    fontFamily: tokens.typography.families.medium,
                    color: tokens.colors.textSecondary,
                  },
                ]}
              >
                Ventas totales
              </Text>

              <View style={styles.amountRow}>
                <Text
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  testID="reports-total-amount"
                  style={[
                    styles.totalAmount,
                    tokens.typography.tabularNums,
                    {
                      fontFamily: tokens.typography.families.bold,
                      color: tokens.colors.textPrimary,
                    },
                  ]}
                >
                  {formatCurrencyFromCents(report.totalCents)}
                </Text>
                <Text
                  style={[
                    styles.currencyLabel,
                    {
                      fontFamily: tokens.typography.families.medium,
                      color: tokens.colors.textPrimary,
                    },
                  ]}
                >
                  MXN
                </Text>
              </View>

              {growthBadge ? (
                <View style={styles.growthRow}>
                  <View
                    style={[
                      styles.growthBadge,
                      {
                        backgroundColor: growthBadge.backgroundColor,
                        borderRadius: tokens.radius.radiusFull,
                      },
                    ]}
                    testID="reports-growth-badge"
                  >
                    {growthBadge.icon ? (
                      <AppIcon
                        name={growthBadge.icon}
                        size={14}
                        strokeWidth={2.2}
                        color={growthBadge.textColor}
                      />
                    ) : null}
                    <Text
                      style={[
                        styles.growthText,
                        tokens.typography.tabularNums,
                        {
                          fontFamily: tokens.typography.families.semiBold,
                          color: growthBadge.textColor,
                        },
                      ]}
                    >
                      {growthBadge.label}
                    </Text>
                  </View>
                </View>
              ) : null}

              <View style={{ marginTop: tokens.spacing.space3 }}>
                <SalesBarChart key={range} series={report.series} />
              </View>
            </View>

            <View style={{ paddingHorizontal: tokens.spacing.space1 }}>
              <PaymentMethodsCard items={report.paymentMethods} />
            </View>
          </>
        ) : null}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  salesCard: {
    borderWidth: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 18,
  },
  cardLabel: {
    fontSize: 14,
    lineHeight: 20,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    marginTop: 4,
  },
  totalAmount: {
    fontSize: 30,
    lineHeight: 36,
    letterSpacing: -0.6,
    flexShrink: 1,
  },
  currencyLabel: {
    fontSize: 16,
    lineHeight: 22,
  },
  growthRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  growthBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  growthText: {
    fontSize: 12,
    lineHeight: 16,
  },
  skeletonBadgeRow: {
    alignItems: 'flex-end',
    marginTop: 12,
  },
  skeletonBarsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 140,
    marginTop: 16,
    paddingHorizontal: 6,
  },
});
