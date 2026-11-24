import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { AppProviders } from '@/components/layout';
import { createQueryClient } from '@/config/queryClient';
import { ReportsScreen } from '@/features/reports/components';
import { lightColors } from '@/theme';

jest.mock('@react-native-vector-icons/ionicons', () => {
  const { createElement } = jest.requireActual<typeof import('react')>('react');
  const { Text } = jest.requireActual<typeof import('react-native')>('react-native');

  return {
    Ionicons: ({ name, testID }: { name: string; testID?: string }) =>
      createElement(Text, { testID: testID ?? `ionicon-${name}` }, name),
  };
});

jest.mock('react-native-gifted-charts', () => {
  const { createElement } = jest.requireActual<typeof import('react')>('react');
  const { View, Text } = jest.requireActual<typeof import('react-native')>('react-native');

  return {
    LineChart: ({
      color,
      startFillColor,
      data,
    }: {
      color?: string;
      startFillColor?: string;
      data?: { label?: string; value: number }[];
    }) =>
      createElement(
        View,
        { testID: 'mock-line-chart', accessibilityHint: `${color ?? ''}|${startFillColor ?? ''}` },
        ...(data ?? []).map((item, idx) =>
          createElement(Text, { key: `${item.label ?? idx}` }, `${item.label ?? ''}:${item.value}`)
        )
      ),
  };
});

function renderWithProviders(ui: React.ReactElement) {
  return render(
    <AppProviders
      client={createQueryClient()}
      initialMetrics={{
        frame: { x: 0, y: 0, width: 390, height: 844 },
        insets: { top: 0, left: 0, right: 0, bottom: 0 },
      }}
    >
      {ui}
    </AppProviders>
  );
}

describe('ReportsScreen (Reportes)', () => {
  it('renderiza KPIs, gráfica con colores del tema y resumen semanal desde JSON', async () => {
    const onBackPress = jest.fn();

    await renderWithProviders(<ReportsScreen onBackPress={onBackPress} />);

    expect(screen.getByText('Reportes')).toBeOnTheScreen();
    expect(screen.getByTestId('reports-period-label')).toHaveTextContent('Esta semana');
    expect(screen.getByTestId('reports-total-amount')).toHaveTextContent('$22,900');
    expect(screen.getByTestId('reports-payments-count')).toHaveTextContent('126');

    const chart = screen.getByTestId('mock-line-chart');
    expect(chart).toBeOnTheScreen();
    expect(chart.props.accessibilityHint).toBe(
      `${lightColors.primary}|${lightColors.primaryLight}`
    );
    expect(screen.getByText('Lun:1250')).toBeOnTheScreen();
    expect(screen.getByText('Sáb:5950')).toBeOnTheScreen();

    expect(screen.getByText('Resumen')).toBeOnTheScreen();
    expect(screen.getByTestId('reports-summary-average')).toHaveTextContent('$181.75');
    expect(screen.getByTestId('reports-summary-highest')).toHaveTextContent('$650.00');
    expect(screen.getByTestId('reports-summary-qr-share')).toHaveTextContent('81%');

    await fireEvent.press(screen.getByTestId('reports-back-button'));
    expect(onBackPress).toHaveBeenCalledTimes(1);
  });

  it('cambia el periodo desde el selector y actualiza KPIs, gráfica y resumen', async () => {
    await renderWithProviders(<ReportsScreen />);

    await fireEvent.press(screen.getByTestId('reports-period-trigger'));
    expect(screen.getByTestId('reports-period-modal')).toBeOnTheScreen();

    await fireEvent.press(screen.getByTestId('reports-period-option-today'));
    expect(screen.queryByTestId('reports-period-modal')).toBeNull();

    expect(screen.getByTestId('reports-period-label')).toHaveTextContent('Hoy');
    expect(screen.getByTestId('reports-total-amount')).toHaveTextContent('$4,850');
    expect(screen.getByTestId('reports-payments-count')).toHaveTextContent('14');
    expect(screen.getByText('2p:1350')).toBeOnTheScreen();
    expect(screen.getByTestId('reports-summary-average')).toHaveTextContent('$346.43');
    expect(screen.getByTestId('reports-summary-highest')).toHaveTextContent('$520.00');
  });
});
