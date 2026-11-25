import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { AppProviders } from '@/components/layout';
import { createQueryClient } from '@/config/queryClient';
import { MovementRow, MovementsScreen } from '@/features/movements/components';
import { formatMovementDateLabel } from '@/features/movements/services/movementsService';
import type { MovementsPage, MovementStatus } from '@/features/movements/types';
import { useUiStore } from '@/stores';

const mockFetchMovementsPage = jest.fn();

jest.mock('@/features/movements/services', () => {
  const actual = jest.requireActual('@/features/movements/services');
  return {
    ...actual,
    fetchMovementsPage: (...args: unknown[]) => mockFetchMovementsPage(...args),
  };
});

jest.mock('expo-router', () => ({
  router: {
    back: jest.fn(),
    canGoBack: jest.fn(() => false),
    replace: jest.fn(),
    push: jest.fn(),
  },
}));

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

describe('MovementsScreen (/activity)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useUiStore.setState({
      authenticatedUser: {
        id: 'merchant-1',
        email: 'demo@nemipay.mx',
        displayName: 'Negocio Demo',
      },
      sessionStatus: 'authenticated',
    });

    mockFetchMovementsPage.mockImplementation(
      async ({ page = 0 }: { page?: number }): Promise<MovementsPage> => {
        if (page === 0) {
          return {
            items: [
              {
                id: 'chg-1',
                concept: 'Pago recibido',
                amountCents: 13965,
                currency: 'MXN',
                timeLabel: 'Hoy, 06:32 p.m.',
                status: 'CONFIRMED',
                paidAfterExpiry: false,
                createdAt: '2026-11-24T18:32:00.000Z',
              },
              {
                id: 'chg-2',
                concept: 'Tacos al pastor',
                amountCents: 5000,
                currency: 'MXN',
                timeLabel: 'Ayer, 03:20 p.m.',
                status: 'EXPIRED',
                paidAfterExpiry: false,
                createdAt: '2026-11-23T15:20:00.000Z',
              },
            ],
            nextPage: 1,
            totalCount: 3,
          };
        }

        return {
          items: [
            {
              id: 'chg-3',
              concept: 'Agua fresca',
              amountCents: 7500,
              currency: 'MXN',
              timeLabel: '01 Ago, 10:15 a.m.',
              status: 'CONFIRMED',
              paidAfterExpiry: false,
              createdAt: '2026-08-01T10:15:00.000Z',
            },
          ],
          nextPage: null,
          totalCount: 3,
        };
      }
    );
  });

  it('muestra encabezado, buscador, filtros y movimientos paginados', async () => {
    await renderWithProviders(<MovementsScreen />);

    expect(screen.getByText('Movimientos')).toBeOnTheScreen();
    expect(screen.getByTestId('activity-search-input')).toBeOnTheScreen();
    expect(screen.getByTestId('activity-filter-all')).toBeOnTheScreen();
    expect(screen.getByTestId('activity-filter-received')).toBeOnTheScreen();
    expect(screen.getByTestId('activity-filter-pending')).toBeOnTheScreen();
    expect(screen.getByTestId('activity-filter-other')).toBeOnTheScreen();

    await waitFor(() => {
      expect(screen.getByTestId('movement-row-chg-1')).toBeOnTheScreen();
    });

    expect(screen.getByText('Pago recibido')).toBeOnTheScreen();
    expect(screen.getByText('Hoy, 06:32 p.m.')).toBeOnTheScreen();
    expect(screen.getByText('+$139.65')).toBeOnTheScreen();
    expect(screen.getByText('Tacos al pastor')).toBeOnTheScreen();
    expect(screen.getByText('$50.00')).toBeOnTheScreen();

    await fireEvent.press(screen.getByTestId('activity-load-more-button'));

    await waitFor(() => {
      expect(screen.getByTestId('movement-row-chg-3')).toBeOnTheScreen();
    });
    expect(mockFetchMovementsPage).toHaveBeenCalledWith(
      expect.objectContaining({ page: 1, filter: 'all', search: '' })
    );
  });

  it('aplica filtro y búsqueda al consultar la página', async () => {
    await renderWithProviders(<MovementsScreen />);

    await waitFor(() => {
      expect(screen.getByTestId('movement-row-chg-1')).toBeOnTheScreen();
    });

    await fireEvent.press(screen.getByTestId('activity-filter-received'));

    await waitFor(() => {
      expect(mockFetchMovementsPage).toHaveBeenCalledWith(
        expect.objectContaining({ page: 0, filter: 'received', search: '' })
      );
    });

    await fireEvent.changeText(screen.getByTestId('activity-search-input'), 'Tacos');

    await waitFor(
      () => {
        expect(mockFetchMovementsPage).toHaveBeenCalledWith(
          expect.objectContaining({ page: 0, filter: 'received', search: 'Tacos' })
        );
      },
      { timeout: 1500 }
    );
  });

  it('formatea fechas como Hoy, Ayer y DD Mes en America/Mexico_City', () => {
    const now = new Date('2026-11-24T20:00:00-06:00');
    expect(formatMovementDateLabel('2026-11-24T18:32:00-06:00', now)).toMatch(/^Hoy, /);
    expect(formatMovementDateLabel('2026-11-23T15:20:00-06:00', now)).toMatch(/^Ayer, /);
    expect(formatMovementDateLabel('2026-08-01T10:15:00-06:00', now)).toMatch(/^01 Ago, /);
  });

  it('muestra un icono y etiqueta distintos según cada estado del pago', async () => {
    const cases: { status: MovementStatus; icon: string; label: string }[] = [
      { status: 'CONFIRMED', icon: 'circle-check', label: 'Pagado' },
      { status: 'AWAITING_PAYMENT', icon: 'clock', label: 'Esperando pago' },
      { status: 'CREATING', icon: 'qr-code', label: 'Creando QR' },
      { status: 'EXPIRED', icon: 'timer-off', label: 'Expirado' },
      { status: 'CANCELLED', icon: 'ban', label: 'Cancelado' },
      { status: 'FAILED', icon: 'circle-alert', label: 'Fallido' },
      { status: 'UNDER_REVIEW', icon: 'shield-alert', label: 'En revisión' },
    ];

    for (const item of cases) {
      await renderWithProviders(
        <MovementRow
          testID={`row-${item.status}`}
          movement={{
            id: `id-${item.status}`,
            concept: `Cobro ${item.status}`,
            amountCents: 10000,
            currency: 'MXN',
            timeLabel: 'Hoy, 12:00 p.m.',
            status: item.status,
            paidAfterExpiry: false,
            createdAt: '2026-11-24T18:00:00.000Z',
          }}
        />
      );

      expect(screen.getByTestId(`row-${item.status}-icon-${item.icon}`)).toBeOnTheScreen();
      expect(screen.getByText(item.label)).toBeOnTheScreen();
    }
  });
});
