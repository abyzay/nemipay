import React from 'react';
import { router } from 'expo-router';
import { DashboardScreen } from '@/features/business/components';

export default function DashboardRoute() {
  return (
    <DashboardScreen
      onReceiveQrPress={() => router.push({ pathname: '/collect', params: { mode: 'dynamic' } })}
      onQuickChargePress={() => router.push({ pathname: '/collect', params: { mode: 'dynamic' } })}
      onBusinessQrPress={() => router.push({ pathname: '/collect', params: { mode: 'business' } })}
      onSeeAllMovementsPress={() => router.push('/(tabs)/activity')}
    />
  );
}
