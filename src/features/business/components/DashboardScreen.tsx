import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ScreenContainer } from '@/components/layout';
import { AppBottomSheet, AppButton, AppDivider, AppIcon } from '@/components/ui';
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
    <ScreenContainer edges={['top']} scrollable>
      <View
        style={[
          styles.content,
          {
            gap: tokens.spacing.space4,
            paddingBottom: tokens.spacing.space6,
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

        <BalanceSummaryCard
          todayReceivedCents={dashboardData.summary.todayReceivedCents}
          todayCount={dashboardData.summary.todayCount}
          currency={dashboardData.summary.currency}
        />

        <View style={{ gap: tokens.spacing.space3 }}>
          <ReceivePaymentHeroCard onPress={onReceiveQrPress} testID="dashboard-receive-qr-hero" />

          <QuickReceiveActions
            onQuickChargePress={onQuickChargePress}
            onBusinessQrPress={onBusinessQrPress}
          />
        </View>

        <RecentMovementsSection
          movements={recentMovements}
          onSeeAllPress={onSeeAllMovementsPress}
        />
      </View>

      <AppBottomSheet
        visible={notificationsVisible}
        onClose={() => setNotificationsVisible(false)}
        title="Avisos de cobro"
        closeAccessibilityLabel="Cerrar notificaciones"
        testID="dashboard-notifications-modal"
      >
        <View style={{ marginBottom: tokens.spacing.space5 }}>
          {dashboardData.notifications.map((notification, index) => (
            <View key={notification.id}>
              <View
                style={[
                  styles.notificationRow,
                  { paddingVertical: tokens.spacing.space3, gap: tokens.spacing.space3 },
                ]}
              >
                <View
                  style={[
                    styles.notificationIcon,
                    {
                      backgroundColor: tokens.colors.lavenderSoft,
                      borderRadius: tokens.radius.radiusFull,
                    },
                  ]}
                >
                  <AppIcon name="bell" size={18} color={tokens.colors.primary} />
                </View>

                <View style={styles.notificationContent}>
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
                          color: tokens.colors.textMuted,
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
              </View>
              {index < dashboardData.notifications.length - 1 ? <AppDivider /> : null}
            </View>
          ))}
        </View>

        <AppButton
          variant="primary"
          label="Entendido"
          onPress={() => setNotificationsVisible(false)}
          testID="dashboard-notifications-close-button"
        />
      </AppBottomSheet>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
  },
  notificationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  notificationIcon: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  notificationContent: {
    flex: 1,
    gap: 4,
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  notificationTitle: {
    fontSize: 14,
    lineHeight: 20,
    flex: 1,
  },
  notificationTime: {
    fontSize: 12,
    lineHeight: 16,
  },
  notificationBody: {
    fontSize: 13,
    lineHeight: 19,
  },
});
