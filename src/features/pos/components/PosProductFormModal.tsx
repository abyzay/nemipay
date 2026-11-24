import React, { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { AppBottomSheet, AppButton, AppChip, AppIcon, AppInput } from '@/components/ui';
import { useAppTheme } from '@/hooks';
import { POS_CATEGORIES, type PosCategory, type PosProduct, type PosProductDraft } from '../types';

export interface PosProductFormModalProps {
  visible: boolean;
  editingProduct: PosProduct | null;
  initialName?: string;
  onClose: () => void;
  onSave: (draft: PosProductDraft, productId?: string) => void;
  onDelete?: (productId: string) => void;
}

export function PosProductFormModal({
  visible,
  editingProduct,
  initialName = '',
  onClose,
  onSave,
  onDelete,
}: PosProductFormModalProps) {
  const { tokens } = useAppTheme();
  const [name, setName] = useState(() => editingProduct?.name ?? initialName);
  const [priceText, setPriceText] = useState(() =>
    editingProduct ? (editingProduct.priceCents / 100).toFixed(2).replace(/\.00$/, '') : ''
  );
  const [category, setCategory] = useState<PosCategory>(
    () => editingProduct?.category ?? 'Bebidas'
  );
  const [imageUri, setImageUri] = useState<string | undefined>(() => editingProduct?.imageUri);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleTakePhoto = async () => {
    setErrorMessage(null);
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      setErrorMessage('Necesitamos permiso de cámara para tomar la foto del producto.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled && result.assets[0]?.uri) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handlePickFromLibrary = async () => {
    setErrorMessage(null);
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setErrorMessage('Necesitamos permiso de galería para elegir una imagen.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled && result.assets[0]?.uri) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleSavePress = () => {
    const trimmedName = name.trim();
    if (trimmedName.length < 2) {
      setErrorMessage('Ingresa un nombre de al menos 2 caracteres.');
      return;
    }

    const numericPrice = Number.parseFloat(priceText.replace(/[^0-9.]/g, ''));
    if (!Number.isFinite(numericPrice) || numericPrice <= 0) {
      setErrorMessage('Ingresa un precio válido mayor a $0.00.');
      return;
    }

    onSave(
      {
        name: trimmedName,
        priceCents: Math.round(numericPrice * 100),
        category,
        imageUri,
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
        <View style={[styles.photoRow, { gap: tokens.spacing.space3 }]}>
          <View
            style={[
              styles.photoPreview,
              {
                backgroundColor: tokens.colors.surface,
                borderColor: tokens.colors.border,
                borderRadius: tokens.radius.radiusCard,
              },
            ]}
          >
            {imageUri ? (
              <Image
                source={{ uri: imageUri }}
                style={[styles.previewImage, { borderRadius: tokens.radius.radiusCard }]}
                testID="pos-form-photo-preview"
              />
            ) : (
              <AppIcon name="camera-outline" size={24} color={tokens.colors.textSecondary} />
            )}
          </View>

          <View style={[styles.photoButtons, { gap: tokens.spacing.space2 }]}>
            <Pressable
              accessibilityRole="button"
              onPress={() => void handleTakePhoto()}
              testID="pos-form-camera-button"
              style={[
                styles.photoBtn,
                {
                  backgroundColor: tokens.colors.lavender,
                  borderRadius: tokens.radius.radiusMD,
                  paddingHorizontal: tokens.spacing.space3,
                  gap: tokens.spacing.space2,
                },
              ]}
            >
              <AppIcon name="camera-outline" size={18} color={tokens.colors.primary} />
              <Text
                style={[
                  styles.photoBtnText,
                  {
                    fontFamily: tokens.typography.families.semiBold,
                    color: tokens.colors.primary,
                  },
                ]}
              >
                Tomar foto
              </Text>
            </Pressable>

            <View style={[styles.secondaryPhotoRow, { gap: tokens.spacing.space2 }]}>
              <Pressable
                accessibilityRole="button"
                onPress={() => void handlePickFromLibrary()}
                testID="pos-form-gallery-button"
                style={[
                  styles.smallPhotoBtn,
                  {
                    backgroundColor: tokens.colors.surface,
                    borderColor: tokens.colors.border,
                    borderRadius: tokens.radius.radiusMD,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.smallPhotoText,
                    {
                      fontFamily: tokens.typography.families.medium,
                      color: tokens.colors.textPrimary,
                    },
                  ]}
                >
                  Galería
                </Text>
              </Pressable>

              {imageUri ? (
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setImageUri(undefined)}
                  testID="pos-form-remove-photo-button"
                  style={[
                    styles.smallPhotoBtn,
                    {
                      backgroundColor: tokens.colors.errorLight,
                      borderColor: tokens.colors.errorLight,
                      borderRadius: tokens.radius.radiusMD,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.smallPhotoText,
                      {
                        fontFamily: tokens.typography.families.medium,
                        color: tokens.colors.error,
                      },
                    ]}
                  >
                    Quitar
                  </Text>
                </Pressable>
              ) : null}
            </View>
          </View>
        </View>

        <View
          style={[
            styles.formFields,
            { gap: tokens.spacing.space4, marginTop: tokens.spacing.space4 },
          ]}
        >
          <AppInput
            label="Nombre del producto"
            value={name}
            onChangeText={setName}
            placeholder="Ej. Horchata 500ml"
            testID="pos-form-name-input"
          />

          <AppInput
            label="Precio (MXN)"
            prefix="$"
            value={priceText}
            onChangeText={setPriceText}
            keyboardType="decimal-pad"
            placeholder="Ej. 25.00"
            testID="pos-form-price-input"
          />

          <View style={{ gap: tokens.spacing.space2 }}>
            <Text
              style={[
                styles.label,
                {
                  fontFamily: tokens.typography.families.semiBold,
                  color: tokens.colors.gray[700],
                },
              ]}
            >
              Categoría
            </Text>
            <View style={[styles.categoryWrap, { gap: tokens.spacing.space2 }]}>
              {POS_CATEGORIES.map((option) => (
                <AppChip
                  key={option}
                  label={option}
                  selected={category === option}
                  onPress={() => setCategory(option)}
                  testID={`pos-form-category-${option}`}
                />
              ))}
            </View>
          </View>
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
            label={editingProduct ? 'Guardar cambios' : 'Agregar al catálogo'}
            onPress={handleSavePress}
            testID="pos-form-save-button"
          />

          {editingProduct && onDelete ? (
            <AppButton
              variant="destructive"
              leftIcon="trash-2"
              label="Eliminar producto"
              onPress={() => onDelete(editingProduct.id)}
              testID="pos-form-delete-button"
            />
          ) : null}
        </View>
      </ScrollView>
    </AppBottomSheet>
  );
}

const styles = StyleSheet.create({
  photoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  photoPreview: {
    width: 72,
    height: 72,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  photoButtons: {
    flex: 1,
  },
  photoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 40,
  },
  photoBtnText: {
    fontSize: 13,
    lineHeight: 18,
  },
  secondaryPhotoRow: {
    flexDirection: 'row',
  },
  smallPhotoBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    minHeight: 34,
  },
  smallPhotoText: {
    fontSize: 12,
    lineHeight: 16,
  },
  formFields: {
    width: '100%',
  },
  label: {
    fontSize: 13,
    lineHeight: 18,
  },
  categoryWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  errorText: {
    fontSize: 12,
    lineHeight: 17,
  },
});
