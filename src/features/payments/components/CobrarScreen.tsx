import React, { useEffect, useRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { ScreenContainer } from '@/components/layout';
import { AppBadge, AppButton } from '@/components/ui';
import { PosScreen } from '@/features/pos/components';
import { useProductsQuery } from '@/features/pos/hooks/useProducts';
import { useAppTheme } from '@/hooks';
import { useUiStore, type ChargeEntryMode } from '@/stores';
import { formatCurrencyFromCents } from '@/utils/currency';
import { paymentKeys } from '../queries/keys';
import { startShiftAnnouncement } from '../services/announce';
import { fetchDailySummary } from '../services/chargesService';
import { FreeAmountKeypad } from './FreeAmountKeypad';

export function CobrarScreen() {
  const { tokens } = useAppTheme();
  const authenticatedUser = useUiStore((state) => state.authenticatedUser);
  const shiftActive = useUiStore((state) => state.shiftActive);
  const setShiftActive = useUiStore((state) => state.setShiftActive);
  const lastChargeMode = useUiStore((state) => state.lastChargeMode);
  const setLastChargeMode = useUiStore((state) => state.setLastChargeMode);

  const productsQuery = useProductsQuery(Boolean(authenticatedUser?.id));
  const summaryQuery = useQuery({
    queryKey: paymentKeys.dailySummary(),
    queryFn: fetchDailySummary,
    enabled: Boolean(authenticatedUser?.id),
  });

  const userManuallySwitchedRef = useRef(false);

  useEffect(() => {
    if (
      !userManuallySwitchedRef.current &&
      productsQuery.isSuccess &&
      productsQuery.data.length === 0 &&
      lastChargeMode !== 'free_amount'
    ) {
      setLastChargeMode('free_amount');
    }
  }, [lastChargeMode, productsQuery.data, productsQuery.isSuccess, setLastChargeMode]);

  const handleSelectMode = (mode: ChargeEntryMode) => {
    userManuallySwitchedRef.current = true;
    setLastChargeMode(mode);
  };

  const handleStartShift = async () => {
    await startShiftAnnouncement();
    setShiftActive(true);
  };

  const totalCents = summaryQuery.data?.totalConfirmedCents ?? 0;
  const countConfirmed = summaryQuery.data?.countConfirmed ?? 0;
  const countLabel = countConfirmed === 1 ? '1 cobro' : `${countConfirmed} cobros`;

  return (
    <ScreenContainer edges={['top']}>
      <View
        style={[
          styles.container,
          { gap: tokens.spacing.space3, paddingTop: tokens.spacing.space2 },
        ]}
      >
        <View style={styles.topHeader}>
          <View style={styles.summaryPill}>
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

          {shiftActive ? (
            <AppBadge
              label="Turno activo"
              variant="success"
              icon="volume-2"
              testID="shift-active-badge"
            />
          ) : (
            <AppButton
              variant="outlined"
              size="md"
              fullWidth={false}
              leftIcon="volume-2"
              label="Iniciar turno"
              onPress={() => void handleStartShift()}
              testID="start-shift-button"
            />
          )}
        </View>

        <View
          style={[
            styles.modeSwitch,
            {
              backgroundColor: tokens.colors.surfaceSecondary,
              borderRadius: tokens.radius.radiusFull,
              padding: tokens.spacing.space1,
            },
          ]}
        >
          {(
            [
              { id: 'products', label: 'Productos' },
              { id: 'free_amount', label: 'Monto libre' },
            ] as const
          ).map((option) => {
            const selected = lastChargeMode === option.id;
            return (
              <Pressable
                key={option.id}
                accessibilityRole="button"
                onPress={() => handleSelectMode(option.id)}
                testID={`cobrar-mode-${option.id}`}
                style={[
                  styles.modeTab,
                  selected ? tokens.shadows.card : undefined,
                  {
                    borderRadius: tokens.radius.radiusFull,
                    backgroundColor: selected ? tokens.colors.primary : 'transparent',
                    paddingVertical: tokens.spacing.space2 + 2,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.modeTabText,
                    {
                      fontFamily: tokens.typography.families.semiBold,
                      color: selected ? tokens.colors.textOnPrimary : tokens.colors.textSecondary,
                    },
                  ]}
                >
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.body}>
          {lastChargeMode === 'products' ? <PosScreen /> : <FreeAmountKeypad />}
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  summaryPill: {
    flex: 1,
  },
  summaryText: {
    fontSize: 15,
    lineHeight: 20,
  },
  modeSwitch: {
    flexDirection: 'row',
  },
  modeTab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeTabText: {
    fontSize: 14,
    lineHeight: 20,
  },
  body: {
    flex: 1,
    paddingBottom: 8,
  },
});
