import React from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { CollectQrScreen, type CollectMode } from '@/features/payments/components';

export default function CollectRoute() {
  const params = useLocalSearchParams<{ mode?: string }>();
  const initialMode: CollectMode = params.mode === 'business' ? 'business' : 'dynamic';

  return <CollectQrScreen initialMode={initialMode} onBackPress={() => router.back()} />;
}
