import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';
import { useAppTheme } from '@/hooks';
import { formatCurrencyFromCents } from '@/utils/currency';
import type { PaymentMethodBreakdownItem } from '../types';

export interface PaymentMethodsCardProps {
  items: PaymentMethodBreakdownItem[];
}

const DONUT_SIZE = 136;
const STROKE_WIDTH = 26;
const RADIUS = 48;
const CENTER = DONUT_SIZE / 2;

export function PaymentMethodsCard({ items }: PaymentMethodsCardProps) {
  const { tokens } = useAppTheme();
  const codiItem = items.find((item) => item.id === 'codi') ?? items[0];
  const hasSales = (codiItem?.percentage ?? 0) > 0;

  return (
    <View style={styles.section} testID="reports-payment-methods">
      <Text
        style={[
          styles.heading,
          {
            fontFamily: tokens.typography.families.bold,
            color: tokens.colors.textPrimary,
          },
        ]}
      >
        Métodos de pago
      </Text>

      <View
        style={[
          styles.contentRow,
          {
            marginTop: tokens.spacing.space4,
            gap: tokens.spacing.space5,
          },
        ]}
      >
        <View style={styles.donutContainer} testID="reports-donut-chart">
          <Svg
            width={DONUT_SIZE}
            height={DONUT_SIZE}
            viewBox={`0 0 ${DONUT_SIZE} ${DONUT_SIZE}`}
            accessibilityRole="image"
            accessibilityLabel={
              hasSales
                ? `Gráfica de métodos de pago: CoDi ${codiItem?.percentage ?? 100}%`
                : 'Gráfica de métodos de pago sin ventas registradas'
            }
          >
            <Defs>
              <SvgLinearGradient id="codiDonutGradient" x1="0" y1="0" x2="1" y2="1">
                <Stop offset="0%" stopColor="#6200D8" stopOpacity="1" />
                <Stop offset="55%" stopColor="#7200D9" stopOpacity="1" />
                <Stop offset="100%" stopColor="#941EFF" stopOpacity="1" />
              </SvgLinearGradient>
            </Defs>

            <Circle
              cx={CENTER}
              cy={CENTER}
              r={RADIUS}
              fill="none"
              stroke={hasSales ? 'url(#codiDonutGradient)' : '#EDE2FF'}
              strokeWidth={STROKE_WIDTH}
            />
          </Svg>
        </View>

        <View style={styles.legendList}>
          {items.map((item) => {
            const swatchColor = item.percentage > 0 ? item.color : '#D9C2FA';
            const caption =
              item.count === 0
                ? 'Sin cobros en este periodo'
                : `${item.count} ${item.count === 1 ? 'cobro confirmado' : 'cobros confirmados'} · ${formatCurrencyFromCents(item.amountCents)}`;

            return (
              <View key={item.id} style={styles.legendBlock} testID={`reports-method-${item.id}`}>
                <View style={styles.legendRow}>
                  <View style={styles.legendLabelGroup}>
                    <View style={[styles.swatch, { backgroundColor: swatchColor }]} />
                    <Text
                      style={[
                        styles.methodName,
                        {
                          fontFamily: tokens.typography.families.medium,
                          color: tokens.colors.textPrimary,
                        },
                      ]}
                    >
                      {item.label}
                    </Text>
                  </View>

                  <Text
                    testID={`reports-method-${item.id}-pct`}
                    style={[
                      styles.methodPct,
                      tokens.typography.tabularNums,
                      {
                        fontFamily: tokens.typography.families.bold,
                        color: tokens.colors.textPrimary,
                      },
                    ]}
                  >
                    {`${item.percentage}%`}
                  </Text>
                </View>

                <Text
                  numberOfLines={2}
                  style={[
                    styles.methodCaption,
                    {
                      fontFamily: tokens.typography.families.regular,
                      color: tokens.colors.textSecondary,
                    },
                  ]}
                >
                  {caption}
                </Text>
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    width: '100%',
  },
  heading: {
    fontSize: 18,
    lineHeight: 24,
    letterSpacing: -0.2,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  donutContainer: {
    width: DONUT_SIZE,
    height: DONUT_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  legendList: {
    flex: 1,
    gap: 12,
  },
  legendBlock: {
    gap: 4,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  legendLabelGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  swatch: {
    width: 12,
    height: 12,
    borderRadius: 4,
  },
  methodName: {
    fontSize: 15,
    lineHeight: 20,
  },
  methodPct: {
    fontSize: 15,
    lineHeight: 20,
  },
  methodCaption: {
    fontSize: 12,
    lineHeight: 16,
    paddingLeft: 22,
  },
});
