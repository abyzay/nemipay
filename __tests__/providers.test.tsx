import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { Text } from 'react-native-paper';
import { AppProviders } from '@/components/layout/AppProviders';
import { createQueryClient } from '@/config/queryClient';
import { useAppTheme } from '@/hooks';

function InfrastructureProbe() {
  const { paperTheme, tokens } = useAppTheme();
  return (
    <Text testID="probe-text" style={{ color: paperTheme.colors.primary }}>
      {`NemiPay:${tokens.colors.primary}`}
    </Text>
  );
}

describe('AppProviders de infraestructura', () => {
  it('provee SafeAreaProvider, QueryClientProvider y PaperProvider correctamente', async () => {
    const testClient = createQueryClient();
    await render(
      <AppProviders
        client={testClient}
        initialMetrics={{
          frame: { x: 0, y: 0, width: 390, height: 844 },
          insets: { top: 0, left: 0, right: 0, bottom: 0 },
        }}
      >
        <InfrastructureProbe />
      </AppProviders>
    );

    expect(screen.getByTestId('probe-text')).toHaveTextContent('NemiPay:#087F5B');
  });
});
