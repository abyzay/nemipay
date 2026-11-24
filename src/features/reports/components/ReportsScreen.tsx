import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ScreenContainer } from '@/components/layout';
import { AppIcon, SurfaceCard } from '@/components/ui';
import { useAppTheme } from '@/hooks';
import { formatCurrencyFromCents } from '@/utils/currency';
import { getMockReportPeriods } from '../services';
import type { ReportPeriodId } from '../types';

export function ReportsScreen() {
  const { tokens } = useAppTheme();
  const periods = useMemo(() => getMockReportPeriods(), []);
  const [selectedPeriodId, setSelectedPeriodId] = useState<ReportPeriodId>('today');

  const activePeriod = useMemo(
    () => periods.find((period) => period.id === selectedPeriodId) ?? periods[0],
    [periods, selectedPeriodId]
  );

  if (!activePeriod) {
    return null;
  }

  return (
    <ScreenContainer edges={['top']} scrollable>
      <View style={[styles.header, { paddingTop: tokens.spacing.sm }]}>
        <Text
          style={[
            styles.title,
            {
              fontFamily: tokens.typography.families.bold,
              color: tokens.colors.textPrimary,
            },
          ]}
        >
          Reportes de cobros
        </Text>
        <Text
          style={[
            styles.subtitle,
            {
              fontFamily: tokens.typography.families.regular,
              color: tokens.colors.textSecondary,
            },
          ]}
        >
          Resumen operativo de pagos recibidos
        </Text>
      </View>

      <View
        style={[
          styles.periodSwitch,
          {
            backgroundColor: tokens.colors.surface,
            borderColor: tokens.colors.border,
            borderRadius: tokens.radii.full,
            padding: tokens.spacing.xxs,
            marginTop: tokens.spacing.md,
          },
        ]}
      >
        {periods.map((period) => {
          const isSelected = period.id === activePeriod.id;
          return (
            <Pressable
              key={period.id}
              accessibilityRole="button"
              onPress={() => setSelectedPeriodId(period.id)}
              testID={`reports-period-${period.id}`}
              style={[
                styles.periodButton,
                {
                  borderRadius: tokens.radii.full,
                  backgroundColor: isSelected ? tokens.colors.primary : 'transparent',
                  paddingVertical: tokens.spacing.xs + 2,
                },
              ]}
            >
              <Text
                style={[
                  styles.periodLabel,
                  {
                    fontFamily: tokens.typography.families.semiBold,
                    color: isSelected ? tokens.colors.onPrimary : tokens.colors.textSecondary,
                  },
                ]}
              >
                {period.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <SurfaceCard style={{ marginTop: tokens.spacing.md, gap: tokens.spacing.xs }}>
        <Text
          style={[
            styles.metricLabel,
            {
              fontFamily: tokens.typography.families.medium,
              color: tokens.colors.textSecondary,
            },
          ]}
        >
          {`Total cobrado (${activePeriod.label.toLowerCase()})`}
        </Text>
        <Text
          testID="reports-total-amount"
          style={[
            styles.heroAmount,
            {
              fontFamily: tokens.typography.families.bold,
              color: tokens.colors.primary,
            },
          ]}
        >
          {formatCurrencyFromCents(activePeriod.totalReceivedCents)}
        </Text>
      </SurfaceCard>

      <View style={[styles.metricsGrid, { gap: tokens.spacing.sm, marginTop: tokens.spacing.sm }]}>
        <SurfaceCard style={styles.metricTile}>
          <AppIcon name="checkmark-circle-outline" size={22} color={tokens.colors.success} />
          <Text
            style={[
              styles.tileValue,
              {
                fontFamily: tokens.typography.families.bold,
                color: tokens.colors.textPrimary,
              },
            ]}
          >
            {activePeriod.paymentsCount}
          </Text>
          <Text
            style={[
              styles.tileCaption,
              {
                fontFamily: tokens.typography.families.regular,
                color: tokens.colors.textSecondary,
              },
            ]}
          >
            Cobros recibidos
          </Text>
        </SurfaceCard>

        <SurfaceCard style={styles.metricTile}>
          <AppIcon name="trending-up-outline" size={22} color={tokens.colors.primary} />
          <Text
            style={[
              styles.tileValue,
              {
                fontFamily: tokens.typography.families.bold,
                color: tokens.colors.textPrimary,
              },
            ]}
          >
            {formatCurrencyFromCents(activePeriod.averageTicketCents)}
          </Text>
          <Text
            style={[
              styles.tileCaption,
              {
                fontFamily: tokens.typography.families.regular,
                color: tokens.colors.textSecondary,
              },
            ]}
          >
            Ticket promedio
          </Text>
        </SurfaceCard>
      </View>

      <SurfaceCard style={{ marginTop: tokens.spacing.sm, gap: tokens.spacing.xs }}>
        <View style={styles.shareHeader}>
          <Text
            style={[
              styles.metricLabel,
              {
                fontFamily: tokens.typography.families.semiBold,
                color: tokens.colors.textPrimary,
              },
            ]}
          >
            Cobros con QR CoDi
          </Text>
          <Text
            style={[
              styles.sharePercent,
              {
                fontFamily: tokens.typography.families.bold,
                color: tokens.colors.primary,
              },
            ]}
          >
            {`${activePeriod.qrSharePercent}%`}
          </Text>
        </View>
        <View
          style={[
            styles.progressTrack,
            {
              backgroundColor: tokens.colors.secondary,
              borderRadius: tokens.radii.full,
            },
          ]}
        >
          <View
            style={[
              styles.progressFill,
              {
                width: `${activePeriod.qrSharePercent}%`,
                backgroundColor: tokens.colors.primary,
                borderRadius: tokens.radii.full,
              },
            ]}
          />
        </View>
      </SurfaceCard>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: 4,
  },
  title: {
    fontSize: 22,
    lineHeight: 28,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  periodSwitch: {
    flexDirection: 'row',
    borderWidth: 1,
  },
  periodButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  periodLabel: {
    fontSize: 13,
    lineHeight: 18,
  },
  metricLabel: {
    fontSize: 13,
    lineHeight: 18,
  },
  heroAmount: {
    fontSize: 32,
    lineHeight: 40,
    letterSpacing: -0.5,
  },
  metricsGrid: {
    flexDirection: 'row',
  },
  metricTile: {
    flex: 1,
    gap: 4,
  },
  tileValue: {
    fontSize: 20,
    lineHeight: 26,
    marginTop: 4,
  },
  tileCaption: {
    fontSize: 12,
    lineHeight: 16,
  },
  shareHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sharePercent: {
    fontSize: 15,
    lineHeight: 20,
  },
  progressTrack: {
    height: 10,
    width: '100%',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
  },
});
