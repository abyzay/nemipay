import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useAppTheme } from '@/hooks';
import { formatCurrencyFromCents } from '@/utils/currency';

export interface ReportsSummaryListProps {
  averageTicketCents: number;
  highestPaymentCents: number;
  qrSharePercent: number;
}

export function ReportsSummaryList({
  averageTicketCents,
  highestPaymentCents,
  qrSharePercent,
}: ReportsSummaryListProps) {
  const { tokens } = useAppTheme();

  const rows = [
    {
      id: 'average',
      label: 'Ventas promedio',
      value: formatCurrencyFromCents(averageTicketCents),
      testID: 'reports-summary-average',
    },
    {
      id: 'highest',
      label: 'Mayor venta',
      value: formatCurrencyFromCents(highestPaymentCents),
      testID: 'reports-summary-highest',
    },
    {
      id: 'qr-share',
      label: 'Cobros con QR CoDi',
      value: `${qrSharePercent}%`,
      testID: 'reports-summary-qr-share',
    },
  ];

  return (
    <View style={styles.container} testID="reports-summary-section">
      <Text
        style={[
          styles.heading,
          {
            fontFamily: tokens.typography.families.bold,
            color: tokens.colors.textPrimary,
            marginBottom: tokens.spacing.xs,
          },
        ]}
      >
        Resumen
      </Text>

      <View style={[styles.divider, { backgroundColor: tokens.colors.border }]} />

      {rows.map((row, index) => (
        <View key={row.id}>
          <View style={[styles.row, { paddingVertical: tokens.spacing.sm }]}>
            <Text
              style={[
                styles.rowLabel,
                {
                  fontFamily: tokens.typography.families.regular,
                  color: tokens.colors.textPrimary,
                },
              ]}
            >
              {row.label}
            </Text>
            <Text
              testID={row.testID}
              style={[
                styles.rowValue,
                {
                  fontFamily: tokens.typography.families.bold,
                  color: row.id === 'qr-share' ? tokens.colors.primary : tokens.colors.textPrimary,
                },
              ]}
            >
              {row.value}
            </Text>
          </View>
          {index < rows.length - 1 ? (
            <View style={[styles.divider, { backgroundColor: tokens.colors.border }]} />
          ) : null}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  heading: {
    fontSize: 18,
    lineHeight: 24,
  },
  divider: {
    height: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowLabel: {
    fontSize: 15,
    lineHeight: 20,
  },
  rowValue: {
    fontSize: 16,
    lineHeight: 22,
  },
});
