import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AppCard, AppIcon } from '@/components/ui';
import { useAppTheme } from '@/hooks';

export interface ReceivePaymentHeroCardProps {
  onPress: () => void;
  testID?: string;
}

export function ReceivePaymentHeroCard({ onPress, testID }: ReceivePaymentHeroCardProps) {
  const { tokens } = useAppTheme();

  return (
    <AppCard
      variant="standard"
      padding="md"
      onPress={onPress}
      accessibilityLabel="Cobrar con QR. Genera tu código CoDi al instante"
      testID={testID}
    >
      <View style={[styles.row, { gap: tokens.spacing.space3 }]}>
        <View
          style={[
            styles.iconBox,
            {
              backgroundColor: tokens.colors.lavender,
              borderRadius: tokens.radius.radiusMD,
            },
          ]}
        >
          <AppIcon name="qr-code" size={24} color={tokens.colors.primary} />
        </View>

        <View style={styles.textGroup}>
          <Text
            style={[
              styles.title,
              {
                fontFamily: tokens.typography.families.semiBold,
                color: tokens.colors.textPrimary,
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
                color: tokens.colors.textSecondary,
              },
            ]}
          >
            Genera tu código CoDi al instante
          </Text>
        </View>

        <View
          style={[
            styles.chevronBox,
            {
              backgroundColor: tokens.colors.lavenderSoft,
              borderRadius: tokens.radius.radiusFull,
            },
          ]}
        >
          <AppIcon name="chevron-right" size={18} color={tokens.colors.primary} />
        </View>
      </View>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBox: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textGroup: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 16,
    lineHeight: 22,
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 18,
  },
  chevronBox: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
