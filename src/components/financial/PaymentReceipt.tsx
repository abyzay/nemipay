import React from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { AppCard, AppDivider } from '@/components/ui';
import { useAppTheme } from '@/hooks';
import type { CurrencyCode } from '@/types/common';
import { AmountDisplay } from './AmountDisplay';
import { PaymentStatus, type PaymentStatusKind } from './PaymentStatus';

export interface PaymentReceiptDetail {
  label: string;
  value: string;
}

export interface PaymentReceiptProps {
  title: string;
  amountCents: number;
  currency?: CurrencyCode;
  status?: PaymentStatusKind;
  statusLabel?: string;
  details: PaymentReceiptDetail[];
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export function PaymentReceipt({
  title,
  amountCents,
  currency = 'MXN',
  status = 'confirmed',
  statusLabel,
  details,
  style,
  testID,
}: PaymentReceiptProps) {
  const { tokens } = useAppTheme();

  return (
    <AppCard variant="standard" padding="lg" style={style} testID={testID}>
      <View style={[styles.header, { gap: tokens.spacing.space2 }]}>
        <PaymentStatus status={status} label={statusLabel} />
        <Text
          style={[
            styles.title,
            {
              fontFamily: tokens.typography.families.medium,
              color: tokens.colors.textSecondary,
            },
          ]}
        >
          {title}
        </Text>
        <AmountDisplay
          amountCents={amountCents}
          currency={currency}
          size="lg"
          tone={status === 'confirmed' ? 'received' : 'default'}
          showPlusSign={status === 'confirmed'}
        />
      </View>

      <AppDivider verticalMargin={tokens.spacing.space4} />

      <View style={{ gap: tokens.spacing.space3 }}>
        {details.map((item) => (
          <View key={item.label} style={styles.detailRow}>
            <Text
              style={[
                styles.detailLabel,
                {
                  fontFamily: tokens.typography.families.regular,
                  color: tokens.colors.textSecondary,
                },
              ]}
            >
              {item.label}
            </Text>
            <Text
              style={[
                styles.detailValue,
                {
                  fontFamily: tokens.typography.families.semiBold,
                  color: tokens.colors.textPrimary,
                },
              ]}
            >
              {item.value}
            </Text>
          </View>
        ))}
      </View>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
  },
  title: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  detailLabel: {
    fontSize: 14,
    lineHeight: 20,
  },
  detailValue: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'right',
    flexShrink: 1,
  },
});
