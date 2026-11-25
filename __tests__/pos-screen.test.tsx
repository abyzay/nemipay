import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { AppProviders } from '@/components/layout';
import { createQueryClient } from '@/config/queryClient';
import { PosScreen } from '@/features/pos/components';
import type { PosProduct } from '@/features/pos/types';
import { useUiStore } from '@/stores';

const mockCreateCharge = jest.fn();
const mockFetchProducts = jest.fn();
const mockCreateProduct = jest.fn();
const mockUpdateProduct = jest.fn();
const mockArchiveProduct = jest.fn();

jest.mock('@/features/payments/services/chargesService', () => ({
  createCharge: (...args: unknown[]) => mockCreateCharge(...args),
}));

jest.mock('@/features/pos/services/productsService', () => {
  const actual = jest.requireActual('@/features/pos/services/productsService');
  return {
    ...actual,
    fetchActiveProducts: () => mockFetchProducts(),
    createProduct: (...args: unknown[]) => mockCreateProduct(...args),
    updateProduct: (...args: unknown[]) => mockUpdateProduct(...args),
    archiveProduct: (...args: unknown[]) => mockArchiveProduct(...args),
  };
});

jest.mock('@react-native-vector-icons/ionicons', () => {
  const { createElement } = jest.requireActual<typeof import('react')>('react');
  const { Text } = jest.requireActual<typeof import('react-native')>('react-native');

  return {
    Ionicons: ({ name, testID }: { name: string; testID?: string }) =>
      createElement(Text, { testID: testID ?? `ionicon-${name}` }, name),
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

describe('PosScreen (POS mínimo agnóstico)', () => {
  let productsState: PosProduct[];

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

    productsState = [
      { id: 'prod-1', name: 'Agua 600ml', priceCents: 1500 },
      { id: 'prod-2', name: 'Servicio básico', priceCents: 4500 },
    ];

    mockFetchProducts.mockImplementation(async () => [...productsState]);
    mockCreateProduct.mockImplementation(async (_merchantId, draft) => {
      const created: PosProduct = { id: 'prod-3', name: draft.name, priceCents: draft.priceCents };
      productsState = [created, ...productsState];
      return created;
    });
    mockUpdateProduct.mockImplementation(async (id, draft) => {
      const updated: PosProduct = { id, name: draft.name, priceCents: draft.priceCents };
      productsState = productsState.map((p) => (p.id === id ? updated : p));
      return updated;
    });
    mockArchiveProduct.mockImplementation(async (id) => {
      productsState = productsState.filter((p) => p.id !== id);
    });
    mockCreateCharge.mockResolvedValue({
      id: 'charge-pos-1',
      status: 'AWAITING_PAYMENT',
      amountCents: 6000,
      currency: 'MXN',
      concept: '1× Agua 600ml, 1× Servicio básico',
      items: null,
      qrPayload: 'CODI://QR',
      expiresAt: new Date(Date.now() + 600_000).toISOString(),
      paidAt: null,
      paidAfterExpiry: false,
      failureReason: null,
      createdAt: new Date().toISOString(),
    });
  });

  it('permite sumar, restar, calcular total y cobrar enviando solo items al servidor', async () => {
    const onChargeCreated = jest.fn();
    await renderWithProviders(<PosScreen onChargeCreated={onChargeCreated} />);

    await waitFor(() => {
      expect(screen.getByText('Agua 600ml')).toBeOnTheScreen();
    });

    expect(screen.getByTestId('pos-checkout-summary')).toHaveTextContent(
      '0 artículos · Total $0.00'
    );

    await fireEvent.press(screen.getByTestId('pos-product-card-prod-1'));
    await fireEvent.press(screen.getByTestId('pos-product-plus-prod-1'));
    await fireEvent.press(screen.getByTestId('pos-product-card-prod-2'));

    expect(screen.getByTestId('pos-checkout-summary')).toHaveTextContent(
      '3 artículos · Total $75.00'
    );

    await fireEvent.press(screen.getByTestId('pos-product-minus-prod-1'));
    expect(screen.getByTestId('pos-checkout-summary')).toHaveTextContent(
      '2 artículos · Total $60.00'
    );

    await fireEvent.press(screen.getByTestId('pos-checkout-qr-button'));

    await waitFor(() => {
      expect(mockCreateCharge).toHaveBeenCalledWith(
        {
          items: [
            { productId: 'prod-1', quantity: 1 },
            { productId: 'prod-2', quantity: 1 },
          ],
        },
        expect.any(String)
      );
      expect(onChargeCreated).toHaveBeenCalledWith('charge-pos-1');
    });
  });

  it('permite agregar y editar un producto o servicio', async () => {
    await renderWithProviders(<PosScreen onChargeCreated={jest.fn()} />);

    await waitFor(() => {
      expect(screen.getByTestId('pos-add-product-button')).toBeOnTheScreen();
    });

    await fireEvent.press(screen.getByTestId('pos-add-product-button'));
    expect(screen.getByTestId('pos-product-form-modal')).toBeOnTheScreen();

    await fireEvent.changeText(screen.getByTestId('pos-form-name-input'), 'Jugo verde');
    await fireEvent.changeText(screen.getByTestId('pos-form-price-input'), '35');
    await fireEvent.press(screen.getByTestId('pos-form-save-button'));

    await waitFor(() => {
      expect(screen.getByText('Jugo verde')).toBeOnTheScreen();
    });

    await fireEvent.press(screen.getByTestId('pos-product-edit-prod-1'));
    await fireEvent.changeText(screen.getByTestId('pos-form-name-input'), 'Agua 1L');
    await fireEvent.changeText(screen.getByTestId('pos-form-price-input'), '20');
    await fireEvent.press(screen.getByTestId('pos-form-save-button'));

    await waitFor(() => {
      expect(screen.getByText('Agua 1L')).toBeOnTheScreen();
    });
  });
});
