import React from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { Image } from 'expo-image';
import { useAppTheme } from '@/hooks';

export interface AppAvatarProps {
  initials: string;
  imageUri?: string;
  size?: number;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export function AppAvatar({
  initials,
  imageUri,
  size = 48,
  accessibilityLabel = 'Avatar del comercio',
  style,
  testID,
}: AppAvatarProps) {
  const { tokens } = useAppTheme();
  const fontSize = Math.round(size * 0.36);

  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel}
      testID={testID}
      style={[
        styles.avatar,
        {
          width: size,
          height: size,
          borderRadius: tokens.radius.radiusFull,
          backgroundColor: tokens.colors.lavender,
          borderColor: tokens.colors.lavenderBorder,
        },
        style,
      ]}
    >
      {imageUri ? (
        <Image
          source={{ uri: imageUri }}
          style={{
            width: size,
            height: size,
            borderRadius: tokens.radius.radiusFull,
          }}
          contentFit="cover"
        />
      ) : (
        <Text
          style={[
            styles.initials,
            {
              fontFamily: tokens.typography.families.bold,
              fontSize,
              color: tokens.colors.primary,
            },
          ]}
        >
          {initials}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  initials: {
    letterSpacing: 0.4,
  },
});
