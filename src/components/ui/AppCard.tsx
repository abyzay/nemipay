import React from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useAppTheme } from '@/hooks';

export type AppCardVariant = 'standard' | 'secondary' | 'selected';
export type AppCardPadding = 'none' | 'sm' | 'md' | 'lg';

export interface AppCardProps {
  children: React.ReactNode;
  variant?: AppCardVariant;
  padding?: AppCardPadding;
  elevated?: boolean;
  onPress?: () => void;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export function AppCard({
  children,
  variant = 'standard',
  padding = 'md',
  elevated = true,
  onPress,
  accessibilityLabel,
  style,
  testID,
}: AppCardProps) {
  const { tokens } = useAppTheme();

  const resolvedPadding =
    padding === 'none'
      ? 0
      : padding === 'sm'
        ? tokens.spacing.space3
        : padding === 'lg'
          ? tokens.spacing.space5
          : tokens.layout.cardPadding;

  const variantStyle: ViewStyle =
    variant === 'secondary'
      ? {
          backgroundColor: tokens.colors.surface,
          borderRadius: tokens.radius.radiusButton,
          borderWidth: 0,
        }
      : variant === 'selected'
        ? {
            backgroundColor: tokens.colors.lavender,
            borderRadius: tokens.radius.radiusCard,
            borderWidth: 1,
            borderColor: tokens.colors.lavenderBorder,
          }
        : {
            backgroundColor: tokens.colors.surfaceCard,
            borderRadius: tokens.radius.radiusCard,
            borderWidth: 1,
            borderColor: tokens.colors.border,
          };

  const shadowStyle =
    variant === 'standard' && elevated ? tokens.shadows.card : tokens.shadows.none;

  if (onPress) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        onPress={onPress}
        testID={testID}
        style={({ pressed }) => [
          styles.card,
          shadowStyle,
          variantStyle,
          {
            padding: resolvedPadding,
            opacity: pressed ? 0.94 : 1,
            transform: [{ scale: pressed ? 0.985 : 1 }],
          },
          style,
        ]}
      >
        {children}
      </Pressable>
    );
  }

  return (
    <View
      testID={testID}
      style={[
        styles.card,
        shadowStyle,
        variantStyle,
        {
          padding: resolvedPadding,
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
    width: '100%',
  },
});
