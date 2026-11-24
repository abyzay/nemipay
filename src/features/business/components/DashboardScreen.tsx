import React, { useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { ScreenContainer } from '@/components/layout';
import { AppButton, AppIcon, SurfaceCard } from '@/components/ui';
import { RecentMovementsSection } from '@/features/movements/components';
import { getRecentMockMovements } from '@/features/movements/services';
import { QuickReceiveActions, ReceivePaymentHeroCard } from '@/features/payments/components';
import { useAppTheme } from '@/hooks';
import { useUiStore } from '@/stores';
import { getMockDashboardData } from '../services';
import { BalanceSummaryCard } from './BalanceSummaryCard';
import { DashboardHeader } from './DashboardHeader';
import { MerchantGreeting } from './MerchantGreeting';

export interface DashboardScreenProps {
  onReceiveQrPress: () => void;
  onQuickChargePress: () => void;
  onBusinessQrPress: () => void;
  onSeeAllMovementsPress: () => void;
}

export function DashboardScreen({
  onReceiveQrPress,
  onQuickChargePress,
  onBusinessQrPress,
  onSeeAllMovementsPress,
}: DashboardScreenProps) {
  const { tokens } = useAppTheme();
  const authenticatedUser = useUiStore((state) => state.authenticatedUser);
  const [notificationsVisible, setNotificationsVisible] = useState(false);

  const dashboardData = useMemo(() => getMockDashboardData(), []);
  const recentMovements = useMemo(() => getRecentMockMovements(3), []);

  const ownerName = authenticatedUser?.displayName ?? dashboardData.merchant.ownerName;

  return (
    <ScreenContainer edges={['top']}>
      <View
        style={[
          styles.content,
          {
            gap: tokens.spacing.xs + 2,
            paddingBottom: tokens.spacing.xs,
          },
        ]}
      >
        <DashboardHeader
          unreadCount={dashboardData.summary.unreadNotifications}
          onNotificationsPress={() => setNotificationsVisible(true)}
        />

        <MerchantGreeting
          ownerName={ownerName}
          subtitle={dashboardData.merchant.greetingSubtitle}
          businessName={dashboardData.merchant.businessName}
          initials={dashboardData.merchant.avatarInitials}
        />

        <ReceivePaymentHeroCard onPress={onReceiveQrPress} testID="dashboard-receive-qr-hero" />

        <QuickReceiveActions
          onQuickChargePress={onQuickChargePress}
          onBusinessQrPress={onBusinessQrPress}
        />

        <BalanceSummaryCard
          todayReceivedCents={dashboardData.summary.todayReceivedCents}
          todayCount={dashboardData.summary.todayCount}
          currency={dashboardData.summary.currency}
        />

        <RecentMovementsSection
          movements={recentMovements}
          onSeeAllPress={onSeeAllMovementsPress}
        />
      </View>

      <Modal
        visible={notificationsVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setNotificationsVisible(false)}
      >
        <View
          style={[
            styles.modalBackdrop,
            {
              backgroundColor: tokens.colors.primaryDark,
            },
          ]}
        >
          <Pressable
            accessibilityLabel="Cerrar notificaciones"
            style={StyleSheet.absoluteFill}
            onPress={() => setNotificationsVisible(false)}
          />
          <SurfaceCard style={styles.modalCard} testID="dashboard-notifications-modal">
            <View style={styles.modalHeader}>
              <Text
                style={[
                  styles.modalTitle,
                  {
                    fontFamily: tokens.typography.families.bold,
                    color: tokens.colors.textPrimary,
                  },
                ]}
              >
                Avisos de cobro
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Cerrar"
                onPress={() => setNotificationsVisible(false)}
                hitSlop={8}
              >
                <AppIcon name="close" size={22} color={tokens.colors.textSecondary} />
              </Pressable>
            </View>

            <View style={{ gap: tokens.spacing.xs, marginVertical: tokens.spacing.sm }}>
              {dashboardData.notifications.map((notification) => (
                <View
                  key={notification.id}
                  style={[
                    styles.notificationItem,
                    {
                      backgroundColor: tokens.colors.background,
                      borderColor: tokens.colors.border,
                      borderRadius: tokens.radii.md,
                      padding: tokens.spacing.sm,
                    },
                  ]}
                >
                  <View style={styles.notificationHeader}>
                    <Text
                      style={[
                        styles.notificationTitle,
                        {
                          fontFamily: tokens.typography.families.semiBold,
                          color: tokens.colors.textPrimary,
                        },
                      ]}
                    >
                      {notification.title}
                    </Text>
                    <Text
                      style={[
                        styles.notificationTime,
                        {
                          fontFamily: tokens.typography.families.regular,
                          color: tokens.colors.textSecondary,
                        },
                      ]}
                    >
                      {notification.timeLabel}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.notificationBody,
                      {
                        fontFamily: tokens.typography.families.regular,
                        color: tokens.colors.textSecondary,
                      },
                    ]}
                  >
                    {notification.body}
                  </Text>
                </View>
              ))}
            </View>

            <AppButton
              variant="primary"
              label="Entendido"
              onPress={() => setNotificationsVisible(false)}
              testID="dashboard-notifications-close-button"
            />
          </SurfaceCard>
        </View>
      </Modal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    justifyContent: 'space-between',
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    opacity: 0.98,
  },
  modalCard: {
    width: '100%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalTitle: {
    fontSize: 18,
    lineHeight: 24,
  },
  notificationItem: {
    borderWidth: 1,
    gap: 4,
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  notificationTitle: {
    fontSize: 14,
    lineHeight: 19,
  },
  notificationTime: {
    fontSize: 12,
    lineHeight: 16,
  },
  notificationBody: {
    fontSize: 13,
    lineHeight: 18,
  },
});
