import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { AppHeader, AppIcon } from '@/components/ui';
import { useAppTheme } from '@/hooks';

export interface ReportsHeaderProps {
  onBackPress?: () => void;
  onCalendarPress: () => void;
}

export function ReportsHeader({ onBackPress, onCalendarPress }: ReportsHeaderProps) {
  const { tokens } = useAppTheme();

  return (
    <AppHeader
      title="Reportes"
      onBackPress={onBackPress}
      backTestID="reports-back-button"
      rightSlot={
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Seleccionar periodo"
          onPress={onCalendarPress}
          testID="reports-calendar-button"
          style={({ pressed }) => [
            styles.iconButton,
            {
              borderRadius: tokens.radius.radiusFull,
              backgroundColor: pressed ? tokens.colors.lavenderSoft : tokens.colors.surface,
              borderColor: tokens.colors.border,
            },
          ]}
        >
          <AppIcon name="calendar" size={20} color={tokens.colors.textPrimary} />
        </Pressable>
      }
    />
  );
}

const styles = StyleSheet.create({
  iconButton: {
    width: 42,
    height: 42,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
