import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useAppTheme } from '@/hooks';

export interface SurfaceCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  padding?: 'sm' | 'md';
  testID?: string;
}

export function SurfaceCard({ children, style, padding = 'md', testID }: SurfaceCardProps) {
  const { tokens } = useAppTheme();

  return (
    <View
      testID={testID}
      style={[
        styles.card,
        tokens.elevations.xs,
        {
          backgroundColor: tokens.colors.surface,
          borderColor: tokens.colors.border,
          borderRadius: tokens.radii.lg,
          padding: padding === 'sm' ? tokens.spacing.sm : tokens.layout.cardPadding,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
  },
});
