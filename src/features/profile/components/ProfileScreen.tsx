import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ScreenContainer } from '@/components/layout';
import { AppAvatar, AppBadge, AppButton, AppCard, AppDivider, AppIcon } from '@/components/ui';
import { getMockDashboardData } from '@/features/business/services';
import { useAppTheme } from '@/hooks';
import { useUiStore } from '@/stores';

export interface ProfileScreenProps {
  onLogoutPress: () => void;
}

export function ProfileScreen({ onLogoutPress }: ProfileScreenProps) {
  const { tokens } = useAppTheme();
  const authenticatedUser = useUiStore((state) => state.authenticatedUser);
  const dashboardData = useMemo(() => getMockDashboardData(), []);

  const displayName = authenticatedUser?.displayName ?? dashboardData.merchant.ownerName;
  const username = authenticatedUser?.username ?? 'abyzay';

  return (
    <ScreenContainer edges={['top']} scrollable>
      <View style={[styles.header, { paddingTop: tokens.spacing.space3 }]}>
        <Text
          style={[
            styles.title,
            {
              fontFamily: tokens.typography.families.bold,
              color: tokens.colors.textPrimary,
            },
          ]}
        >
          Perfil del comercio
        </Text>
      </View>

      <AppCard
        variant="standard"
        padding="lg"
        style={[
          styles.profileCard,
          { marginTop: tokens.spacing.space4, gap: tokens.spacing.space2 },
        ]}
      >
        <AppAvatar initials={dashboardData.merchant.avatarInitials} size={64} />
        <Text
          style={[
            styles.ownerName,
            {
              fontFamily: tokens.typography.families.bold,
              color: tokens.colors.textPrimary,
              marginTop: tokens.spacing.space1,
            },
          ]}
        >
          {displayName}
        </Text>
        <Text
          style={[
            styles.businessName,
            {
              fontFamily: tokens.typography.families.regular,
              color: tokens.colors.textSecondary,
            },
          ]}
        >
          {`${dashboardData.merchant.businessName} · @${username}`}
        </Text>
        <View style={{ marginTop: tokens.spacing.space1 }}>
          <AppBadge label="Comercio verificado CoDi" variant="lavender" icon="shield-check" />
        </View>
      </AppCard>

      <AppCard
        variant="standard"
        padding="md"
        style={{ marginTop: tokens.spacing.space4, gap: tokens.spacing.space3 }}
      >
        <View style={[styles.infoRow, { gap: tokens.spacing.space3 }]}>
          <View
            style={[
              styles.iconContainer,
              {
                backgroundColor: tokens.colors.lavenderSoft,
                borderRadius: tokens.radius.radiusMD,
              },
            ]}
          >
            <AppIcon name="qr-code" size={20} color={tokens.colors.primary} />
          </View>
          <View style={styles.infoText}>
            <Text
              style={[
                styles.infoLabel,
                {
                  fontFamily: tokens.typography.families.medium,
                  color: tokens.colors.textSecondary,
                },
              ]}
            >
              Alias CoDi
            </Text>
            <Text
              style={[
                styles.infoValue,
                {
                  fontFamily: tokens.typography.families.semiBold,
                  color: tokens.colors.textPrimary,
                },
              ]}
            >
              {dashboardData.merchant.codiAlias}
            </Text>
          </View>
        </View>

        <AppDivider />

        <View style={[styles.infoRow, { gap: tokens.spacing.space3 }]}>
          <View
            style={[
              styles.iconContainer,
              {
                backgroundColor: tokens.colors.lavenderSoft,
                borderRadius: tokens.radius.radiusMD,
              },
            ]}
          >
            <AppIcon name="business-outline" size={20} color={tokens.colors.primary} />
          </View>
          <View style={styles.infoText}>
            <Text
              style={[
                styles.infoLabel,
                {
                  fontFamily: tokens.typography.families.medium,
                  color: tokens.colors.textSecondary,
                },
              ]}
            >
              Cuenta receptora
            </Text>
            <Text
              style={[
                styles.infoValue,
                {
                  fontFamily: tokens.typography.families.semiBold,
                  color: tokens.colors.textPrimary,
                },
              ]}
            >
              {`${dashboardData.merchant.bankName} ${dashboardData.merchant.clabeMasked}`}
            </Text>
          </View>
        </View>
      </AppCard>

      <View style={{ marginTop: tokens.spacing.space6, paddingBottom: tokens.spacing.space6 }}>
        <AppButton
          variant="outlined"
          label="Cerrar sesión"
          onPress={onLogoutPress}
          testID="profile-logout-button"
        />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: 4,
  },
  title: {
    fontSize: 24,
    lineHeight: 32,
    letterSpacing: -0.4,
  },
  profileCard: {
    alignItems: 'center',
  },
  ownerName: {
    fontSize: 20,
    lineHeight: 28,
  },
  businessName: {
    fontSize: 14,
    lineHeight: 20,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoText: {
    flex: 1,
    gap: 2,
  },
  infoLabel: {
    fontSize: 12,
    lineHeight: 16,
  },
  infoValue: {
    fontSize: 15,
    lineHeight: 20,
  },
});
