import React, { useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { AppButton, AppIcon, SurfaceCard } from '@/components/ui';
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
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={[styles.backdrop, { backgroundColor: tokens.colors.primaryDark }]}
      >
        <Pressable
          accessibilityLabel="Cerrar formulario de producto"
          style={StyleSheet.absoluteFill}
          onPress={onClose}
        />

        <SurfaceCard style={styles.card} testID="pos-product-form-modal">
          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <View style={styles.modalHeader}>
              <Text
                style={[
                  styles.modalTitle,
                  {
                    fontFamily: tokens.typography.families.bold,
                    color: tokens.colors.textPrimary,
                  },
                ]}
              >
                {editingProduct ? 'Editar producto' : 'Nuevo producto'}
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Cerrar"
                onPress={onClose}
                hitSlop={8}
                testID="pos-form-close-button"
              >
                <AppIcon name="close" size={22} color={tokens.colors.textSecondary} />
              </Pressable>
            </View>

            <View
              style={[styles.photoRow, { gap: tokens.spacing.sm, marginTop: tokens.spacing.sm }]}
            >
              <View
                style={[
                  styles.photoPreview,
                  {
                    backgroundColor: tokens.colors.background,
                    borderColor: tokens.colors.border,
                    borderRadius: tokens.radii.lg,
                  },
                ]}
              >
                {imageUri ? (
                  <Image
                    source={{ uri: imageUri }}
                    style={[styles.previewImage, { borderRadius: tokens.radii.lg }]}
                    testID="pos-form-photo-preview"
                  />
                ) : (
                  <AppIcon name="camera-outline" size={26} color={tokens.colors.textSecondary} />
                )}
              </View>

              <View style={[styles.photoButtons, { gap: tokens.spacing.xs }]}>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => void handleTakePhoto()}
                  testID="pos-form-camera-button"
                  style={[
                    styles.photoBtn,
                    {
                      backgroundColor: tokens.colors.secondary,
                      borderColor: tokens.colors.border,
                      borderRadius: tokens.radii.md,
                      paddingHorizontal: tokens.spacing.sm,
                      gap: tokens.spacing.xs,
                    },
                  ]}
                >
                  <AppIcon name="camera-outline" size={18} color={tokens.colors.primaryDark} />
                  <Text
                    style={[
                      styles.photoBtnText,
                      {
                        fontFamily: tokens.typography.families.semiBold,
                        color: tokens.colors.primaryDark,
                      },
                    ]}
                  >
                    Tomar foto
                  </Text>
                </Pressable>

                <View style={[styles.secondaryPhotoRow, { gap: tokens.spacing.xs }]}>
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => void handlePickFromLibrary()}
                    testID="pos-form-gallery-button"
                    style={[
                      styles.smallPhotoBtn,
                      {
                        backgroundColor: tokens.colors.background,
                        borderColor: tokens.colors.border,
                        borderRadius: tokens.radii.md,
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
                          backgroundColor: tokens.colors.background,
                          borderColor: tokens.colors.border,
                          borderRadius: tokens.radii.md,
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
              style={[styles.formFields, { gap: tokens.spacing.sm, marginTop: tokens.spacing.md }]}
            >
              <View style={{ gap: 4 }}>
                <Text
                  style={[
                    styles.label,
                    {
                      fontFamily: tokens.typography.families.semiBold,
                      color: tokens.colors.textSecondary,
                    },
                  ]}
                >
                  Nombre del producto
                </Text>
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder="Ej. Horchata 500ml"
                  placeholderTextColor={tokens.colors.textSecondary}
                  testID="pos-form-name-input"
                  style={[
                    styles.input,
                    {
                      backgroundColor: tokens.colors.background,
                      borderColor: tokens.colors.border,
                      borderRadius: tokens.radii.md,
                      paddingHorizontal: tokens.spacing.sm,
                      fontFamily: tokens.typography.families.medium,
                      color: tokens.colors.textPrimary,
                    },
                  ]}
                />
              </View>

              <View style={{ gap: 4 }}>
                <Text
                  style={[
                    styles.label,
                    {
                      fontFamily: tokens.typography.families.semiBold,
                      color: tokens.colors.textSecondary,
                    },
                  ]}
                >
                  Precio (MXN)
                </Text>
                <TextInput
                  value={priceText}
                  onChangeText={setPriceText}
                  keyboardType="decimal-pad"
                  placeholder="Ej. 25.00"
                  placeholderTextColor={tokens.colors.textSecondary}
                  testID="pos-form-price-input"
                  style={[
                    styles.input,
                    {
                      backgroundColor: tokens.colors.background,
                      borderColor: tokens.colors.border,
                      borderRadius: tokens.radii.md,
                      paddingHorizontal: tokens.spacing.sm,
                      fontFamily: tokens.typography.families.bold,
                      color: tokens.colors.textPrimary,
                    },
                  ]}
                />
              </View>

              <View style={{ gap: 6 }}>
                <Text
                  style={[
                    styles.label,
                    {
                      fontFamily: tokens.typography.families.semiBold,
                      color: tokens.colors.textSecondary,
                    },
                  ]}
                >
                  Categoría
                </Text>
                <View style={[styles.categoryWrap, { gap: tokens.spacing.xs }]}>
                  {POS_CATEGORIES.map((option) => {
                    const selected = category === option;
                    return (
                      <Pressable
                        key={option}
                        accessibilityRole="button"
                        onPress={() => setCategory(option)}
                        testID={`pos-form-category-${option}`}
                        style={[
                          styles.categoryChip,
                          {
                            borderRadius: tokens.radii.full,
                            borderColor: selected ? tokens.colors.primary : tokens.colors.border,
                            backgroundColor: selected
                              ? tokens.colors.primary
                              : tokens.colors.background,
                            paddingHorizontal: tokens.spacing.sm,
                            paddingVertical: tokens.spacing.xxs + 2,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.categoryChipText,
                            {
                              fontFamily: tokens.typography.families.semiBold,
                              color: selected
                                ? tokens.colors.onPrimary
                                : tokens.colors.textSecondary,
                            },
                          ]}
                        >
                          {option}
                        </Text>
                      </Pressable>
                    );
                  })}
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
                    marginTop: tokens.spacing.sm,
                  },
                ]}
              >
                {errorMessage}
              </Text>
            ) : null}

            <View style={{ gap: tokens.spacing.xs, marginTop: tokens.spacing.md }}>
              <AppButton
                variant="primary"
                label={editingProduct ? 'Guardar cambios' : 'Agregar al catálogo'}
                onPress={handleSavePress}
                testID="pos-form-save-button"
              />

              {editingProduct && onDelete ? (
                <Pressable
                  accessibilityRole="button"
                  onPress={() => onDelete(editingProduct.id)}
                  testID="pos-form-delete-button"
                  style={[
                    styles.deleteButton,
                    {
                      borderColor: tokens.colors.error,
                      borderRadius: tokens.radii.full,
                    },
                  ]}
                >
                  <AppIcon name="trash-outline" size={18} color={tokens.colors.error} />
                  <Text
                    style={[
                      styles.deleteText,
                      {
                        fontFamily: tokens.typography.families.semiBold,
                        color: tokens.colors.error,
                      },
                    ]}
                  >
                    Eliminar producto
                  </Text>
                </Pressable>
              ) : null}
            </View>
          </ScrollView>
        </SurfaceCard>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    opacity: 0.98,
  },
  card: {
    width: '100%',
    maxHeight: '88%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalTitle: {
    fontSize: 18,
    lineHeight: 24,
  },
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
    borderWidth: 1,
    minHeight: 38,
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
    minHeight: 30,
  },
  smallPhotoText: {
    fontSize: 12,
    lineHeight: 16,
  },
  formFields: {
    width: '100%',
  },
  label: {
    fontSize: 12,
    lineHeight: 16,
  },
  input: {
    borderWidth: 1,
    minHeight: 44,
    fontSize: 15,
    lineHeight: 20,
    paddingVertical: 10,
  },
  categoryWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  categoryChip: {
    borderWidth: 1,
  },
  categoryChipText: {
    fontSize: 12,
    lineHeight: 16,
  },
  errorText: {
    fontSize: 12,
    lineHeight: 17,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 46,
    borderWidth: 1.5,
    gap: 6,
  },
  deleteText: {
    fontSize: 14,
    lineHeight: 20,
  },
});
