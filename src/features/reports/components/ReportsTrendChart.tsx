import React, { useMemo } from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { LineChart, type lineDataItem } from 'react-native-gifted-charts';
import { AppCard } from '@/components/ui';
import { useAppTheme } from '@/hooks';
import { formatCurrencyFromCents } from '@/utils/currency';
import type { ReportChartPoint } from '../types';

export interface ReportsTrendChartProps {
  points: ReportChartPoint[];
  yAxisStepValue: number;
  yAxisMaxValue: number;
}

interface ChartPointItem extends lineDataItem {
  paymentsCount?: number;
}

export function ReportsTrendChart({
  points,
  yAxisStepValue,
  yAxisMaxValue,
}: ReportsTrendChartProps) {
  const { tokens } = useAppTheme();
  const { width: windowWidth } = useWindowDimensions();

  const yAxisLabelWidth = 38;
  const chartContainerWidth = Math.max(
    220,
    windowWidth -
      tokens.layout.screenHorizontalPadding * 2 -
      tokens.layout.cardPadding * 2 -
      yAxisLabelWidth -
      8
  );

  const chartData = useMemo<ChartPointItem[]>(
    () =>
      points.map((point) => ({
        value: point.value,
        label: point.label,
        paymentsCount: point.paymentsCount,
      })),
    [points]
  );

  const formatYLabel = (rawLabel: string): string => {
    const numeric = Number.parseFloat(rawLabel);
    if (!Number.isFinite(numeric) || numeric === 0) {
      return '0';
    }
    if (numeric >= 1000) {
      const thousands = numeric / 1000;
      const clean = Number.isInteger(thousands) ? thousands.toString() : thousands.toFixed(1);
      return `${clean}k`;
    }
    return `${Math.round(numeric)}`;
  };

  return (
    <AppCard testID="reports-trend-chart-card" style={styles.card}>
      <View style={styles.chartWrapper}>
        <LineChart
          areaChart
          data={chartData}
          width={chartContainerWidth}
          height={172}
          adjustToWidth
          initialSpacing={14}
          endSpacing={14}
          maxValue={yAxisMaxValue}
          stepValue={yAxisStepValue}
          noOfSections={3}
          thickness={2.5}
          color={tokens.colors.primary}
          startFillColor={tokens.colors.primaryLight}
          endFillColor={tokens.colors.background}
          startOpacity={0.2}
          endOpacity={0.02}
          dataPointsColor={tokens.colors.primary}
          dataPointsRadius={5}
          rulesType="solid"
          rulesColor={tokens.colors.divider}
          rulesThickness={1}
          showVerticalLines
          verticalLinesColor={tokens.colors.divider}
          verticalLinesThickness={1}
          yAxisColor={tokens.colors.border}
          xAxisColor={tokens.colors.border}
          yAxisThickness={1}
          xAxisThickness={1}
          yAxisLabelWidth={yAxisLabelWidth}
          formatYLabel={formatYLabel}
          yAxisTextStyle={{
            fontFamily: tokens.typography.families.regular,
            fontSize: 11,
            color: tokens.colors.textSecondary,
          }}
          xAxisLabelTextStyle={{
            fontFamily: tokens.typography.families.medium,
            fontSize: 11,
            color: tokens.colors.textSecondary,
          }}
          pointerConfig={{
            pointerStripColor: tokens.colors.primary,
            pointerStripWidth: 1.5,
            pointerColor: tokens.colors.primaryDark,
            radius: 6,
            pointerLabelWidth: 116,
            pointerLabelHeight: 46,
            activatePointersOnLongPress: false,
            autoAdjustPointerLabelPosition: true,
            pointerLabelComponent: (items: ChartPointItem[]) => {
              const first = items[0];
              if (!first) {
                return null;
              }
              const valueCents = Math.round((first.value ?? 0) * 100);
              return (
                <View
                  style={[
                    styles.tooltip,
                    {
                      backgroundColor: tokens.colors.textPrimary,
                      borderRadius: tokens.radius.radiusMD,
                      paddingHorizontal: tokens.spacing.space2,
                      paddingVertical: tokens.spacing.space1 + 2,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.tooltipAmount,
                      tokens.typography.tabularNums,
                      {
                        fontFamily: tokens.typography.families.bold,
                        color: tokens.colors.textOnPrimary,
                      },
                    ]}
                  >
                    {formatCurrencyFromCents(valueCents, { omitZeroCents: true })}
                  </Text>
                  <Text
                    style={[
                      styles.tooltipMeta,
                      {
                        fontFamily: tokens.typography.families.regular,
                        color: tokens.colors.lavender,
                      },
                    ]}
                  >
                    {`${first.paymentsCount ?? 0} cobros`}
                  </Text>
                </View>
              );
            },
          }}
        />
      </View>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  card: {
    overflow: 'hidden',
  },
  chartWrapper: {
    alignItems: 'center',
    paddingTop: 6,
  },
  tooltip: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tooltipAmount: {
    fontSize: 12,
    lineHeight: 16,
  },
  tooltipMeta: {
    fontSize: 10,
    lineHeight: 14,
  },
});
