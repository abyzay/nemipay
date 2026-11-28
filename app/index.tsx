import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Redirect } from 'expo-router';
import { ScreenBackdrop } from '@/components/layout';
import { useAppTheme } from '@/hooks';
import { useUiStore } from '@/stores';

export default function IndexRoute() {
  const { tokens } = useAppTheme();
  const sessionStatus = useUiStore((state) => state.sessionStatus);

  if (sessionStatus === 'authenticated') {
    return <Redirect href="/(tabs)" />;
  }

  if (sessionStatus === 'unauthenticated') {
    return <Redirect href="/(auth)/welcome" />;
  }

  return (
    <View
      style={{
        flex: 1,
        position: 'relative',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: tokens.colors.background,
      }}
    >
      <ScreenBackdrop />
      <ActivityIndicator size="large" color={tokens.colors.primary} />
    </View>
  );
}
