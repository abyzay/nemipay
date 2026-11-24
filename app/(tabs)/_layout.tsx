import React from 'react';
import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppIcon } from '@/components/ui';
import { useAppTheme } from '@/hooks';

export default function TabsLayout() {
  const { tokens } = useAppTheme();
  const insets = useSafeAreaInsets();
  const bottomPadding = Math.max(insets.bottom, tokens.spacing.xs);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: tokens.colors.primary,
        tabBarInactiveTintColor: tokens.colors.textSecondary,
        tabBarStyle: {
          backgroundColor: tokens.colors.surface,
          borderTopColor: tokens.colors.border,
          borderTopWidth: 1,
          height: 58 + bottomPadding,
          paddingTop: tokens.spacing.xxs + 2,
          paddingBottom: bottomPadding,
        },
        tabBarLabelStyle: {
          fontFamily: tokens.typography.families.semiBold,
          fontSize: 11,
          lineHeight: 14,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inicio',
          tabBarIcon: ({ focused }) => (
            <AppIcon
              name={focused ? 'home' : 'home-outline'}
              size={22}
              color={focused ? tokens.colors.primary : tokens.colors.textSecondary}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="activity"
        options={{
          title: 'Actividad',
          tabBarIcon: ({ focused }) => (
            <AppIcon
              name={focused ? 'time' : 'time-outline'}
              size={22}
              color={focused ? tokens.colors.primary : tokens.colors.textSecondary}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="reports"
        options={{
          title: 'Reportes',
          tabBarIcon: ({ focused }) => (
            <AppIcon
              name={focused ? 'bar-chart' : 'bar-chart-outline'}
              size={22}
              color={focused ? tokens.colors.primary : tokens.colors.textSecondary}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ focused }) => (
            <AppIcon
              name={focused ? 'person' : 'person-outline'}
              size={22}
              color={focused ? tokens.colors.primary : tokens.colors.textSecondary}
            />
          ),
        }}
      />
    </Tabs>
  );
}
