import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppIcon, NemiPayLogo } from '@/components/ui';
import { useAppTheme } from '@/hooks';

export interface WelcomeHeaderProps {
  onNotificationsPress?: () => void;
}

export function WelcomeHeader({ onNotificationsPress }: WelcomeHeaderProps) {
  const { tokens } = useAppTheme();

  return (
    <View style={[styles.container, { paddingTop: tokens.spacing.xs }]}>
      <View style={styles.sideSlot} />

      <View style={styles.logoSlot}>
        <NemiPayLogo size="md" testID="welcome-logo" />
      </View>

      <View style={[styles.sideSlot, styles.rightAligned]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Notificaciones"
          onPress={onNotificationsPress}
          testID="welcome-notifications-button"
          style={({ pressed }) => [
            styles.iconButton,
            {
              borderRadius: tokens.radii.full,
              backgroundColor: pressed ? tokens.colors.secondary : 'transparent',
            },
          ]}
        >
          <AppIcon name="notifications-outline" size={24} color={tokens.colors.textPrimary} />
        </Pressable>
      </View>
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
  rightAligned: {
    alignItems: 'flex-end',
  },
  logoSlot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButton: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
