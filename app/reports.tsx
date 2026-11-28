import React from 'react';
import { Redirect, router } from 'expo-router';
import { ReportsScreen } from '@/features/reports/components';
import { useUiStore } from '@/stores';

export default function ReportsRoute() {
  const sessionStatus = useUiStore((state) => state.sessionStatus);

  if (sessionStatus === 'unauthenticated') {
    return <Redirect href="/(auth)/welcome" />;
  }

  return (
    <ReportsScreen
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
