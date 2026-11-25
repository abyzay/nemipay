import React from 'react';
import * as ImagePicker from 'expo-image-picker';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { AppProviders } from '@/components/layout';
import { createQueryClient } from '@/config/queryClient';
import { PosScreen } from '@/features/pos/components';
import type { PosCategory, PosProduct } from '@/features/pos/types';
import { useUiStore } from '@/stores';

const mockCreateCharge = jest.fn();
const mockFetchProducts = jest.fn();
const mockCreateProduct = jest.fn();
const mockUpdateProduct = jest.fn();
const mockArchiveProduct = jest.fn();

const mockFetchCategories = jest.fn();
const mockCreateCategory = jest.fn();
const mockUpdateCategory = jest.fn();
const mockArchiveCategory = jest.fn();

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

jest.mock('@/features/pos/services/categoriesService', () => {
  const actual = jest.requireActual('@/features/pos/services/categoriesService');
  return {
    ...actual,
    fetchActiveCategories: () => mockFetchCategories(),
    createCategory: (...args: unknown[]) => mockCreateCategory(...args),
    updateCategory: (...args: unknown[]) => mockUpdateCategory(...args),
    archiveCategory: (...args: unknown[]) => mockArchiveCategory(...args),
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

describe('PosScreen (Punto de venta móvil con categorías CRUD y fotos WebP)', () => {
  let categoriesState: PosCategory[];
  let productsState: PosProduct[];

  beforeEach(() => {
    jest.clearAllMocks();
    useUiStore.setState({
      authenticatedUser: {
        id: 'merchant-1',
        email: 'demo@nemipay.mx',
        displayName: 'Taquería Demo',
      },
      sessionStatus: 'authenticated',
    });

    categoriesState = [
      {
        id: 'cat-1',
        name: 'Tacos',
        description: 'Tacos al carbón recién hechos',
        imageUrl: 'https://example.com/tacos-cat.webp',
      },
      {
        id: 'cat-2',
        name: 'Bebidas',
        description: 'Refrescos fríos y aguas frescas',
        imageUrl: null,
      },
    ];

    productsState = [
      {
        id: 'prod-1',
        name: 'Tacos de bistec',
        priceCents: 2800,
        description: 'Bistec asado al carbón',
        category: 'Tacos',
        categoryId: 'cat-1',
        imageUrl: 'https://example.com/tacos.webp',
      },
      {
        id: 'prod-2',
        name: 'Refresco',
        priceCents: 2200,
        description: 'Bien frío 355 ml',
        category: 'Bebidas',
        categoryId: 'cat-2',
        imageUrl: null,
      },
    ];

    mockFetchCategories.mockImplementation(async () => [...categoriesState]);
    mockCreateCategory.mockImplementation(async (_merchantId, draft) => {
      const created: PosCategory = {
        id: 'cat-3',
        name: draft.name,
        description: draft.description ?? null,
        imageUrl: draft.imageUri ?? null,
      };
      categoriesState = [...categoriesState, created];
      return created;
    });
    mockUpdateCategory.mockImplementation(async (id, draft) => {
      const existing = categoriesState.find((c) => c.id === id);
      const updated: PosCategory = {
        id,
        name: draft.name,
        description: draft.description ?? null,
        imageUrl: draft.imageUri === undefined ? (existing?.imageUrl ?? null) : draft.imageUri,
      };
      categoriesState = categoriesState.map((c) => (c.id === id ? updated : c));
      return updated;
    });
    mockArchiveCategory.mockImplementation(async (id) => {
      categoriesState = categoriesState.filter((c) => c.id !== id);
    });

    mockFetchProducts.mockImplementation(async () => [...productsState]);
    mockCreateProduct.mockImplementation(async (_merchantId, draft) => {
      const created: PosProduct = {
        id: 'prod-3',
        name: draft.name,
        priceCents: draft.priceCents,
        description: draft.description ?? null,
        category: draft.category ?? 'General',
        categoryId: draft.categoryId ?? null,
        imageUrl: draft.imageUri ?? null,
      };
      productsState = [created, ...productsState];
      return created;
    });
    mockUpdateProduct.mockImplementation(async (id, draft) => {
      const existing = productsState.find((p) => p.id === id);
      const updated: PosProduct = {
        id,
        name: draft.name,
        priceCents: draft.priceCents,
        description: draft.description ?? null,
        category: draft.category ?? 'General',
        categoryId: draft.categoryId ?? existing?.categoryId ?? null,
        imageUrl: draft.imageUri === undefined ? (existing?.imageUrl ?? null) : draft.imageUri,
      };
      productsState = productsState.map((p) => (p.id === id ? updated : p));
      return updated;
    });
    mockArchiveProduct.mockImplementation(async (id) => {
      productsState = productsState.filter((p) => p.id !== id);
    });

    mockCreateCharge.mockResolvedValue({
      id: 'charge-pos-1',
      status: 'AWAITING_PAYMENT',
      amountCents: 10000,
      currency: 'MXN',
      concept: '2× Tacos de bistec, 2× Refresco',
      items: null,
      qrPayload: 'CODI://QR',
      expiresAt: new Date(Date.now() + 600_000).toISOString(),
      paidAt: null,
      paidAfterExpiry: false,
      failureReason: null,
      createdAt: new Date().toISOString(),
    });
  });

  it('muestra Tu pedido al dar 1 tap, ajusta cantidades en barra y resumen antes de generar QR', async () => {
    const onChargeCreated = jest.fn();
    await renderWithProviders(<PosScreen onChargeCreated={onChargeCreated} />);

    await waitFor(() => {
      expect(screen.getByText('Tacos de bistec')).toBeOnTheScreen();
    });

    expect(screen.getByTestId('pos-checkout-summary')).toHaveTextContent(
      'Toca un producto para iniciar tu pedido'
    );

    await fireEvent.press(screen.getByTestId('pos-product-card-prod-1'));
    expect(screen.getByTestId('pos-checkout-summary')).toHaveTextContent('Tu pedido (1)');
    expect(screen.getByTestId('pos-checkout-total')).toHaveTextContent('$28.00');

    await fireEvent.press(screen.getByTestId('pos-active-plus-button'));
    expect(screen.getByTestId('pos-checkout-summary')).toHaveTextContent('Tu pedido (2)');
    expect(screen.getByTestId('pos-checkout-total')).toHaveTextContent('$56.00');

    await fireEvent.press(screen.getByTestId('pos-product-card-prod-2'));
    expect(screen.getByTestId('pos-checkout-summary')).toHaveTextContent('Tu pedido (3)');
    expect(screen.getByTestId('pos-checkout-total')).toHaveTextContent('$78.00');

    await fireEvent.press(screen.getByTestId('pos-checkout-qr-button'));
    expect(screen.getByTestId('pos-order-summary-modal')).toBeOnTheScreen();
    expect(screen.getByTestId('pos-summary-grand-total')).toHaveTextContent('$78.00 MXN');

    await fireEvent.press(screen.getByTestId('pos-summary-plus-prod-2'));
    expect(screen.getByTestId('pos-summary-grand-total')).toHaveTextContent('$100.00 MXN');

    await fireEvent.press(screen.getByTestId('pos-summary-modify-button'));
    expect(screen.queryByTestId('pos-order-summary-modal')).toBeNull();
    expect(screen.getByTestId('pos-checkout-summary')).toHaveTextContent('Tu pedido (4)');

    await fireEvent.press(screen.getByTestId('pos-checkout-qr-button'));
    await fireEvent.press(screen.getByTestId('pos-summary-generate-qr-button'));

    await waitFor(() => {
      expect(mockCreateCharge).toHaveBeenCalledWith(
        {
          items: [
            { productId: 'prod-1', quantity: 2 },
            { productId: 'prod-2', quantity: 2 },
          ],
        },
        expect.any(String)
      );
      expect(onChargeCreated).toHaveBeenCalledWith('charge-pos-1');
    });
  });

  it('permite crear producto con foto de cámara, descripción y categoría vinculada', async () => {
    (ImagePicker.launchCameraAsync as jest.Mock).mockResolvedValueOnce({
      canceled: false,
      assets: [
        {
          uri: 'file:///tmp/horchata.jpg',
          base64: 'ZmFrZQ==',
          mimeType: 'image/jpeg',
        },
      ],
    });

    await renderWithProviders(<PosScreen onChargeCreated={jest.fn()} />);

    await waitFor(() => {
      expect(screen.getByTestId('pos-add-product-button')).toBeOnTheScreen();
    });

    await fireEvent.press(screen.getByTestId('pos-add-product-button'));
    expect(screen.getByTestId('pos-product-form-modal')).toBeOnTheScreen();

    await fireEvent.press(screen.getByTestId('pos-form-camera-button'));
    await waitFor(() => {
      expect(screen.getByTestId('pos-form-image-preview')).toBeOnTheScreen();
    });

    await fireEvent.changeText(screen.getByTestId('pos-form-name-input'), 'Agua de horchata');
    await fireEvent.changeText(screen.getByTestId('pos-form-price-input'), '25');
    await fireEvent.changeText(
      screen.getByTestId('pos-form-description-input'),
      'Vaso grande con canela'
    );
    await fireEvent.press(screen.getByTestId('pos-form-category-chip-Bebidas'));
    await fireEvent.press(screen.getByTestId('pos-form-save-button'));

    await waitFor(() => {
      expect(mockCreateProduct).toHaveBeenCalledWith(
        'merchant-1',
        expect.objectContaining({
          name: 'Agua de horchata',
          priceCents: 2500,
          description: 'Vaso grande con canela',
          category: 'Bebidas',
          categoryId: 'cat-2',
          imageUri: 'file:///tmp/horchata.jpg',
        })
      );
      expect(screen.getByText('Agua de horchata')).toBeOnTheScreen();
    });
  });

  it('abre editar/eliminar productos con 2 taps y ofrece CRUD completo en pestaña Categorías', async () => {
    await renderWithProviders(<PosScreen onChargeCreated={jest.fn()} />);

    await waitFor(() => {
      expect(screen.getByText('Tacos de bistec')).toBeOnTheScreen();
    });

    // 2 taps en producto abren edición sin dejar cantidad en el pedido
    const tacosCard = screen.getByTestId('pos-product-card-prod-1');
    await fireEvent.press(tacosCard);
    await fireEvent.press(tacosCard);

    expect(screen.getByTestId('pos-product-form-modal')).toBeOnTheScreen();
    expect(screen.getByTestId('pos-checkout-summary')).toHaveTextContent(
      'Toca un producto para iniciar tu pedido'
    );

    await fireEvent.changeText(screen.getByTestId('pos-form-name-input'), 'Tacos especiales');
    await fireEvent.press(screen.getByTestId('pos-form-save-button'));

    await waitFor(() => {
      expect(screen.getByText('Tacos especiales')).toBeOnTheScreen();
    });

    // Ir a pestaña Categorías: se muestran cards de categorías con conteo de productos
    await fireEvent.press(screen.getByTestId('pos-tab-categories'));
    expect(screen.getByTestId('pos-category-card-cat-1')).toBeOnTheScreen();
    expect(screen.getByTestId('pos-category-card-cat-2')).toBeOnTheScreen();

    // Crear nueva categoría desde el botón +
    await fireEvent.press(screen.getByTestId('pos-add-category-button'));
    expect(screen.getByTestId('pos-category-form-modal')).toBeOnTheScreen();
    await fireEvent.changeText(screen.getByTestId('pos-category-form-name-input'), 'Postres');
    await fireEvent.changeText(
      screen.getByTestId('pos-category-form-description-input'),
      'Flan y arroz con leche'
    );
    await fireEvent.press(screen.getByTestId('pos-category-form-save-button'));

    await waitFor(() => {
      expect(mockCreateCategory).toHaveBeenCalledWith(
        'merchant-1',
        expect.objectContaining({
          name: 'Postres',
          description: 'Flan y arroz con leche',
        })
      );
      expect(screen.getByText('Postres')).toBeOnTheScreen();
    });

    // 2 taps sobre card de categoría abre edición y permite eliminar
    const postresCard = screen.getByTestId('pos-category-card-cat-3');
    await fireEvent.press(postresCard);
    await fireEvent.press(postresCard);
    expect(screen.getByTestId('pos-category-form-modal')).toBeOnTheScreen();
    await fireEvent.press(screen.getByTestId('pos-category-form-delete-button'));

    await waitFor(() => {
      expect(mockArchiveCategory).toHaveBeenCalledWith('cat-3');
      expect(screen.queryByTestId('pos-category-card-cat-3')).toBeNull();
    });

    // 1 tap sobre card de categoría filtra los productos de esa categoría
    await fireEvent.press(screen.getByTestId('pos-category-card-cat-2'));
    await waitFor(() => {
      expect(screen.getByTestId('pos-selected-category-title')).toHaveTextContent('Bebidas');
    });
    expect(screen.getByText('Refresco')).toBeOnTheScreen();
    expect(screen.queryByText('Tacos especiales')).toBeNull();
  });
});
