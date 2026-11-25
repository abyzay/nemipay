import React from 'react';
import { router } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { signOutSession } from '@/features/authentication/services';
import { stopShiftKeepAwake } from '@/features/payments/services/announce';
import { ProfileScreen } from '@/features/profile/components';
import { useUiStore } from '@/stores';

export default function ProfileRoute() {
  const queryClient = useQueryClient();
  const clearSession = useUiStore((state) => state.clearSession);

  return (
    <ProfileScreen
      onLogoutPress={async () => {
        stopShiftKeepAwake();
        try {
          await signOutSession();
        } finally {
          queryClient.clear();
          clearSession();
          router.replace('/(auth)/welcome');
        }
      }}
    />
  );
}
