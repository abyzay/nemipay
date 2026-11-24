import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AppIcon } from '@/components/ui';
import { useAppTheme } from '@/hooks';

export interface ReceivePaymentHeroCardProps {
  onPress: () => void;
  testID?: string;
}

export function ReceivePaymentHeroCard({ onPress, testID }: ReceivePaymentHeroCardProps) {
  const { tokens } = useAppTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Cobrar con QR. Genera tu código CoDi al instante"
      onPress={onPress}
      testID={testID}
      style={({ pressed }) => [
        styles.card,
        tokens.elevations.sm,
        {
          backgroundColor: pressed ? tokens.colors.primaryDark : tokens.colors.primary,
          borderRadius: tokens.radii.lg,
          paddingHorizontal: tokens.spacing.md,
          paddingVertical: tokens.spacing.sm + 2,
          gap: tokens.spacing.sm + 4,
        },
      ]}
    >
      <View
        style={[
          styles.iconBox,
          {
            backgroundColor: tokens.colors.primaryDark,
            borderRadius: tokens.radii.md,
          },
        ]}
      >
        <AppIcon name="qr-code-outline" size={28} color={tokens.colors.onPrimary} />
      </View>

      <View style={styles.textGroup}>
        <Text
          style={[
            styles.title,
            {
              fontFamily: tokens.typography.families.bold,
              color: tokens.colors.onPrimary,
            },
          ]}
        >
          Cobrar con QR
        </Text>
        <Text
          style={[
            styles.subtitle,
            {
              fontFamily: tokens.typography.families.regular,
              color: tokens.colors.secondary,
            },
          ]}
        >
          Genera tu código CoDi al instante
        </Text>
      </View>

      <AppIcon name="chevron-forward" size={22} color={tokens.colors.onPrimary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 74,
  },
  iconBox: {
    width: 46,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textGroup: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 18,
    lineHeight: 24,
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 18,
  },
});
