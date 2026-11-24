import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppIcon, NemiPayLogo } from '@/components/ui';
import { useAppTheme } from '@/hooks';

export interface DashboardHeaderProps {
  unreadCount?: number;
  onNotificationsPress: () => void;
}

export function DashboardHeader({ unreadCount = 0, onNotificationsPress }: DashboardHeaderProps) {
  const { tokens } = useAppTheme();

  return (
    <View style={[styles.container, { paddingTop: tokens.spacing.xxs }]}>
      <NemiPayLogo size="md" testID="dashboard-logo" />

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={
          unreadCount > 0 ? `Notificaciones, ${unreadCount} sin leer` : 'Notificaciones'
        }
        onPress={onNotificationsPress}
        testID="dashboard-notifications-button"
        style={({ pressed }) => [
          styles.bellButton,
          {
            borderRadius: tokens.radii.full,
            backgroundColor: pressed ? tokens.colors.secondary : 'transparent',
          },
        ]}
      >
        <AppIcon name="notifications-outline" size={24} color={tokens.colors.textPrimary} />
        {unreadCount > 0 ? (
          <View
            testID="dashboard-notifications-badge"
            style={[
              styles.badgeDot,
              {
                backgroundColor: tokens.colors.primary,
                borderColor: tokens.colors.background,
                borderRadius: tokens.radii.full,
              },
            ]}
          />
        ) : null}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
  },
  bellButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  badgeDot: {
    position: 'absolute',
    top: 9,
    right: 10,
    width: 9,
    height: 9,
    borderWidth: 1.5,
  },
});
