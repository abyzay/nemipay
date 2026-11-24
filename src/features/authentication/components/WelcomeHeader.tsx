import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { AppHeader, AppIcon, NemiPayLogo } from '@/components/ui';
import { useAppTheme } from '@/hooks';

export interface WelcomeHeaderProps {
  onNotificationsPress?: () => void;
}

export function WelcomeHeader({ onNotificationsPress }: WelcomeHeaderProps) {
  const { tokens } = useAppTheme();

  return (
    <AppHeader
      centerSlot={<NemiPayLogo size="md" testID="welcome-logo" />}
      rightSlot={
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Notificaciones"
          onPress={onNotificationsPress}
          testID="welcome-notifications-button"
          style={({ pressed }) => [
            styles.iconButton,
            {
              borderRadius: tokens.radius.radiusFull,
              backgroundColor: pressed ? tokens.colors.lavenderSoft : 'transparent',
            },
          ]}
        >
          <AppIcon name="bell" size={22} color={tokens.colors.textPrimary} />
        </Pressable>
      }
    />
  );
}

const styles = StyleSheet.create({
  iconButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
