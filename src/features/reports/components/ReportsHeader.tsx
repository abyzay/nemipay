import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AppIcon } from '@/components/ui';
import { useAppTheme } from '@/hooks';

export interface ReportsHeaderProps {
  onBackPress?: () => void;
  onCalendarPress: () => void;
}

export function ReportsHeader({ onBackPress, onCalendarPress }: ReportsHeaderProps) {
  const { tokens } = useAppTheme();

  return (
    <View style={[styles.container, { paddingTop: tokens.spacing.xxs }]}>
      <View style={styles.sideSlot}>
        {onBackPress ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Regresar al inicio"
            onPress={onBackPress}
            testID="reports-back-button"
            style={({ pressed }) => [
              styles.iconButton,
              {
                borderRadius: tokens.radii.full,
                backgroundColor: pressed ? tokens.colors.secondary : 'transparent',
              },
            ]}
          >
            <AppIcon name="chevron-back" size={24} color={tokens.colors.textPrimary} />
          </Pressable>
        ) : null}
      </View>

      <Text
        style={[
          styles.title,
          {
            fontFamily: tokens.typography.families.bold,
            color: tokens.colors.textPrimary,
          },
        ]}
      >
        Reportes
      </Text>

      <View style={[styles.sideSlot, styles.rightSlot]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Seleccionar periodo"
          onPress={onCalendarPress}
          testID="reports-calendar-button"
          style={({ pressed }) => [
            styles.iconButton,
            {
              borderRadius: tokens.radii.full,
              backgroundColor: pressed ? tokens.colors.secondary : 'transparent',
            },
          ]}
        >
          <AppIcon name="calendar-outline" size={22} color={tokens.colors.textPrimary} />
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
    minHeight: 46,
  },
  sideSlot: {
    width: 44,
    height: 44,
    justifyContent: 'center',
  },
  rightSlot: {
    alignItems: 'flex-end',
  },
  iconButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    lineHeight: 26,
  },
});
