import React from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { ScreenContainer } from '@/components/layout';
import {
  AppBadge,
  AppButton,
  AppEmptyState,
  AppIcon,
  AppSkeleton,
  SectionHeader,
  type AppIconName,
} from '@/components/ui';
import { fetchMerchantProfile } from '@/features/authentication/services';
import { MovementRow } from '@/features/movements/components';
import { fetchMovementsPage } from '@/features/movements/services';
import type { TodayMovement } from '@/features/movements/types';
import { paymentKeys } from '@/features/payments/queries/keys';
import { fetchDailySummary } from '@/features/payments/services/chargesService';
import { useAppTheme } from '@/hooks';
import { useUiStore } from '@/stores';
import { formatCurrencyFromCents } from '@/utils/currency';

interface QuickActionItem {
  id: string;
  label: string;
  icon: AppIconName;
  onPress: () => void;
  testID: string;
}

function getGreetingName(merchantName?: string | null, displayName?: string | null): string {
  const candidate = merchantName?.trim() || displayName?.trim() || '';
  if (!candidate || candidate.includes('@')) {
    return 'NemiPay';
  }
  return candidate;
}

export function DashboardScreen() {
  const { tokens } = useAppTheme();
  const queryClient = useQueryClient();
  const authenticatedUser = useUiStore((state) => state.authenticatedUser);
  const shiftActive = useUiStore((state) => state.shiftActive);
  const setLastChargeMode = useUiStore((state) => state.setLastChargeMode);

  const userId = authenticatedUser?.id ?? '';
  const enabled = Boolean(userId);

  const merchantQuery = useQuery({
    queryKey: paymentKeys.merchant(userId),
    queryFn: () => fetchMerchantProfile(userId),
    enabled,
  });

  const summaryQuery = useQuery({
    queryKey: paymentKeys.dailySummary(),
    queryFn: fetchDailySummary,
    enabled,
  });

  const recentMovementsQuery = useQuery({
    queryKey: paymentKeys.recentMovements(),
    queryFn: () =>
      fetchMovementsPage({
        page: 0,
        pageSize: 5,
        filter: 'all',
        search: '',
      }),
    enabled,
  });

  const greetingName = getGreetingName(merchantQuery.data?.name, authenticatedUser?.displayName);
  const totalConfirmedCents = summaryQuery.data?.totalConfirmedCents ?? 0;
  const countConfirmed = summaryQuery.data?.countConfirmed ?? 0;
  const recentMovements = (recentMovementsQuery.data?.items ?? []).slice(0, 3);

  const isRefreshing =
    (summaryQuery.isRefetching && !summaryQuery.isLoading) ||
    (recentMovementsQuery.isRefetching && !recentMovementsQuery.isLoading);

  const handleRefresh = () => {
    void Promise.all([
      queryClient.invalidateQueries({ queryKey: paymentKeys.dailySummary() }),
      queryClient.invalidateQueries({ queryKey: paymentKeys.recentMovements() }),
      userId
        ? queryClient.invalidateQueries({ queryKey: paymentKeys.merchant(userId) })
        : Promise.resolve(),
    ]);
  };

  const handleOpenCobrarQr = () => {
    setLastChargeMode('free_amount');
    router.push('/cobrar');
  };

  const handleOpenActivity = () => {
    router.push('/activity');
  };

  const handleOpenProfile = () => {
    router.push('/profile');
  };

  const handleOpenMovement = (movement: TodayMovement) => {
    router.push({ pathname: '/collect', params: { chargeId: movement.id } });
  };

  const quickActions: QuickActionItem[] = [
    {
      id: 'qr',
      label: 'Cobrar\ncon QR',
      icon: 'qr-code',
      onPress: handleOpenCobrarQr,
      testID: 'dashboard-action-qr',
    },
    {
      id: 'pos',
      label: 'POS',
      icon: 'store',
      onPress: () => {
        // POS queda reservado sin acción por ahora
      },
      testID: 'dashboard-action-pos',
    },
    {
      id: 'movements',
      label: 'Movimientos',
      icon: 'sliders-horizontal',
      onPress: handleOpenActivity,
      testID: 'dashboard-action-movements',
    },
    {
      id: 'profile',
      label: 'Perfil',
      icon: 'user-round',
      onPress: handleOpenProfile,
      testID: 'dashboard-action-profile',
    },
  ];

  const todayCountLabel =
    countConfirmed === 0
      ? 'Sin cobros confirmados aún'
      : countConfirmed === 1
        ? '1 cobro confirmado'
        : `${countConfirmed} cobros confirmados`;

  return (
    <ScreenContainer edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={tokens.colors.primary}
          />
        }
        contentContainerStyle={{ paddingBottom: tokens.spacing.space6 }}
      >
        <View style={[styles.topBar, { paddingTop: tokens.spacing.space2 }]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Menú"
            hitSlop={8}
            testID="dashboard-menu-button"
            style={({ pressed }) => [
              styles.iconButton,
              {
                borderRadius: tokens.radius.radiusFull,
                backgroundColor: pressed ? tokens.colors.lavenderSoft : 'transparent',
              },
            ]}
          >
            <AppIcon name="menu" size={24} color={tokens.colors.textPrimary} />
          </Pressable>

          <View style={styles.topBarRight}>
            {shiftActive ? (
              <AppBadge
                label="Turno activo"
                variant="success"
                icon="volume-2"
                testID="dashboard-shift-active-badge"
              />
            ) : null}

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Notificaciones"
              hitSlop={8}
              testID="dashboard-notifications-button"
              style={({ pressed }) => [
                styles.iconButton,
                {
                  borderRadius: tokens.radius.radiusFull,
                  backgroundColor: pressed ? tokens.colors.lavenderSoft : 'transparent',
                },
              ]}
            >
              <AppIcon name="bell" size={22} color={tokens.colors.primary} />
            </Pressable>
          </View>
        </View>

        <View style={{ marginTop: tokens.spacing.space3, gap: tokens.spacing.space1 }}>
          <Text
            numberOfLines={1}
            adjustsFontSizeToFit
            testID="dashboard-greeting"
            style={[
              styles.greetingTitle,
              {
                fontFamily: tokens.typography.families.bold,
                color: tokens.colors.textPrimary,
              },
            ]}
          >
            {`¡Hola, ${greetingName}!`}
          </Text>
          <Text
            style={[
              styles.greetingSubtitle,
              {
                fontFamily: tokens.typography.families.regular,
                color: tokens.colors.textSecondary,
              },
            ]}
          >
            Tu negocio en buenas manos
          </Text>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Pagos recibidos hoy, ver movimientos"
          onPress={handleOpenActivity}
          testID="dashboard-today-card"
          style={({ pressed }) => [
            {
              marginTop: tokens.spacing.space5,
              opacity: pressed ? 0.94 : 1,
            },
          ]}
        >
          <LinearGradient
            colors={['#5B00C4', '#740BE2', '#9F3EFF']}
            locations={[0, 0.45, 1]}
            start={{ x: 0, y: 0.75 }}
            end={{ x: 1, y: 0.15 }}
            style={[
              styles.balanceCard,
              tokens.shadows.floating,
              {
                borderRadius: tokens.radius.radiusBalanceCard,
                paddingHorizontal: tokens.spacing.space5 + 2,
                paddingVertical: tokens.spacing.space5,
              },
            ]}
          >
            <View pointerEvents="none" style={styles.cardGlowOrb} />

            <View style={styles.balanceContent}>
              <Text
                style={[
                  styles.balanceLabel,
                  {
                    fontFamily: tokens.typography.families.medium,
                    color: 'rgba(255, 255, 255, 0.92)',
                  },
                ]}
              >
                Pagos recibidos hoy
              </Text>

              {summaryQuery.isLoading ? (
                <View style={styles.amountSkeleton} testID="dashboard-today-skeleton" />
              ) : (
                <View style={styles.amountRow}>
                  <Text
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    testID="dashboard-today-amount"
                    style={[
                      styles.balanceAmount,
                      tokens.typography.tabularNums,
                      {
                        fontFamily: tokens.typography.families.bold,
                        color: tokens.colors.textOnPrimary,
                      },
                    ]}
                  >
                    {formatCurrencyFromCents(totalConfirmedCents)}
                  </Text>
                  <Text
                    style={[
                      styles.balanceCurrency,
                      {
                        fontFamily: tokens.typography.families.semiBold,
                        color: 'rgba(255, 255, 255, 0.92)',
                      },
                    ]}
                  >
                    MXN
                  </Text>
                </View>
              )}

              <Text
                testID="dashboard-today-count"
                style={[
                  styles.balanceCount,
                  {
                    fontFamily: tokens.typography.families.medium,
                    color: 'rgba(255, 255, 255, 0.8)',
                  },
                ]}
              >
                {todayCountLabel}
              </Text>
            </View>

            <AppIcon name="chevron-right" size={22} color={tokens.colors.textOnPrimary} />
          </LinearGradient>
        </Pressable>

        <View
          style={[
            styles.quickActionsRow,
            {
              marginTop: tokens.spacing.space5,
              gap: tokens.spacing.space2 + 2,
            },
          ]}
        >
          {quickActions.map((action) => (
            <Pressable
              key={action.id}
              accessibilityRole="button"
              accessibilityLabel={action.label.replace('\n', ' ')}
              onPress={action.onPress}
              testID={action.testID}
              style={({ pressed }) => [
                styles.quickActionCard,
                {
                  backgroundColor: pressed ? tokens.colors.lavender : '#F6F0FF',
                  borderColor: 'rgba(114, 0, 217, 0.06)',
                  borderRadius: tokens.radius.radiusButton,
                  paddingVertical: tokens.spacing.space3 + 2,
                  paddingHorizontal: tokens.spacing.space1,
                },
              ]}
            >
              <AppIcon
                name={action.icon}
                size={24}
                strokeWidth={1.9}
                color={tokens.colors.primary}
              />
              <Text
                numberOfLines={2}
                style={[
                  styles.quickActionLabel,
                  {
                    fontFamily: tokens.typography.families.semiBold,
                    color: tokens.colors.textPrimary,
                  },
                ]}
              >
                {action.label}
              </Text>
            </Pressable>
          ))}
        </View>

        <View style={{ marginTop: tokens.spacing.space6, gap: tokens.spacing.space3 }}>
          <SectionHeader
            title="Actividad reciente"
            actionLabel="Ver más"
            onActionPress={handleOpenActivity}
            actionTestID="dashboard-see-more-activity"
          />

          {recentMovementsQuery.isLoading ? (
            <View style={{ gap: tokens.spacing.space3 }} testID="dashboard-recent-loading">
              {[0, 1, 2].map((index) => (
                <View key={index} style={styles.skeletonRow}>
                  <AppSkeleton width={44} height={44} borderRadius={22} />
                  <View style={styles.skeletonTextGroup}>
                    <AppSkeleton width="58%" height={15} />
                    <AppSkeleton width="38%" height={12} />
                  </View>
                  <View style={styles.skeletonAmountGroup}>
                    <AppSkeleton width={70} height={15} />
                    <AppSkeleton width={48} height={11} />
                  </View>
                </View>
              ))}
            </View>
          ) : recentMovementsQuery.isError ? (
            <AppEmptyState
              icon="circle-alert"
              title="No pudimos cargar tu actividad"
              description={
                recentMovementsQuery.error?.message ?? 'Intenta actualizar en unos segundos.'
              }
              actions={
                <AppButton
                  variant="outlined"
                  size="md"
                  fullWidth={false}
                  label="Reintentar"
                  onPress={handleRefresh}
                />
              }
            />
          ) : recentMovements.length === 0 ? (
            <AppEmptyState
              icon="receipt"
              title="Aún no hay movimientos"
              description="Tus últimos cobros CoDi aparecerán aquí al instante."
              testID="dashboard-recent-empty"
            />
          ) : (
            <View style={{ gap: tokens.spacing.space1 }} testID="dashboard-recent-list">
              {recentMovements.map((movement) => (
                <MovementRow
                  key={movement.id}
                  movement={movement}
                  onPress={handleOpenMovement}
                  testID={`dashboard-movement-row-${movement.id}`}
                />
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  topBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  greetingTitle: {
    fontSize: 26,
    lineHeight: 32,
    letterSpacing: -0.5,
  },
  greetingSubtitle: {
    fontSize: 15,
    lineHeight: 20,
  },
  balanceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    overflow: 'hidden',
    position: 'relative',
  },
  cardGlowOrb: {
    position: 'absolute',
    right: -28,
    top: -42,
    width: 164,
    height: 164,
    borderRadius: 82,
    backgroundColor: 'rgba(208, 140, 255, 0.22)',
  },
  balanceContent: {
    flex: 1,
    paddingRight: 12,
    gap: 4,
  },
  balanceLabel: {
    fontSize: 14,
    lineHeight: 20,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  balanceAmount: {
    fontSize: 32,
    lineHeight: 38,
    letterSpacing: -0.6,
    flexShrink: 1,
  },
  balanceCurrency: {
    fontSize: 15,
    lineHeight: 20,
  },
  balanceCount: {
    fontSize: 12,
    lineHeight: 16,
    marginTop: 2,
  },
  amountSkeleton: {
    width: 170,
    height: 36,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    marginVertical: 2,
  },
  quickActionsRow: {
    flexDirection: 'row',
  },
  quickActionCard: {
    flex: 1,
    minHeight: 96,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  quickActionLabel: {
    fontSize: 12,
    lineHeight: 15,
    textAlign: 'center',
  },
  skeletonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  skeletonTextGroup: {
    flex: 1,
    gap: 6,
  },
  skeletonAmountGroup: {
    alignItems: 'flex-end',
    gap: 6,
  },
});
