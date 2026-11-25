import React from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { ChargeScreen } from '@/features/payments/components';

export default function CollectRoute() {
  const params = useLocalSearchParams<{ chargeId?: string }>();
  const chargeId = typeof params.chargeId === 'string' ? params.chargeId : '';

  return (
    <ChargeScreen
      chargeId={chargeId}
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
