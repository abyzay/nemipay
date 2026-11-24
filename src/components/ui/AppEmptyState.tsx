import React from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { useAppTheme } from '@/hooks';
import { AppCard } from './AppCard';
import { AppIcon, type AppIconName } from './AppIcon';

export interface AppEmptyStateProps {
  icon?: AppIconName;
  title: string;
  description?: string;
  actions?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export function AppEmptyState({
  icon = 'search',
  title,
  description,
  actions,
  style,
  testID,
}: AppEmptyStateProps) {
  const { tokens } = useAppTheme();

  return (
    <AppCard variant="secondary" padding="lg" style={[styles.container, style]} testID={testID}>
      <View
        style={[
          styles.iconBox,
          {
            backgroundColor: tokens.colors.lavender,
            borderRadius: tokens.radius.radiusFull,
          },
        ]}
      >
        <AppIcon name={icon} size={24} color={tokens.colors.primary} />
      </View>

      <Text
        style={[
          styles.title,
          {
            fontFamily: tokens.typography.families.semiBold,
            color: tokens.colors.textPrimary,
            marginTop: tokens.spacing.space3,
          },
        ]}
      >
        {title}
      </Text>

      {description ? (
        <Text
          style={[
            styles.description,
            {
              fontFamily: tokens.typography.families.regular,
              color: tokens.colors.textSecondary,
              marginTop: tokens.spacing.space1 + 2,
            },
          ]}
        >
          {description}
        </Text>
      ) : null}

      {actions ? (
        <View
          style={[styles.actions, { gap: tokens.spacing.space2, marginTop: tokens.spacing.space4 }]}
        >
          {actions}
        </View>
      ) : null}
    </AppCard>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  iconBox: {
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    lineHeight: 22,
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  actions: {
    width: '100%',
  },
});
