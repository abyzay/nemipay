import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';
import { queryClient as defaultQueryClient } from '@/config/queryClient';
import { useUiStore } from '@/stores/uiStore';
import { getPaperTheme } from '@/theme';

interface AppProvidersProps {
  children: React.ReactNode;
  client?: QueryClient;
  initialMetrics?: Metrics;
}

export function AppProviders({
  children,
  client = defaultQueryClient,
  initialMetrics,
}: AppProvidersProps) {
  const themeMode = useUiStore((state) => state.themeMode);
  const paperTheme = getPaperTheme(themeMode);

  return (
    <SafeAreaProvider initialMetrics={initialMetrics}>
      <QueryClientProvider client={client}>
        <PaperProvider theme={paperTheme}>{children}</PaperProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
