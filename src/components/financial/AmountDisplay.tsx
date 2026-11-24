import React from 'react';
import { Text, type StyleProp, type TextStyle } from 'react-native';
import { useAppTheme } from '@/hooks';
import type { CurrencyCode } from '@/types/common';
import { formatCurrencyFromCents } from '@/utils/currency';

export type AmountDisplaySize = 'sm' | 'md' | 'lg' | 'display';
export type AmountDisplayTone = 'default' | 'received' | 'sent' | 'primary' | 'onPrimary';

export interface AmountDisplayProps {
  amountCents: number;
  currency?: CurrencyCode;
  size?: AmountDisplaySize;
  tone?: AmountDisplayTone;
  showPlusSign?: boolean;
  omitZeroCents?: boolean;
  adjustsFontSizeToFit?: boolean;
  numberOfLines?: number;
  style?: StyleProp<TextStyle>;
  testID?: string;
}

export function AmountDisplay({
  amountCents,
  currency = 'MXN',
  size = 'md',
  tone = 'default',
  showPlusSign = false,
  omitZeroCents = false,
  adjustsFontSizeToFit = false,
  numberOfLines = 1,
  style,
  testID,
}: AmountDisplayProps) {
  const { tokens } = useAppTheme();

  const colorMap: Record<AmountDisplayTone, string> = {
    default: tokens.colors.textPrimary,
    received: tokens.colors.success,
    sent: tokens.colors.textPrimary,
    primary: tokens.colors.primary,
    onPrimary: tokens.colors.textOnPrimary,
  };

  const sizeStyles: Record<AmountDisplaySize, TextStyle> = {
    sm: {
      fontFamily: tokens.typography.families.bold,
      fontSize: 15,
      lineHeight: 20,
    },
    md: {
      fontFamily: tokens.typography.families.bold,
      fontSize: 24,
      lineHeight: 30,
      letterSpacing: -0.4,
    },
    lg: {
      fontFamily: tokens.typography.families.bold,
      fontSize: 32,
      lineHeight: 40,
      letterSpacing: -0.6,
    },
    display: {
      fontFamily: tokens.typography.families.bold,
      fontSize: 36,
      lineHeight: 44,
      letterSpacing: -0.8,
    },
  };

  return (
    <Text
      testID={testID}
      numberOfLines={numberOfLines}
      adjustsFontSizeToFit={adjustsFontSizeToFit}
      style={[tokens.typography.tabularNums, sizeStyles[size], { color: colorMap[tone] }, style]}
    >
      {formatCurrencyFromCents(amountCents, {
        currency,
        showPlusSign,
        omitZeroCents,
      })}
    </Text>
  );
}
