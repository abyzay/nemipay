import React from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { AppDivider, AppIcon, type AppIconName } from '@/components/ui';
import { useAppTheme } from '@/hooks';
import type { CurrencyCode } from '@/types/common';
import { AmountDisplay } from './AmountDisplay';

export type TransactionDirection = 'received' | 'sent';

export interface TransactionItemProps {
  title: string;
  subtitle: string;
  amountCents: number;
  currency?: CurrencyCode;
  direction?: TransactionDirection;
  statusLabel?: string;
  icon?: AppIconName;
  compact?: boolean;
  showDivider?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export function TransactionItem({
  title,
  subtitle,
  amountCents,
  currency = 'MXN',
  direction = 'received',
  statusLabel,
  icon,
  compact = false,
  showDivider = false,
  style,
  testID,
}: TransactionItemProps) {
  const { tokens } = useAppTheme();
  const isReceived = direction === 'received';

  const resolvedIcon: AppIconName = icon ?? (isReceived ? 'arrow-down-left' : 'arrow-up-right');
  const resolvedStatus = statusLabel ?? (isReceived ? 'Recibido' : 'Enviado');

  return (
    <View testID={testID} style={style}>
      <View
        style={[
          styles.row,
          {
            paddingVertical: compact ? tokens.spacing.space2 + 2 : tokens.spacing.space3,
            gap: tokens.spacing.space3,
          },
        ]}
      >
        <View
          style={[
            styles.iconContainer,
            {
              width: compact ? 38 : 42,
              height: compact ? 38 : 42,
              borderRadius: tokens.radius.radiusFull,
              backgroundColor: isReceived ? tokens.colors.successLight : tokens.colors.lavenderSoft,
            },
          ]}
        >
          <AppIcon
            name={resolvedIcon}
            size={compact ? 18 : 20}
            color={isReceived ? tokens.colors.success : tokens.colors.primary}
          />
        </View>

        <View style={styles.detailsColumn}>
          <Text
            numberOfLines={1}
            style={[
              styles.title,
              {
                fontFamily: tokens.typography.families.semiBold,
                color: tokens.colors.textPrimary,
              },
            ]}
          >
            {title}
          </Text>
          <Text
            numberOfLines={1}
            style={[
              styles.subtitle,
              {
                fontFamily: tokens.typography.families.regular,
                color: tokens.colors.textSecondary,
              },
            ]}
          >
            {subtitle}
          </Text>
        </View>

        <View style={styles.amountColumn}>
          <AmountDisplay
            amountCents={amountCents}
            currency={currency}
            size="sm"
            tone={isReceived ? 'received' : 'sent'}
            showPlusSign={isReceived}
          />
          <View style={[styles.directionRow, { gap: 4 }]}>
            <AppIcon
              name={isReceived ? 'arrow-down-left' : 'arrow-up-right'}
              size={12}
              color={isReceived ? tokens.colors.success : tokens.colors.textSecondary}
            />
            <Text
              style={[
                styles.statusText,
                {
                  fontFamily: tokens.typography.families.medium,
                  color: tokens.colors.textSecondary,
                },
              ]}
            >
              {resolvedStatus}
            </Text>
          </View>
        </View>
      </View>

      {showDivider ? <AppDivider /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailsColumn: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 15,
    lineHeight: 20,
  },
  subtitle: {
    fontSize: 12,
    lineHeight: 16,
  },
  amountColumn: {
    alignItems: 'flex-end',
    gap: 2,
  },
  directionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 11,
    lineHeight: 15,
  },
});
