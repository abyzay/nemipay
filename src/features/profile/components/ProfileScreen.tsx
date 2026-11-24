import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ScreenContainer } from '@/components/layout';
import { AppButton, AppIcon, SurfaceCard, UserAvatar } from '@/components/ui';
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
      <View style={[styles.header, { paddingTop: tokens.spacing.sm }]}>
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

      <SurfaceCard
        style={[styles.profileCard, { marginTop: tokens.spacing.md, gap: tokens.spacing.sm }]}
      >
        <UserAvatar initials={dashboardData.merchant.avatarInitials} size={64} />
        <Text
          style={[
            styles.ownerName,
            {
              fontFamily: tokens.typography.families.bold,
              color: tokens.colors.textPrimary,
            },
          ]}
        >
          {displayName}
        </Text>
        <Text
          style={[
            styles.businessName,
            {
              fontFamily: tokens.typography.families.medium,
              color: tokens.colors.textSecondary,
            },
          ]}
        >
          {`${dashboardData.merchant.businessName} · @${username}`}
        </Text>
      </SurfaceCard>

      <SurfaceCard style={{ marginTop: tokens.spacing.md, gap: tokens.spacing.sm }}>
        <View style={[styles.infoRow, { gap: tokens.spacing.sm }]}>
          <AppIcon name="qr-code-outline" size={20} color={tokens.colors.primary} />
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

        <View style={[styles.divider, { backgroundColor: tokens.colors.border }]} />

        <View style={[styles.infoRow, { gap: tokens.spacing.sm }]}>
          <AppIcon name="business-outline" size={20} color={tokens.colors.primary} />
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
      </SurfaceCard>

      <View style={{ marginTop: tokens.spacing.lg, paddingBottom: tokens.spacing.lg }}>
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
    fontSize: 22,
    lineHeight: 28,
  },
  profileCard: {
    alignItems: 'center',
  },
  ownerName: {
    fontSize: 20,
    lineHeight: 26,
  },
  businessName: {
    fontSize: 14,
    lineHeight: 20,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
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
  divider: {
    height: 1,
  },
});
