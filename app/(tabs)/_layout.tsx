import React from 'react';
import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppIcon } from '@/components/ui';
import { useAppTheme } from '@/hooks';

export default function TabsLayout() {
  const { tokens } = useAppTheme();
  const insets = useSafeAreaInsets();
  const bottomPadding = Math.max(insets.bottom, tokens.spacing.space2);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: tokens.colors.primary,
        tabBarInactiveTintColor: tokens.colors.textSecondary,
        tabBarStyle: {
          backgroundColor: tokens.colors.background,
          borderTopColor: tokens.colors.divider,
          borderTopWidth: 1,
          height: tokens.layout.tabBarBaseHeight + bottomPadding,
          paddingTop: tokens.spacing.space2,
          paddingBottom: bottomPadding,
        },
        tabBarLabelStyle: {
          fontFamily: tokens.typography.families.semiBold,
          fontSize: 11,
          lineHeight: 15,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inicio',
          tabBarIcon: ({ focused }) => (
            <AppIcon
              name="home"
              size={22}
              strokeWidth={focused ? 2.1 : 1.8}
              color={focused ? tokens.colors.primary : tokens.colors.textSecondary}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="pos"
        options={{
          title: 'POS',
          tabBarIcon: ({ focused }) => (
            <AppIcon
              name="store"
              size={22}
              strokeWidth={focused ? 2.1 : 1.8}
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
              name="arrow-left-right"
              size={22}
              strokeWidth={focused ? 2.1 : 1.8}
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
              name="chart-no-axes-column"
              size={22}
              strokeWidth={focused ? 2.1 : 1.8}
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
              name="user-round"
              size={22}
              strokeWidth={focused ? 2.1 : 1.8}
              color={focused ? tokens.colors.primary : tokens.colors.textSecondary}
            />
          ),
        }}
      />
    </Tabs>
  );
}
