import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppIcon, NemiPayLogo } from '@/components/ui';
import { useAppTheme } from '@/hooks';

export interface AuthHeaderProps {
  onBackPress: () => void;
}

export function AuthHeader({ onBackPress }: AuthHeaderProps) {
  const { tokens } = useAppTheme();

  return (
    <View style={[styles.container, { paddingTop: tokens.spacing.xs }]}>
      <View style={styles.sideSlot}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Regresar"
          onPress={onBackPress}
          testID="auth-back-button"
          style={({ pressed }) => [
            styles.backButton,
            {
              borderRadius: tokens.radii.full,
              backgroundColor: pressed ? tokens.colors.secondary : 'transparent',
            },
          ]}
        >
          <AppIcon name="chevron-back" size={26} color={tokens.colors.textPrimary} />
        </Pressable>
      </View>

      <View style={styles.logoSlot}>
        <NemiPayLogo size="md" testID="auth-logo" />
      </View>

      <View style={styles.sideSlot} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 52,
  },
  sideSlot: {
    width: 48,
    height: 48,
    justifyContent: 'center',
  },
  backButton: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -8,
  },
  logoSlot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
