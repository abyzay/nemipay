import React, { useMemo, useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { AppBottomSheet, AppButton, AppChip, AppInput } from '@/components/ui';
import { env } from '@/config/env';
import { parseAmountInputToCents } from '@/features/payments/utils/parseAmountCents';
import { useAppTheme } from '@/hooks';
import { DEFAULT_POS_CATEGORY, POS_CATEGORY_PRESETS } from '../services/productsService';
import type { PosCategory, PosProduct, PosProductDraft } from '../types';
import { PosImagePickerField, type PosPickedImage } from './PosImagePickerField';

export interface PosProductFormModalProps {
  visible: boolean;
  editingProduct: PosProduct | null;
  categories?: readonly PosCategory[];
  defaultCategory?: PosCategory | null;
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
  categories = [],
  defaultCategory = null,
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
  const [description, setDescription] = useState(() => editingProduct?.description ?? '');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(() => {
    if (editingProduct?.categoryId) return editingProduct.categoryId;
    if (editingProduct?.category) {
      const matched = categories.find(
        (cat) => cat.name.trim().toLowerCase() === editingProduct.category?.trim().toLowerCase()
      );
      if (matched) return matched.id;
    }
    if (!editingProduct && defaultCategory) return defaultCategory.id;
    return null;
  });
  const [categoryName, setCategoryName] = useState(() => {
    if (editingProduct?.category) return editingProduct.category;
    if (!editingProduct && defaultCategory) return defaultCategory.name;
    return categories[0]?.name ?? DEFAULT_POS_CATEGORY;
  });
  const [imageUri, setImageUri] = useState<string | null>(() => editingProduct?.imageUrl ?? null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imageMimeType, setImageMimeType] = useState<string | null>(null);
  const [permissionSettingsNeeded, setPermissionSettingsNeeded] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const chipOptions = useMemo(() => {
    if (categories.length > 0) {
      return categories.map((cat) => ({ id: cat.id, name: cat.name }));
    }
    return POS_CATEGORY_PRESETS.map((preset) => ({ id: null as string | null, name: preset }));
  }, [categories]);

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

  const handleImagePicked = (picked: PosPickedImage) => {
    setErrorMessage(null);
    setPermissionSettingsNeeded(false);
    setImageUri(picked.uri);
    setImageBase64(picked.base64);
    setImageMimeType(picked.mimeType);
  };

  const handleRemoveImage = () => {
    setImageUri(null);
    setImageBase64(null);
    setImageMimeType(null);
  };

  const handleSelectCategoryChip = (option: { id: string | null; name: string }) => {
    setSelectedCategoryId(option.id);
    setCategoryName(option.name);
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

    const matchedCategory = categories.find(
      (cat) =>
        cat.id === selectedCategoryId ||
        cat.name.toLowerCase() === categoryName.trim().toLowerCase()
    );
    const resolvedCategoryName =
      matchedCategory?.name ?? (categoryName.trim() || DEFAULT_POS_CATEGORY);
    if (resolvedCategoryName.length > 32) {
      setErrorMessage('La categoría debe tener máximo 32 caracteres.');
      return;
    }

    const trimmedDescription = description.trim();
    if (trimmedDescription.length > 160) {
      setErrorMessage('La descripción debe tener máximo 160 caracteres.');
      return;
    }

    setErrorMessage(null);
    void onSave(
      {
        name: trimmedName,
        priceCents,
        description: trimmedDescription || null,
        category: resolvedCategoryName,
        categoryId: matchedCategory?.id ?? selectedCategoryId ?? null,
        imageUri,
        imageBase64,
        imageMimeType,
      },
      editingProduct?.id
    );
  };

  return (
    <AppBottomSheet
      visible={visible}
      onClose={onClose}
      title={editingProduct ? 'Editar producto' : 'Nuevo producto'}
      closeAccessibilityLabel="Cerrar formulario de producto"
      closeButtonTestID="pos-form-close-button"
      testID="pos-product-form-modal"
    >
      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={[styles.formFields, { gap: tokens.spacing.space4 }]}>
          <PosImagePickerField
            label="Imagen del producto"
            imageUri={imageUri}
            disabled={isSaving}
            testIDPrefix="pos-form"
            onImagePicked={handleImagePicked}
            onRemoveImage={handleRemoveImage}
            onPermissionError={(msg, needsSettings) => {
              setErrorMessage(msg);
              setPermissionSettingsNeeded(needsSettings);
            }}
          />

          <AppInput
            label="Nombre"
            value={name}
            onChangeText={setName}
            maxLength={40}
            placeholder="Ej. Tacos de bistec"
            testID="pos-form-name-input"
          />

          <AppInput
            label="Precio (MXN)"
            prefix="$"
            value={priceText}
            onChangeText={handlePriceChange}
            keyboardType="decimal-pad"
            placeholder="Ej. 28.00"
            testID="pos-form-price-input"
          />

          <View>
            <Text
              style={[
                styles.fieldLabel,
                {
                  fontFamily: tokens.typography.families.semiBold,
                  color: tokens.colors.gray[700],
                  marginBottom: tokens.spacing.space1 + 2,
                },
              ]}
            >
              Descripción (opcional)
            </Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              maxLength={160}
              multiline
              numberOfLines={2}
              placeholder="Ej. Tortilla recién hecha con cebolla y cilantro"
              placeholderTextColor={tokens.colors.textMuted}
              selectionColor={tokens.colors.primary}
              testID="pos-form-description-input"
              style={[
                styles.descriptionInput,
                {
                  fontFamily: tokens.typography.families.regular,
                  color: tokens.colors.textPrimary,
                  backgroundColor: tokens.colors.background,
                  borderColor: tokens.colors.border,
                  borderRadius: tokens.radius.radiusInput,
                  paddingHorizontal: tokens.spacing.space4,
                  paddingVertical: tokens.spacing.space3,
                },
              ]}
            />
          </View>

          <View style={{ gap: tokens.spacing.space2 }}>
            <Text
              style={[
                styles.fieldLabel,
                {
                  fontFamily: tokens.typography.families.semiBold,
                  color: tokens.colors.gray[700],
                },
              ]}
            >
              Categoría
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={[styles.categoryChipsRow, { gap: tokens.spacing.space2 }]}
            >
              {chipOptions.map((option) => {
                const isSelected =
                  (option.id !== null && option.id === selectedCategoryId) ||
                  categoryName.trim().toLowerCase() === option.name.toLowerCase();
                return (
                  <AppChip
                    key={option.id ?? option.name}
                    label={option.name}
                    selected={isSelected}
                    onPress={() => handleSelectCategoryChip(option)}
                    testID={`pos-form-category-chip-${option.name}`}
                  />
                );
              })}
            </ScrollView>
          </View>
        </View>

        {errorMessage ? (
          <View style={[styles.errorBox, { marginTop: tokens.spacing.space3 }]}>
            <Text
              testID="pos-form-error"
              style={[
                styles.errorText,
                {
                  fontFamily: tokens.typography.families.medium,
                  color: tokens.colors.error,
                },
              ]}
            >
              {errorMessage}
            </Text>
            {permissionSettingsNeeded ? (
              <Pressable
                accessibilityRole="button"
                onPress={() => void Linking.openSettings()}
                style={{ marginTop: 4 }}
              >
                <Text
                  style={[
                    styles.settingsLink,
                    {
                      fontFamily: tokens.typography.families.semiBold,
                      color: tokens.colors.primary,
                    },
                  ]}
                >
                  Abrir configuración
                </Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}

        <View
          style={{
            gap: tokens.spacing.space3,
            marginTop: tokens.spacing.space5,
            paddingBottom: tokens.spacing.space2,
          }}
        >
          <AppButton
            variant="primary"
            label={
              isSaving ? 'Guardando…' : editingProduct ? 'Guardar cambios' : 'Guardar producto'
            }
            loading={isSaving}
            disabled={isSaving}
            onPress={handleSavePress}
            testID="pos-form-save-button"
          />

          {editingProduct && onDelete ? (
            <AppButton
              variant="destructive"
              leftIcon="trash-2"
              label="Eliminar producto"
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
  fieldLabel: {
    fontSize: 13,
    lineHeight: 18,
  },
  descriptionInput: {
    minHeight: 74,
    borderWidth: 1,
    fontSize: 15,
    lineHeight: 20,
    textAlignVertical: 'top',
  },
  categoryChipsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  errorBox: {
    width: '100%',
  },
  errorText: {
    fontSize: 12,
    lineHeight: 17,
  },
  settingsLink: {
    fontSize: 12,
    lineHeight: 16,
    textDecorationLine: 'underline',
  },
});
