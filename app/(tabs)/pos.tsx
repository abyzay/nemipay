import React from 'react';
import { router } from 'expo-router';
import { PosScreen } from '@/features/pos/components';

export default function PosRoute() {
  return (
    <PosScreen
      onClosePress={() => router.navigate('/(tabs)')}
      onQrCheckoutPress={(amountCents, concept) => {
        router.push({
          pathname: '/collect',
          params: {
            mode: 'dynamic',
            amountCents: String(amountCents),
            concept,
          },
        });
      }}
    />
  );
}
