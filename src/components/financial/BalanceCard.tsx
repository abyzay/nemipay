import React from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AppIcon, type AppIconName } from '@/components/ui';
import { useAppTheme } from '@/hooks';
import type { CurrencyCode } from '@/types/common';
import { AmountDisplay } from './AmountDisplay';

export interface BalanceCardProps {
  label: string;
  amountCents: number;
  currency?: CurrencyCode;
  subtitle?: string;
  badgeText?: string;
  icon?: AppIconName;
  useGradient?: boolean;
  amountTestID?: string;
  testID?: string;
  style?: StyleProp<ViewStyle>;
}

export function BalanceCard({
  label,
  amountCents,
  currency = 'MXN',
  subtitle,
  badgeText,
  icon = 'wallet',
  useGradient = true,
  amountTestID,
  testID,
  style,
}: BalanceCardProps) {
  const { tokens } = useAppTheme();

  const content = (
    <>
      <View style={styles.topRow}>
        <View style={[styles.labelGroup, { gap: tokens.spacing.space2 }]}>
          <Text
            style={[
              styles.label,
              {
                fontFamily: tokens.typography.families.medium,
                color: tokens.colors.lavender,
              },
            ]}
          >
            {label}
          </Text>
          {badgeText ? (
            <View
              style={[
                styles.badgePill,
                {
                  backgroundColor: 'rgba(255, 255, 255, 0.16)',
                  borderRadius: tokens.radius.radiusFull,
                  paddingHorizontal: tokens.spacing.space2 + 2,
                },
              ]}
            >
              <Text
                style={[
                  styles.badgeText,
                  {
                    fontFamily: tokens.typography.families.semiBold,
                    color: tokens.colors.textOnPrimary,
                  },
                ]}
              >
                {badgeText}
              </Text>
            </View>
          ) : null}
        </View>

        <View
          style={[
            styles.iconContainer,
            {
              backgroundColor: 'rgba(255, 255, 255, 0.16)',
              borderRadius: tokens.radius.radiusMD,
            },
          ]}
        >
          <AppIcon name={icon} size={20} color={tokens.colors.textOnPrimary} />
        </View>
      </View>

      <AmountDisplay
        amountCents={amountCents}
        currency={currency}
        size="lg"
        tone="onPrimary"
        adjustsFontSizeToFit
        testID={amountTestID}
        style={{ marginTop: tokens.spacing.space2 }}
      />

      {subtitle ? (
        <Text
          style={[
            styles.subtitle,
            {
              fontFamily: tokens.typography.families.regular,
              color: tokens.colors.lavender,
              marginTop: tokens.spacing.space1,
            },
          ]}
        >
          {subtitle}
        </Text>
      ) : null}
    </>
  );

  const cardStyle = [
    styles.card,
    tokens.shadows.card,
    {
      borderRadius: tokens.radius.radiusBalanceCard,
      padding: tokens.spacing.space5,
    },
    style,
  ];

  if (useGradient) {
    return (
      <LinearGradient
        colors={[tokens.colors.primary, tokens.colors.primaryDark]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        testID={testID}
        style={cardStyle}
      >
        {content}
      </LinearGradient>
    );
  }

  return (
    <View testID={testID} style={[cardStyle, { backgroundColor: tokens.colors.primary }]}>
      {content}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  labelGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    flexWrap: 'wrap',
  },
  label: {
    fontSize: 14,
    lineHeight: 20,
  },
  badgePill: {
    paddingVertical: 3,
  },
  badgeText: {
    fontSize: 11,
    lineHeight: 15,
  },
  iconContainer: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 18,
  },
});
