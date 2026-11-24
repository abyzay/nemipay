import React from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { AppCard, AppIcon, type AppIconName } from '@/components/ui';
import { useAppTheme } from '@/hooks';

export interface PaymentMethodCardProps {
  title: string;
  subtitle?: string;
  icon: AppIconName;
  selected?: boolean;
  onPress?: () => void;
  rightSlot?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export function PaymentMethodCard({
  title,
  subtitle,
  icon,
  selected = false,
  onPress,
  rightSlot,
  style,
  testID,
}: PaymentMethodCardProps) {
  const { tokens } = useAppTheme();

  return (
    <AppCard
      variant={selected ? 'selected' : 'standard'}
      padding="md"
      elevated={!selected}
      onPress={onPress}
      accessibilityLabel={title}
      style={style}
      testID={testID}
    >
      <View style={[styles.row, { gap: tokens.spacing.space3 }]}>
        <View
          style={[
            styles.iconBox,
            {
              backgroundColor: selected ? tokens.colors.background : tokens.colors.lavenderSoft,
              borderRadius: tokens.radius.radiusMD,
            },
          ]}
        >
          <AppIcon
            name={icon}
            size={20}
            color={selected ? tokens.colors.primary : tokens.colors.gray[700]}
          />
        </View>

        <View style={styles.textGroup}>
          <Text
            numberOfLines={1}
            style={[
              styles.title,
              {
                fontFamily: tokens.typography.families.semiBold,
                color: selected ? tokens.colors.primary : tokens.colors.textPrimary,
              },
            ]}
          >
            {title}
          </Text>
          {subtitle ? (
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
          ) : null}
        </View>

        {rightSlot ? (
          rightSlot
        ) : selected ? (
          <AppIcon name="circle-check" size={20} color={tokens.colors.primary} />
        ) : (
          <AppIcon name="chevron-right" size={18} color={tokens.colors.textMuted} />
        )}
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
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textGroup: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 15,
    lineHeight: 20,
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 18,
  },
});
