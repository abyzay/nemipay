import React from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { CollectQrScreen, type CollectMode } from '@/features/payments/components';

export default function CollectRoute() {
  const params = useLocalSearchParams<{
    mode?: string;
    amountCents?: string;
    concept?: string;
  }>();
  const initialMode: CollectMode = params.mode === 'business' ? 'business' : 'dynamic';
  const parsedAmountCents = params.amountCents
    ? Number.parseInt(params.amountCents, 10)
    : undefined;

  return (
    <CollectQrScreen
      initialMode={initialMode}
      initialAmountCents={
        parsedAmountCents && Number.isFinite(parsedAmountCents) ? parsedAmountCents : undefined
      }
      initialConcept={typeof params.concept === 'string' ? params.concept : undefined}
      onBackPress={() => router.back()}
    />
  );
}
