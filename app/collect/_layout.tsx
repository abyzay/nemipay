import React from 'react';
import { Redirect, Stack } from 'expo-router';
import { useUiStore } from '@/stores';

export default function CollectLayout() {
  const sessionStatus = useUiStore((state) => state.sessionStatus);

  if (sessionStatus === 'unauthenticated') {
    return <Redirect href="/(auth)/welcome" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
