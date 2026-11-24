import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import * as ImagePicker from 'expo-image-picker';
import { AppProviders } from '@/components/layout';
import { createQueryClient } from '@/config/queryClient';
import { PosScreen } from '@/features/pos/components';

jest.mock('@react-native-vector-icons/ionicons', () => {
  const { createElement } = jest.requireActual<typeof import('react')>('react');
  const { Text } = jest.requireActual<typeof import('react-native')>('react-native');

  return {
    Ionicons: ({ name, testID }: { name: string; testID?: string }) =>
      createElement(Text, { testID: testID ?? `ionicon-${name}` }, name),
  };
});

jest.mock('react-native-confetti-cannon', () => {
  const { createElement } = jest.requireActual<typeof import('react')>('react');
  const { View } = jest.requireActual<typeof import('react-native')>('react-native');

  return function MockConfettiCannon({ testID }: { testID?: string }) {
    return createElement(View, { testID: testID ?? 'mock-confetti' });
  };
});

jest.mock('expo-image-picker', () => ({
  requestCameraPermissionsAsync: jest.fn(),
  launchCameraAsync: jest.fn(),
  requestMediaLibraryPermissionsAsync: jest.fn(),
  launchImageLibraryAsync: jest.fn(),
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

describe('PosScreen (Punto de venta)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('permite buscar rápido, agregar/quitar productos y cobrar en efectivo lanzando PaymentReceivedModal', async () => {
    const onClosePress = jest.fn();
    const onQrCheckoutPress = jest.fn();

    await renderWithProviders(
      <PosScreen onClosePress={onClosePress} onQrCheckoutPress={onQrCheckoutPress} />
    );

    expect(screen.getByText('Punto de venta')).toBeOnTheScreen();
    expect(screen.getByTestId('pos-storefront-illustration')).toBeOnTheScreen();
    expect(screen.getByTestId('pos-total-amount')).toHaveTextContent('$0.00');
    expect(screen.getByText('Agua 600ml')).toBeOnTheScreen();

    // Búsqueda rápida
    await fireEvent.changeText(screen.getByTestId('pos-search-input'), 'Refresco');
    expect(screen.getByText('Refresco 600ml')).toBeOnTheScreen();
    expect(screen.queryByText('Pan dulce')).toBeNull();

    // Agregar 1 refresco ($22)
    await fireEvent.press(screen.getByTestId('pos-product-card-prod_refresco_600'));
    expect(screen.getByTestId('pos-total-amount')).toHaveTextContent('$22.00');

    // Limpiar búsqueda y agregar Agua ($15) x2 y quitar 1
    await fireEvent.press(screen.getByTestId('pos-search-clear-button'));
    await fireEvent.press(screen.getByTestId('pos-product-card-prod_agua_600'));
    await fireEvent.press(screen.getByTestId('pos-product-plus-prod_agua_600'));
    expect(screen.getByTestId('pos-total-amount')).toHaveTextContent('$52.00');
    expect(screen.getByTestId('pos-units-count')).toHaveTextContent('3 art.');

    await fireEvent.press(screen.getByTestId('pos-product-minus-prod_agua_600'));
    expect(screen.getByTestId('pos-total-amount')).toHaveTextContent('$37.00');
    expect(screen.getByTestId('pos-units-count')).toHaveTextContent('2 art.');

    // Cobrar con QR pasa monto total y resumen
    await fireEvent.press(screen.getByTestId('pos-checkout-qr-button'));
    expect(onQrCheckoutPress).toHaveBeenCalledWith(3700, 'Venta POS (2 artículos)');

    // Cobrar en efectivo abre PaymentReceivedModal con confeti y limpia al aceptar
    await fireEvent.press(screen.getByTestId('pos-checkout-cash-button'));
    expect(screen.getByTestId('payment-received-modal')).toBeOnTheScreen();
    expect(screen.getByTestId('payment-received-amount')).toHaveTextContent('$37.00');
    expect(screen.getByTestId('payment-received-confetti')).toBeOnTheScreen();

    await fireEvent.press(screen.getByTestId('payment-received-accept-button'));
    expect(screen.queryByTestId('payment-received-modal')).toBeNull();
    expect(screen.getByTestId('pos-total-amount')).toHaveTextContent('$0.00');
  });

  it('permite agregar un producto con foto de cámara, editarlo y eliminarlo', async () => {
    const mockedPicker = ImagePicker as jest.Mocked<typeof ImagePicker>;
    mockedPicker.requestCameraPermissionsAsync.mockResolvedValue({
      granted: true,
      canAskAgain: true,
      expires: 'never',
      status: 'granted' as ImagePicker.PermissionStatus,
    });
    mockedPicker.launchCameraAsync.mockResolvedValue({
      canceled: false,
      assets: [
        {
          uri: 'file:///mock-product-photo.jpg',
          width: 400,
          height: 400,
          assetId: null,
          base64: null,
          duration: null,
          exif: null,
          fileName: 'photo.jpg',
          fileSize: 12345,
          mimeType: 'image/jpeg',
          type: 'image',
        },
      ],
    });

    await renderWithProviders(<PosScreen onClosePress={jest.fn()} onQrCheckoutPress={jest.fn()} />);

    // Abrir modal para agregar producto
    await fireEvent.press(screen.getByTestId('pos-add-product-button'));
    expect(screen.getByTestId('pos-product-form-modal')).toBeOnTheScreen();

    await fireEvent.press(screen.getByTestId('pos-form-camera-button'));
    await waitFor(() => {
      expect(screen.getByTestId('pos-form-photo-preview')).toBeOnTheScreen();
    });

    await fireEvent.changeText(screen.getByTestId('pos-form-name-input'), 'Horchata 500ml');
    await fireEvent.changeText(screen.getByTestId('pos-form-price-input'), '30');
    await fireEvent.press(screen.getByTestId('pos-form-save-button'));

    expect(screen.queryByTestId('pos-product-form-modal')).toBeNull();
    expect(screen.getByText('Horchata 500ml')).toBeOnTheScreen();

    // Eliminar un producto existente del catálogo
    await fireEvent.press(screen.getByTestId('pos-product-edit-prod_hielo'));
    expect(screen.getByTestId('pos-form-delete-button')).toBeOnTheScreen();
    await fireEvent.press(screen.getByTestId('pos-form-delete-button'));
    expect(screen.queryByText('Bolsa de hielo')).toBeNull();
  });
});
