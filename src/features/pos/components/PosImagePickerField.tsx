import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { AppIcon } from '@/components/ui';
import { useAppTheme } from '@/hooks';

export interface PosPickedImage {
  uri: string;
  base64: string | null;
  mimeType: string | null;
}

export interface PosImagePickerFieldProps {
  label: string;
  imageUri: string | null;
  disabled?: boolean;
  testIDPrefix: string;
  onImagePicked: (image: PosPickedImage) => void;
  onRemoveImage: () => void;
  onPermissionError: (message: string, needsSettings: boolean) => void;
}

export function PosImagePickerField({
  label,
  imageUri,
  disabled = false,
  testIDPrefix,
  onImagePicked,
  onRemoveImage,
  onPermissionError,
}: PosImagePickerFieldProps) {
  const { tokens } = useAppTheme();

  const handleTakePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      onPermissionError('Activa el permiso de cámara para tomar la foto.', !permission.canAskAgain);
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      onImagePicked({
        uri: asset.uri,
        base64: asset.base64 ?? null,
        mimeType: asset.mimeType ?? 'image/jpeg',
      });
    }
  };

  const handlePickFromGallery = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      onPermissionError(
        'Activa el permiso de fotos para elegir una imagen de tu galería.',
        !permission.canAskAgain
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      onImagePicked({
        uri: asset.uri,
        base64: asset.base64 ?? null,
        mimeType: asset.mimeType ?? 'image/jpeg',
      });
    }
  };

  return (
    <View style={styles.photoSection}>
      <View
        style={[
          styles.photoPreviewBox,
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
            style={styles.photoPreviewImage}
            resizeMode="cover"
            testID={`${testIDPrefix}-image-preview`}
          />
        ) : (
          <View style={styles.photoEmptyPlaceholder}>
            <AppIcon name="Image" size={26} color={tokens.colors.textMuted} />
            <Text
              style={[
                styles.photoEmptyLabel,
                {
                  fontFamily: tokens.typography.families.medium,
                  color: tokens.colors.textMuted,
                },
              ]}
            >
              Sin foto
            </Text>
          </View>
        )}
      </View>

      <View style={[styles.photoActions, { gap: tokens.spacing.space2 }]}>
        <Text
          style={[
            styles.fieldLabel,
            {
              fontFamily: tokens.typography.families.semiBold,
              color: tokens.colors.gray[700],
            },
          ]}
        >
          {label}
        </Text>

        <View style={[styles.photoButtonsRow, { gap: tokens.spacing.space2 }]}>
          <Pressable
            accessibilityRole="button"
            onPress={() => void handleTakePhoto()}
            disabled={disabled}
            testID={`${testIDPrefix}-camera-button`}
            style={({ pressed }) => [
              styles.photoActionPill,
              {
                backgroundColor: pressed ? tokens.colors.lavenderBorder : tokens.colors.lavender,
                borderRadius: tokens.radius.radiusMD,
              },
            ]}
          >
            <AppIcon name="camera-outline" size={16} color={tokens.colors.primary} />
            <Text
              style={[
                styles.photoActionText,
                {
                  fontFamily: tokens.typography.families.semiBold,
                  color: tokens.colors.primary,
                },
              ]}
            >
              Tomar foto
            </Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            onPress={() => void handlePickFromGallery()}
            disabled={disabled}
            testID={`${testIDPrefix}-gallery-button`}
            style={({ pressed }) => [
              styles.photoActionPill,
              {
                backgroundColor: pressed
                  ? tokens.colors.lavenderSoft
                  : tokens.colors.surfaceSecondary,
                borderRadius: tokens.radius.radiusMD,
              },
            ]}
          >
            <AppIcon name="Image" size={16} color={tokens.colors.textPrimary} />
            <Text
              style={[
                styles.photoActionText,
                {
                  fontFamily: tokens.typography.families.semiBold,
                  color: tokens.colors.textPrimary,
                },
              ]}
            >
              Galería
            </Text>
          </Pressable>
        </View>

        <Text
          style={[
            styles.webpHint,
            {
              fontFamily: tokens.typography.families.regular,
              color: tokens.colors.textSecondary,
            },
          ]}
        >
          Se comprime en WebP al guardar
        </Text>

        {imageUri ? (
          <Pressable
            accessibilityRole="button"
            onPress={onRemoveImage}
            disabled={disabled}
            testID={`${testIDPrefix}-remove-image-button`}
            style={styles.removePhotoLink}
          >
            <AppIcon name="close" size={14} color={tokens.colors.error} />
            <Text
              style={[
                styles.removePhotoText,
                {
                  fontFamily: tokens.typography.families.medium,
                  color: tokens.colors.error,
                },
              ]}
            >
              Quitar foto
            </Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  photoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  photoPreviewBox: {
    width: 88,
    height: 88,
    borderWidth: 1,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoPreviewImage: {
    width: '100%',
    height: '100%',
  },
  photoEmptyPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  photoEmptyLabel: {
    fontSize: 11,
    lineHeight: 14,
  },
  photoActions: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 13,
    lineHeight: 18,
  },
  photoButtonsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  photoActionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  photoActionText: {
    fontSize: 13,
    lineHeight: 17,
  },
  webpHint: {
    fontSize: 11,
    lineHeight: 14,
  },
  removePhotoLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    paddingVertical: 2,
  },
  removePhotoText: {
    fontSize: 12,
    lineHeight: 16,
  },
});
