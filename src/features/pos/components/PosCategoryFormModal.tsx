import React, { useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { AppBottomSheet, AppButton, AppInput } from '@/components/ui';
import { useAppTheme } from '@/hooks';
import type { PosCategory, PosCategoryDraft } from '../types';
import { PosImagePickerField, type PosPickedImage } from './PosImagePickerField';

export interface PosCategoryFormModalProps {
  visible: boolean;
  editingCategory: PosCategory | null;
  isSaving?: boolean;
  onClose: () => void;
  onSave: (draft: PosCategoryDraft, categoryId?: string) => void | Promise<void>;
  onDelete?: (categoryId: string) => void | Promise<void>;
}

export function PosCategoryFormModal({
  visible,
  editingCategory,
  isSaving = false,
  onClose,
  onSave,
  onDelete,
}: PosCategoryFormModalProps) {
  const { tokens } = useAppTheme();
  const [name, setName] = useState(() => editingCategory?.name ?? '');
  const [description, setDescription] = useState(() => editingCategory?.description ?? '');
  const [imageUri, setImageUri] = useState<string | null>(() => editingCategory?.imageUrl ?? null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imageMimeType, setImageMimeType] = useState<string | null>(null);
  const [permissionSettingsNeeded, setPermissionSettingsNeeded] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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

  const handleSavePress = () => {
    const trimmedName = name.trim();
    if (trimmedName.length < 1 || trimmedName.length > 32) {
      setErrorMessage('Ingresa un nombre de categoría entre 1 y 32 caracteres.');
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
        description: trimmedDescription || null,
        imageUri,
        imageBase64,
        imageMimeType,
      },
      editingCategory?.id
    );
  };

  return (
    <AppBottomSheet
      visible={visible}
      onClose={onClose}
      title={editingCategory ? 'Editar categoría' : 'Nueva categoría'}
      closeAccessibilityLabel="Cerrar formulario de categoría"
      closeButtonTestID="pos-category-form-close-button"
      testID="pos-category-form-modal"
    >
      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={[styles.formFields, { gap: tokens.spacing.space4 }]}>
          <PosImagePickerField
            label="Imagen de la categoría"
            imageUri={imageUri}
            disabled={isSaving}
            testIDPrefix="pos-category-form"
            onImagePicked={handleImagePicked}
            onRemoveImage={handleRemoveImage}
            onPermissionError={(msg, needsSettings) => {
              setErrorMessage(msg);
              setPermissionSettingsNeeded(needsSettings);
            }}
          />

          <AppInput
            label="Nombre de la categoría"
            value={name}
            onChangeText={setName}
            maxLength={32}
            placeholder="Ej. Tacos, Bebidas, Postres"
            testID="pos-category-form-name-input"
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
              placeholder="Ej. Especialidades al carbón y a la plancha"
              placeholderTextColor={tokens.colors.textMuted}
              selectionColor={tokens.colors.primary}
              testID="pos-category-form-description-input"
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
        </View>

        {errorMessage ? (
          <View style={[styles.errorBox, { marginTop: tokens.spacing.space3 }]}>
            <Text
              testID="pos-category-form-error"
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
              isSaving ? 'Guardando…' : editingCategory ? 'Guardar cambios' : 'Guardar categoría'
            }
            loading={isSaving}
            disabled={isSaving}
            onPress={handleSavePress}
            testID="pos-category-form-save-button"
          />

          {editingCategory && onDelete ? (
            <AppButton
              variant="destructive"
              leftIcon="trash-2"
              label="Eliminar categoría"
              disabled={isSaving}
              onPress={() => void onDelete(editingCategory.id)}
              testID="pos-category-form-delete-button"
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
