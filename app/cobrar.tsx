import React from 'react';
import { Redirect, router } from 'expo-router';
import { CobrarScreen } from '@/features/payments/components';
import { useUiStore } from '@/stores';

export default function CobrarRoute() {
  const sessionStatus = useUiStore((state) => state.sessionStatus);

  if (sessionStatus === 'unauthenticated') {
    return <Redirect href="/(auth)/welcome" />;
  }

  return (
    <CobrarScreen
      onBackPress={() => {
        if (router.canGoBack()) {
          router.back();
        } else {
          router.replace('/(tabs)');
        }
      }}
    />
  );
}
