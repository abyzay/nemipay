import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { ScreenContainer } from '@/components/layout';
import { AppHeader, AppIcon } from '@/components/ui';
import { useAppTheme } from '@/hooks';
import { useUiStore } from '@/stores';
import { formatCurrencyFromCents } from '@/utils/currency';
import { paymentKeys } from '../queries/keys';
import { fetchDailySummary } from '../services/chargesService';
import { FreeAmountKeypad } from './FreeAmountKeypad';

export interface CobrarScreenProps {
  onBackPress?: () => void;
}

export function CobrarScreen({ onBackPress }: CobrarScreenProps = {}) {
  const { tokens } = useAppTheme();
  const authenticatedUser = useUiStore((state) => state.authenticatedUser);

  const summaryQuery = useQuery({
    queryKey: paymentKeys.dailySummary(),
    queryFn: fetchDailySummary,
    enabled: Boolean(authenticatedUser?.id),
  });

  const totalCents = summaryQuery.data?.totalConfirmedCents ?? 0;
  const countConfirmed = summaryQuery.data?.countConfirmed ?? 0;
  const countLabel = countConfirmed === 1 ? '1 cobro' : `${countConfirmed} cobros`;

  return (
    <ScreenContainer edges={['top', 'bottom']}>
      <View style={[styles.container, { gap: tokens.spacing.space3 }]}>
        <AppHeader
          title="Cobrar con QR"
          onBackPress={onBackPress}
          backTestID="cobrar-back-button"
          testID="cobrar-header"
        />

        <View
          style={[
            styles.summaryPill,
            {
              backgroundColor: tokens.colors.lavenderSoft,
              borderColor: tokens.colors.lavenderBorder,
              borderRadius: tokens.radius.radiusFull,
              paddingHorizontal: tokens.spacing.space3 + 2,
              paddingVertical: tokens.spacing.space1 + 3,
              gap: tokens.spacing.space2,
            },
          ]}
        >
          <AppIcon name="wallet" size={15} color={tokens.colors.primary} />
          <Text
            testID="cobrar-today-summary"
            style={[
              styles.summaryText,
              tokens.typography.tabularNums,
              {
                fontFamily: tokens.typography.families.semiBold,
                color: tokens.colors.textPrimary,
              },
            ]}
          >
            {`Hoy: ${formatCurrencyFromCents(totalCents, { omitZeroCents: true })} · ${countLabel}`}
          </Text>
        </View>

        <View style={styles.body}>
          <FreeAmountKeypad />
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  summaryPill: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
  },
  summaryText: {
    fontSize: 13,
    lineHeight: 18,
  },
  body: {
    flex: 1,
    paddingBottom: 8,
  },
});
