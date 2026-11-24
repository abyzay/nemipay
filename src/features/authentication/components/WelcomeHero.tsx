import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useAppTheme } from '@/hooks';
import { WelcomeIllustration } from './WelcomeIllustration';

export function WelcomeHero() {
  const { tokens } = useAppTheme();

  return (
    <View style={[styles.container, { paddingTop: tokens.spacing.space4 }]}>
      <Text
        style={[
          styles.title,
          {
            fontFamily: tokens.typography.families.bold,
            color: tokens.colors.textPrimary,
          },
        ]}
      >
        {'Cobra fácil.\nPaga seguro.'}
      </Text>

      <Text
        style={[
          styles.subtitle,
          {
            fontFamily: tokens.typography.families.regular,
            color: tokens.colors.textSecondary,
            marginTop: tokens.spacing.space2,
          },
        ]}
      >
        {'Tu dinero y tus cobros QR,\nen un solo lugar.'}
      </Text>

      <View style={styles.illustrationWrapper}>
        <WelcomeIllustration testID="welcome-illustration" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    lineHeight: 40,
    letterSpacing: -0.6,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
  },
  illustrationWrapper: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
