import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { AppProviders } from '@/components/layout';
import { createQueryClient } from '@/config/queryClient';
import { ReportsScreen } from '@/features/reports/components';
import { buildSalesReport } from '@/features/reports/services';
import type { ReportRange, SalesReportData } from '@/features/reports/types';
import { useUiStore } from '@/stores';

const mockFetchSalesReport = jest.fn<Promise<SalesReportData>, [ReportRange]>();

jest.mock('@/features/reports/services', () => {
  const actual = jest.requireActual('@/features/reports/services');
  return {
    ...actual,
    fetchSalesReport: (range: ReportRange) => mockFetchSalesReport(range),
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

describe('buildSalesReport', () => {
  const fixedNow = new Date('2026-11-27T18:00:00.000Z'); // 12:00 PM Mexico City (2026-11-27)

  it('agrupa ventas de 7 días, calcula crecimiento positivo y solo incluye CoDi', () => {
    const report = buildSalesReport(
      [
        // Periodo actual (Nov 21 - Nov 27)
        { amount_cents: 50000, created_at: '2026-11-21T16:00:00.000Z', paid_at: null },
        { amount_cents: 74500, created_at: '2026-11-27T17:00:00.000Z', paid_at: null },
        // Periodo anterior (Nov 14 - Nov 20)
        { amount_cents: 100000, created_at: '2026-11-15T16:00:00.000Z', paid_at: null },
      ],
      '7d',
      fixedNow
    );

    expect(report.totalCents).toBe(124500);
    expect(report.previousTotalCents).toBe(100000);
    expect(report.totalCount).toBe(2);
    expect(report.growthPercent).toBe(25);
    expect(report.series).toHaveLength(7);
    expect(report.series[0]?.amountCents).toBe(50000);
    expect(report.series[6]?.amountCents).toBe(74500);
    expect(report.paymentMethods).toEqual([
      {
        id: 'codi',
        label: 'CoDi',
        amountCents: 124500,
        count: 2,
        percentage: 100,
        color: '#7200D9',
      },
    ]);
  });

  it('soporta 30 días (5 semanas) y 90 días (3 meses), y crecimiento negativo o cero', () => {
    const report30 = buildSalesReport(
      [
        { amount_cents: 40000, created_at: '2026-11-27T16:00:00.000Z', paid_at: null },
        { amount_cents: 80000, created_at: '2026-10-15T16:00:00.000Z', paid_at: null },
      ],
      '30d',
      fixedNow
    );

    expect(report30.series).toHaveLength(5);
    expect(report30.series.map((s) => s.label)).toEqual([
      'Sem 1',
      'Sem 2',
      'Sem 3',
      'Sem 4',
      'Sem 5',
    ]);
    expect(report30.growthPercent).toBe(-50);

    const report90 = buildSalesReport(
      [{ amount_cents: 30000, created_at: '2026-11-27T16:00:00.000Z', paid_at: null }],
      '90d',
      fixedNow
    );

    expect(report90.series).toHaveLength(3);
    expect(report90.growthPercent).toBeNull();

    const emptyReport = buildSalesReport([], '7d', fixedNow);
    expect(emptyReport.totalCents).toBe(0);
    expect(emptyReport.growthPercent).toBe(0);
    expect(emptyReport.paymentMethods[0]?.percentage).toBe(0);
  });
});

describe('ReportsScreen', () => {
  const sample7d: SalesReportData = {
    range: '7d',
    totalCents: 1245000,
    previousTotalCents: 1111607,
    totalCount: 14,
    growthPercent: 12,
    series: [
      { key: '7d-0', label: 'Lun', amountCents: 90000, count: 1 },
      { key: '7d-1', label: 'Mar', amountCents: 140000, count: 2 },
      { key: '7d-2', label: 'Mié', amountCents: 110000, count: 1 },
      { key: '7d-3', label: 'Jue', amountCents: 185000, count: 2 },
      { key: '7d-4', label: 'Vie', amountCents: 210000, count: 3 },
      { key: '7d-5', label: 'Sáb', amountCents: 240000, count: 2 },
      { key: '7d-6', label: 'Dom', amountCents: 270000, count: 3 },
    ],
    paymentMethods: [
      {
        id: 'codi',
        label: 'CoDi',
        amountCents: 1245000,
        count: 14,
        percentage: 100,
        color: '#7200D9',
      },
    ],
  };

  const sample30d: SalesReportData = {
    range: '30d',
    totalCents: 4500000,
    previousTotalCents: 3000000,
    totalCount: 52,
    growthPercent: 50,
    series: [
      { key: '30d-0', label: 'Sem 1', amountCents: 800000, count: 10 },
      { key: '30d-1', label: 'Sem 2', amountCents: 900000, count: 11 },
      { key: '30d-2', label: 'Sem 3', amountCents: 750000, count: 8 },
      { key: '30d-3', label: 'Sem 4', amountCents: 1000000, count: 12 },
      { key: '30d-4', label: 'Sem 5', amountCents: 1050000, count: 11 },
    ],
    paymentMethods: [
      {
        id: 'codi',
        label: 'CoDi',
        amountCents: 4500000,
        count: 52,
        percentage: 100,
        color: '#7200D9',
      },
    ],
  };

  const empty90d: SalesReportData = {
    range: '90d',
    totalCents: 0,
    previousTotalCents: 0,
    totalCount: 0,
    growthPercent: 0,
    series: [
      { key: '90d-0', label: 'Sep', amountCents: 0, count: 0 },
      { key: '90d-1', label: 'Oct', amountCents: 0, count: 0 },
      { key: '90d-2', label: 'Nov', amountCents: 0, count: 0 },
    ],
    paymentMethods: [
      {
        id: 'codi',
        label: 'CoDi',
        amountCents: 0,
        count: 0,
        percentage: 0,
        color: '#7200D9',
      },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    useUiStore.setState({
      authenticatedUser: {
        id: 'merchant-1',
        email: 'maria@nemipay.mx',
        displayName: 'María',
      },
      sessionStatus: 'authenticated',
      shiftActive: false,
      lastChargeMode: 'products',
    });

    mockFetchSalesReport.mockImplementation(async (range) => {
      if (range === '30d') return sample30d;
      if (range === '90d') return empty90d;
      return sample7d;
    });
  });

  it('muestra el fondo orgánico, encabezado, ventas totales, gráfica de barras y solo CoDi en métodos de pago', async () => {
    const onBackPress = jest.fn();
    await renderWithProviders(<ReportsScreen onBackPress={onBackPress} />);

    await waitFor(() => {
      expect(screen.getByTestId('reports-total-amount')).toHaveTextContent('$12,450.00');
    });

    expect(screen.getByTestId('reports-backdrop')).toBeOnTheScreen();
    expect(screen.getByText('Reportes')).toBeOnTheScreen();
    expect(screen.getByText('Ventas totales')).toBeOnTheScreen();
    expect(screen.getByText('MXN')).toBeOnTheScreen();
    expect(screen.getByTestId('reports-growth-badge')).toHaveTextContent('+12%');
    expect(screen.getByTestId('reports-bar-chart')).toBeOnTheScreen();
    expect(screen.getByTestId('reports-payment-methods')).toBeOnTheScreen();
    expect(screen.getByTestId('reports-donut-chart')).toBeOnTheScreen();
    expect(screen.getByTestId('reports-method-codi')).toBeOnTheScreen();
    expect(screen.getByTestId('reports-method-codi-pct')).toHaveTextContent('100%');
    expect(screen.queryByText('Tarjeta')).toBeNull();
    expect(screen.queryByText('Efectivo')).toBeNull();

    await fireEvent.press(screen.getByTestId('reports-back-button'));
    expect(onBackPress).toHaveBeenCalledTimes(1);
  });

  it('permite cambiar entre 7 días, 30 días y 90 días y muestra estado vacío cuando no hay cobros', async () => {
    await renderWithProviders(<ReportsScreen onBackPress={jest.fn()} />);

    await waitFor(() => {
      expect(screen.getByTestId('reports-total-amount')).toHaveTextContent('$12,450.00');
    });

    await fireEvent.press(screen.getByTestId('reports-range-30d'));
    await waitFor(() => {
      expect(screen.getByTestId('reports-total-amount')).toHaveTextContent('$45,000.00');
    });
    expect(screen.getByTestId('reports-growth-badge')).toHaveTextContent('+50%');
    expect(screen.getByText('Sem 1')).toBeOnTheScreen();

    await fireEvent.press(screen.getByTestId('reports-range-90d'));
    await waitFor(() => {
      expect(screen.getByTestId('reports-total-amount')).toHaveTextContent('$0.00');
    });
    expect(screen.getByTestId('reports-growth-badge')).toHaveTextContent('0%');
    expect(screen.getByTestId('reports-method-codi-pct')).toHaveTextContent('0%');
    expect(screen.getByText('Sin cobros en este periodo')).toBeOnTheScreen();
  });
});
