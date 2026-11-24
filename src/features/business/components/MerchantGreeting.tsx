import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AppAvatar } from '@/components/ui';
import { useAppTheme } from '@/hooks';

export interface MerchantGreetingProps {
  ownerName: string;
  subtitle: string;
  businessName: string;
  initials: string;
}

export function MerchantGreeting({
  ownerName,
  subtitle,
  businessName,
  initials,
}: MerchantGreetingProps) {
  const { tokens } = useAppTheme();

  return (
    <View style={[styles.container, { gap: tokens.spacing.space3 }]} testID="merchant-greeting">
      <AppAvatar
        initials={initials}
        size={48}
        accessibilityLabel={`Avatar de ${ownerName}`}
        testID="dashboard-avatar"
      />

      <View style={styles.textColumn}>
        <Text
          numberOfLines={1}
          style={[
            styles.greetingTitle,
            {
              fontFamily: tokens.typography.families.bold,
              color: tokens.colors.textPrimary,
            },
          ]}
        >
          {`Hola, ${ownerName}`}
        </Text>
        <Text
          numberOfLines={1}
          style={[
            styles.greetingSubtitle,
            {
              fontFamily: tokens.typography.families.regular,
              color: tokens.colors.textSecondary,
            },
          ]}
        >
          {`${subtitle} · ${businessName}`}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  textColumn: {
    flex: 1,
    gap: 2,
  },
  greetingTitle: {
    fontSize: 20,
    lineHeight: 28,
    letterSpacing: -0.3,
  },
  greetingSubtitle: {
    fontSize: 13,
    lineHeight: 18,
  },
});
