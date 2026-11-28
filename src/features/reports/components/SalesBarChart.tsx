import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';
import Svg, { Defs, LinearGradient as SvgLinearGradient, Rect, Stop } from 'react-native-svg';
import { useAppTheme } from '@/hooks';
import { formatCurrencyFromCents } from '@/utils/currency';
import type { SalesChartPoint } from '../types';

export interface SalesBarChartProps {
  series: SalesChartPoint[];
}

const CHART_HEIGHT = 152;
const TOP_PADDING = 8;
const MIN_ACTIVE_BAR_HEIGHT = 16;
const EMPTY_BASELINE_HEIGHT = 10;

export function SalesBarChart({ series }: SalesBarChartProps) {
  const { tokens } = useAppTheme();
  const [chartWidth, setChartWidth] = useState(300);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  const handleLayout = (event: LayoutChangeEvent) => {
    const measuredWidth = Math.round(event.nativeEvent.layout.width);
    if (measuredWidth > 0 && measuredWidth !== chartWidth) {
      setChartWidth(measuredWidth);
    }
  };

  const count = Math.max(1, series.length);
  const maxAmountCents = series.reduce((max, item) => Math.max(max, item.amountCents), 0);
  const usableHeight = CHART_HEIGHT - TOP_PADDING;

  const slotWidth = chartWidth / count;
  const barWidth = Math.max(18, Math.min(34, Math.round(slotWidth * 0.56)));
  const cornerRadius = Math.min(10, Math.round(barWidth / 2.6));

  const selectedPoint = selectedKey ? series.find((point) => point.key === selectedKey) : null;

  return (
    <View style={styles.container} onLayout={handleLayout} testID="reports-bar-chart">
      {selectedPoint ? (
        <View
          style={[
            styles.tooltipPill,
            {
              backgroundColor: tokens.colors.lavenderSoft,
              borderColor: tokens.colors.lavenderBorder,
              borderRadius: tokens.radius.radiusFull,
            },
          ]}
          testID="reports-bar-tooltip"
        >
          <Text
            style={[
              styles.tooltipText,
              tokens.typography.tabularNums,
              {
                fontFamily: tokens.typography.families.semiBold,
                color: tokens.colors.primary,
              },
            ]}
          >
            {`${selectedPoint.label}: ${formatCurrencyFromCents(selectedPoint.amountCents)} MXN (${selectedPoint.count})`}
          </Text>
        </View>
      ) : null}

      <View style={styles.chartStage}>
        <Svg
          width={chartWidth}
          height={CHART_HEIGHT}
          accessibilityElementsHidden
          importantForAccessibility="no"
        >
          <Defs>
            <SvgLinearGradient id="reportBarGradient" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor="#B975FF" stopOpacity="1" />
              <Stop offset="55%" stopColor="#8B2CFF" stopOpacity="1" />
              <Stop offset="100%" stopColor="#7200D9" stopOpacity="1" />
            </SvgLinearGradient>
            <SvgLinearGradient id="reportBarSelectedGradient" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor="#941EFF" stopOpacity="1" />
              <Stop offset="100%" stopColor="#5600A8" stopOpacity="1" />
            </SvgLinearGradient>
          </Defs>

          {series.map((point, index) => {
            const x = index * slotWidth + (slotWidth - barWidth) / 2;
            const isEmpty = maxAmountCents === 0 || point.amountCents <= 0;
            const barHeight = isEmpty
              ? EMPTY_BASELINE_HEIGHT
              : Math.max(
                  MIN_ACTIVE_BAR_HEIGHT,
                  Math.round((point.amountCents / maxAmountCents) * usableHeight)
                );
            const y = CHART_HEIGHT - barHeight;
            const isSelected = selectedKey === point.key;

            return (
              <Rect
                key={point.key}
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                rx={cornerRadius}
                ry={cornerRadius}
                fill={
                  isEmpty
                    ? '#EDE2FF'
                    : isSelected
                      ? 'url(#reportBarSelectedGradient)'
                      : 'url(#reportBarGradient)'
                }
                opacity={selectedKey && !isSelected && !isEmpty ? 0.55 : 1}
              />
            );
          })}
        </Svg>

        <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
          <View style={styles.hitOverlayRow}>
            {series.map((point) => (
              <Pressable
                key={point.key}
                accessibilityRole="button"
                accessibilityLabel={`${point.label}: ${formatCurrencyFromCents(point.amountCents)} MXN`}
                onPress={() => setSelectedKey((prev) => (prev === point.key ? null : point.key))}
                testID={`reports-bar-${point.key}`}
                style={styles.hitColumn}
              />
            ))}
          </View>
        </View>
      </View>

      <View style={styles.labelsRow}>
        {series.map((point) => {
          const isSelected = selectedKey === point.key;
          return (
            <Pressable
              key={point.key}
              onPress={() => setSelectedKey((prev) => (prev === point.key ? null : point.key))}
              style={styles.labelCell}
            >
              <Text
                numberOfLines={1}
                testID={`reports-bar-label-${point.key}`}
                style={[
                  styles.labelText,
                  {
                    fontFamily: isSelected
                      ? tokens.typography.families.bold
                      : tokens.typography.families.medium,
                    color: isSelected ? tokens.colors.primary : tokens.colors.textSecondary,
                  },
                ]}
              >
                {point.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    gap: 10,
  },
  tooltipPill: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  tooltipText: {
    fontSize: 12,
    lineHeight: 16,
  },
  chartStage: {
    height: CHART_HEIGHT,
    position: 'relative',
  },
  hitOverlayRow: {
    flex: 1,
    flexDirection: 'row',
  },
  hitColumn: {
    flex: 1,
    height: '100%',
  },
  labelsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  labelCell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelText: {
    fontSize: 12,
    lineHeight: 16,
  },
});
