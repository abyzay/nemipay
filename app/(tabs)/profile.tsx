import React from 'react';
import { router } from 'expo-router';
import { ProfileScreen } from '@/features/profile/components';
import { useUiStore } from '@/stores';

export default function ProfileRoute() {
  const clearSession = useUiStore((state) => state.clearSession);

  return (
    <ProfileScreen
      onLogoutPress={() => {
        clearSession();
        router.replace('/(auth)/welcome');
      }}
    />
  );
}
