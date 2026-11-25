import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { ScreenContainer } from '@/components/layout';
import { AppAvatar, AppBadge, AppButton, AppCard } from '@/components/ui';
import { fetchMerchantProfile } from '@/features/authentication/services';
import { paymentKeys } from '@/features/payments/queries/keys';
import { startShiftAnnouncement, stopShiftKeepAwake } from '@/features/payments/services/announce';
import { useAppTheme } from '@/hooks';
import { useUiStore } from '@/stores';

export interface ProfileScreenProps {
  onLogoutPress: () => void | Promise<void>;
}

function getInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return 'NP';
  if (words.length === 1) return words[0]!.slice(0, 2).toUpperCase();
  return `${words[0]![0]}${words[1]![0]}`.toUpperCase();
}

export function ProfileScreen({ onLogoutPress }: ProfileScreenProps) {
  const { tokens } = useAppTheme();
  const authenticatedUser = useUiStore((state) => state.authenticatedUser);
  const shiftActive = useUiStore((state) => state.shiftActive);
  const setShiftActive = useUiStore((state) => state.setShiftActive);

  const merchantQuery = useQuery({
    queryKey: paymentKeys.merchant(authenticatedUser?.id ?? ''),
    queryFn: () => fetchMerchantProfile(authenticatedUser!.id),
    enabled: Boolean(authenticatedUser?.id),
  });

  const merchantName = merchantQuery.data?.name ?? authenticatedUser?.displayName ?? 'Mi Negocio';
  const email = authenticatedUser?.email ?? '';

  const handleToggleShift = async () => {
    if (shiftActive) {
      stopShiftKeepAwake();
      setShiftActive(false);
    } else {
      await startShiftAnnouncement();
      setShiftActive(true);
    }
  };

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
          Cuenta
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
        <AppAvatar initials={getInitials(merchantName)} size={64} />
        <Text
          testID="profile-merchant-name"
          style={[
            styles.ownerName,
            {
              fontFamily: tokens.typography.families.bold,
              color: tokens.colors.textPrimary,
              marginTop: tokens.spacing.space1,
            },
          ]}
        >
          {merchantName}
        </Text>
        {email ? (
          <Text
            style={[
              styles.businessName,
              {
                fontFamily: tokens.typography.families.regular,
                color: tokens.colors.textSecondary,
              },
            ]}
          >
            {email}
          </Text>
        ) : null}
        <View style={{ marginTop: tokens.spacing.space1 }}>
          <AppBadge
            label={shiftActive ? 'Turno activo (pantalla y voz)' : 'Turno en pausa'}
            variant={shiftActive ? 'success' : 'neutral'}
            icon={shiftActive ? 'volume-2' : 'clock'}
          />
        </View>
      </AppCard>

      <View
        style={{
          marginTop: tokens.spacing.space5,
          gap: tokens.spacing.space3,
          paddingBottom: tokens.spacing.space6,
        }}
      >
        <AppButton
          variant={shiftActive ? 'outlined' : 'primary'}
          leftIcon="volume-2"
          label={shiftActive ? 'Terminar turno' : 'Iniciar turno'}
          onPress={() => void handleToggleShift()}
          testID="profile-shift-toggle-button"
        />

        <AppButton
          variant="outlined"
          label="Cerrar sesión"
          onPress={() => void onLogoutPress()}
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
    textAlign: 'center',
  },
  businessName: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
});
