import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useAppTheme } from '@/hooks';

export interface UserAvatarProps {
  initials: string;
  size?: number;
  accessibilityLabel?: string;
  testID?: string;
}

export function UserAvatar({
  initials,
  size = 48,
  accessibilityLabel = 'Avatar del comercio',
  testID,
}: UserAvatarProps) {
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
          borderRadius: tokens.radii.full,
          backgroundColor: tokens.colors.secondary,
          borderColor: tokens.colors.border,
        },
      ]}
    >
      <Text
        style={[
          styles.initials,
          {
            fontFamily: tokens.typography.families.bold,
            fontSize,
            color: tokens.colors.primaryDark,
          },
        ]}
      >
        {initials}
      </Text>
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
