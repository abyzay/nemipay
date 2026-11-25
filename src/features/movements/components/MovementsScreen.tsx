import React from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AmountDisplay } from '@/components/financial';
import { ScreenContainer } from '@/components/layout';
import { AppButton, AppCard, AppEmptyState } from '@/components/ui';
import { paymentKeys } from '@/features/payments/queries/keys';
import { fetchDailySummary } from '@/features/payments/services/chargesService';
import { useAppTheme } from '@/hooks';
import { useUiStore } from '@/stores';
import { fetchChargesToday } from '../services';
import { MovementRow } from './MovementRow';

export function MovementsScreen() {
  const { tokens } = useAppTheme();
  const queryClient = useQueryClient();
  const authenticatedUser = useUiStore((state) => state.authenticatedUser);
  const enabled = Boolean(authenticatedUser?.id);

  const summaryQuery = useQuery({
    queryKey: paymentKeys.dailySummary(),
    queryFn: fetchDailySummary,
    enabled,
  });

  const movementsQuery = useQuery({
    queryKey: paymentKeys.chargesToday(),
    queryFn: fetchChargesToday,
    enabled,
  });

  const handleRefresh = () => {
    void queryClient.invalidateQueries({ queryKey: paymentKeys.dailySummary() });
    void queryClient.invalidateQueries({ queryKey: paymentKeys.chargesToday() });
  };

  const totalCents = summaryQuery.data?.totalConfirmedCents ?? 0;
  const countConfirmed = summaryQuery.data?.countConfirmed ?? 0;
  const countLabel =
    countConfirmed === 1 ? '1 cobro confirmado' : `${countConfirmed} cobros confirmados`;
  const isRefreshing = summaryQuery.isFetching || movementsQuery.isFetching;

  return (
    <ScreenContainer edges={['top']}>
      <View style={[styles.headerRow, { paddingTop: tokens.spacing.space3 }]}>
        <View style={styles.headerText}>
          <Text
            style={[
              styles.title,
              {
                fontFamily: tokens.typography.families.bold,
                color: tokens.colors.textPrimary,
              },
            ]}
          >
            Hoy
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
            Corte del día y cobros CoDi
          </Text>
        </View>

        <AppButton
          variant="outlined"
          size="md"
          fullWidth={false}
          leftIcon="refresh-cw"
          label="Actualizar"
          onPress={handleRefresh}
          disabled={isRefreshing}
          testID="hoy-refresh-button"
        />
      </View>

      <AppCard
        variant="standard"
        padding="md"
        testID="hoy-daily-summary-card"
        style={{
          marginTop: tokens.spacing.space3,
          marginBottom: tokens.spacing.space3,
          backgroundColor: tokens.colors.lavenderSoft,
          borderColor: tokens.colors.lavenderBorder,
          gap: tokens.spacing.space1,
        }}
      >
        <Text
          style={[
            styles.summaryLabel,
            {
              fontFamily: tokens.typography.families.medium,
              color: tokens.colors.primary,
            },
          ]}
        >
          Corte del día
        </Text>
        <AmountDisplay
          amountCents={totalCents}
          size="lg"
          tone="primary"
          testID="hoy-total-confirmed"
        />
        <Text
          testID="hoy-count-confirmed"
          style={[
            styles.summaryCount,
            {
              fontFamily: tokens.typography.families.medium,
              color: tokens.colors.textSecondary,
            },
          ]}
        >
          {countLabel}
        </Text>
      </AppCard>

      {movementsQuery.isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={tokens.colors.primary} />
        </View>
      ) : (
        <FlatList
          data={movementsQuery.data ?? []}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={tokens.colors.primary}
            />
          }
          contentContainerStyle={{ paddingBottom: tokens.spacing.space6 }}
          renderItem={({ item, index }) => (
            <MovementRow
              movement={item}
              showDivider={index < (movementsQuery.data?.length ?? 0) - 1}
              testID={`movement-row-${item.id}`}
            />
          )}
          ListEmptyComponent={
            <AppEmptyState
              icon="receipt"
              title="Aún no hay cobros hoy"
              description="Tus cobros CoDi de hoy aparecerán aquí al instante."
            />
          }
        />
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  headerText: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 24,
    lineHeight: 32,
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  summaryLabel: {
    fontSize: 13,
    lineHeight: 18,
  },
  summaryCount: {
    fontSize: 13,
    lineHeight: 18,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
