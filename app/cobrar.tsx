import React from 'react';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { CobrarScreen } from '@/features/payments/components';
import { useUiStore } from '@/stores';

export default function CobrarRoute() {
  const sessionStatus = useUiStore((state) => state.sessionStatus);
  const params = useLocalSearchParams<{ mode?: string }>();

  if (sessionStatus === 'unauthenticated') {
    return <Redirect href="/(auth)/welcome" />;
  }

  const initialMode = params.mode === 'products' ? 'products' : 'free_amount';

  return (
    <CobrarScreen
      initialMode={initialMode}
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
