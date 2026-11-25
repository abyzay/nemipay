import React from 'react';
import { Redirect, Stack } from 'expo-router';
import { useUiStore } from '@/stores';

export default function AuthLayout() {
  const sessionStatus = useUiStore((state) => state.sessionStatus);

  if (sessionStatus === 'authenticated') {
    return <Redirect href="/(tabs)" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
