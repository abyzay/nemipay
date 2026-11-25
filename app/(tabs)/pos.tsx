import React from 'react';
import { router } from 'expo-router';
import { ScreenContainer } from '@/components/layout';
import { PosScreen } from '@/features/pos/components';
import { useAppTheme } from '@/hooks';

export default function PosTabRoute() {
  const { tokens } = useAppTheme();

  return (
    <ScreenContainer
      edges={['top']}
      contentContainerStyle={{ paddingHorizontal: tokens.spacing.space4 }}
    >
      <PosScreen
        onBackPress={() => {
          if (router.canGoBack()) {
            router.back();
          } else {
            router.replace('/(tabs)');
          }
        }}
      />
    </ScreenContainer>
  );
}
