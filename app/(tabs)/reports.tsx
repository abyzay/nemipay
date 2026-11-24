import React from 'react';
import { router } from 'expo-router';
import { ReportsScreen } from '@/features/reports/components';

export default function ReportsRoute() {
  return <ReportsScreen onBackPress={() => router.navigate('/(tabs)')} />;
}
