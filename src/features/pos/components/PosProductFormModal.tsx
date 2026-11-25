import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { AppBottomSheet, AppButton, AppInput } from '@/components/ui';
import { env } from '@/config/env';
import { parseAmountInputToCents } from '@/features/payments/utils/parseAmountCents';
import { useAppTheme } from '@/hooks';
import type { PosProduct, PosProductDraft } from '../types';

export interface PosProductFormModalProps {
  visible: boolean;
  editingProduct: PosProduct | null;
  isSaving?: boolean;
  onClose: () => void;
  onSave: (draft: PosProductDraft, productId?: string) => void | Promise<void>;
  onDelete?: (productId: string) => void | Promise<void>;
}

function formatPriceForInput(priceCents: number): string {
  const whole = Math.floor(priceCents / 100);
  const cents = priceCents % 100;
  return cents === 0 ? String(whole) : `${whole}.${String(cents).padStart(2, '0')}`;
}

export function PosProductFormModal({
  visible,
  editingProduct,
  isSaving = false,
  onClose,
  onSave,
  onDelete,
}: PosProductFormModalProps) {
  const { tokens } = useAppTheme();
  const [name, setName] = useState(() => editingProduct?.name ?? '');
  const [priceText, setPriceText] = useState(() =>
    editingProduct ? formatPriceForInput(editingProduct.priceCents) : ''
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handlePriceChange = (text: string) => {
    const cleaned = text.replace(/[^0-9.]/g, '');
    const parts = cleaned.split('.');
    if (parts.length > 2) {
      return;
    }
    if (parts[1] && parts[1].length > 2) {
      return;
    }
    setPriceText(cleaned);
  };

  const handleSavePress = () => {
    const trimmedName = name.trim();
    if (trimmedName.length < 1 || trimmedName.length > 40) {
      setErrorMessage('Ingresa un nombre entre 1 y 40 caracteres.');
      return;
    }

    const priceCents = parseAmountInputToCents(priceText, env.maxChargeCents);
    if (priceCents < 100) {
      setErrorMessage('El precio mínimo es de $1.00 MXN.');
      return;
    }

    setErrorMessage(null);
    void onSave(
      {
        name: trimmedName,
        priceCents,
      },
      editingProduct?.id
    );
  };

  return (
    <AppBottomSheet
      visible={visible}
      onClose={onClose}
      title={editingProduct ? 'Editar producto o servicio' : 'Nuevo producto o servicio'}
      closeAccessibilityLabel="Cerrar formulario de producto o servicio"
      closeButtonTestID="pos-form-close-button"
      testID="pos-product-form-modal"
    >
      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={[styles.formFields, { gap: tokens.spacing.space4 }]}>
          <AppInput
            label="Nombre del producto o servicio"
            value={name}
            onChangeText={setName}
            maxLength={40}
            placeholder="Ej. Producto o servicio"
            testID="pos-form-name-input"
          />

          <AppInput
            label="Precio (MXN)"
            prefix="$"
            value={priceText}
            onChangeText={handlePriceChange}
            keyboardType="decimal-pad"
            placeholder="Ej. 25.00"
            testID="pos-form-price-input"
          />
        </View>

        {errorMessage ? (
          <Text
            testID="pos-form-error"
            style={[
              styles.errorText,
              {
                fontFamily: tokens.typography.families.medium,
                color: tokens.colors.error,
                marginTop: tokens.spacing.space3,
              },
            ]}
          >
            {errorMessage}
          </Text>
        ) : null}

        <View style={{ gap: tokens.spacing.space3, marginTop: tokens.spacing.space5 }}>
          <AppButton
            variant="primary"
            label={isSaving ? 'Guardando…' : editingProduct ? 'Guardar cambios' : 'Guardar'}
            loading={isSaving}
            disabled={isSaving}
            onPress={handleSavePress}
            testID="pos-form-save-button"
          />

          {editingProduct && onDelete ? (
            <AppButton
              variant="destructive"
              leftIcon="trash-2"
              label="Eliminar"
              disabled={isSaving}
              onPress={() => void onDelete(editingProduct.id)}
              testID="pos-form-delete-button"
            />
          ) : null}
        </View>
      </ScrollView>
    </AppBottomSheet>
  );
}

const styles = StyleSheet.create({
  formFields: {
    width: '100%',
  },
  errorText: {
    fontSize: 12,
    lineHeight: 17,
  },
});
