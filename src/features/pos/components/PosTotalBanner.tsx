import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { AppIcon } from '@/components/ui';
import { APP_ASSETS } from '@/constants/assets';
import { useAppTheme } from '@/hooks';
import { formatCurrencyFromCents } from '@/utils/currency';

export interface PosTotalBannerProps {
  businessName: string;
  totalCents: number;
  unitsCount: number;
  onClearCartPress: () => void;
}

export function PosTotalBanner({
  businessName,
  totalCents,
  unitsCount,
  onClearCartPress,
}: PosTotalBannerProps) {
  const { tokens } = useAppTheme();
  const hasItems = unitsCount > 0;

  return (
    <View style={[styles.container, { gap: tokens.spacing.sm }]} testID="pos-total-banner">
      <View
        style={[
          styles.illustrationBox,
          {
            backgroundColor: tokens.colors.surface,
            borderColor: tokens.colors.border,
            borderRadius: tokens.radii.lg,
          },
        ]}
      >
        <Image
          source={APP_ASSETS.posStorefront}
          resizeMode="contain"
          accessible
          accessibilityRole="image"
          accessibilityLabel={`Ilustración de ${businessName}`}
          testID="pos-storefront-illustration"
          style={styles.illustration}
        />
      </View>

      <View style={[styles.rightColumn, { gap: tokens.spacing.xxs + 2 }]}>
        <View style={styles.businessRow}>
          <Text
            numberOfLines={1}
            style={[
              styles.businessName,
              {
                fontFamily: tokens.typography.families.bold,
                color: tokens.colors.textPrimary,
              },
            ]}
          >
            {businessName}
          </Text>

          {hasItems ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Vaciar pedido"
              onPress={onClearCartPress}
              hitSlop={8}
              testID="pos-clear-cart-button"
              style={({ pressed }) => [
                styles.clearButton,
                {
                  backgroundColor: pressed ? tokens.colors.secondary : 'transparent',
                  borderRadius: tokens.radii.full,
                  gap: 3,
                },
              ]}
            >
              <AppIcon name="trash-outline" size={14} color={tokens.colors.error} />
              <Text
                style={[
                  styles.clearText,
                  {
                    fontFamily: tokens.typography.families.semiBold,
                    color: tokens.colors.error,
                  },
                ]}
              >
                Limpiar
              </Text>
            </Pressable>
          ) : null}
        </View>

        <View
          style={[
            styles.totalBox,
            {
              backgroundColor: tokens.colors.surface,
              borderColor: hasItems ? tokens.colors.primary : tokens.colors.border,
              borderRadius: tokens.radii.lg,
              paddingHorizontal: tokens.spacing.sm,
              paddingVertical: tokens.spacing.xs,
            },
          ]}
        >
          <View
            style={[
              styles.unitsBadge,
              {
                backgroundColor: hasItems ? tokens.colors.secondary : tokens.colors.background,
                borderRadius: tokens.radii.full,
                paddingHorizontal: tokens.spacing.xs,
              },
            ]}
          >
            <Text
              testID="pos-units-count"
              style={[
                styles.unitsText,
                {
                  fontFamily: tokens.typography.families.semiBold,
                  color: hasItems ? tokens.colors.primaryDark : tokens.colors.textSecondary,
                },
              ]}
            >
              {unitsCount === 1 ? '1 art.' : `${unitsCount} art.`}
            </Text>
          </View>

          <Text
            testID="pos-total-amount"
            numberOfLines={1}
            adjustsFontSizeToFit
            style={[
              styles.totalAmount,
              {
                fontFamily: tokens.typography.families.bold,
                color: hasItems ? tokens.colors.primary : tokens.colors.textSecondary,
              },
            ]}
          >
            {formatCurrencyFromCents(totalCents)}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  illustrationBox: {
    width: 78,
    height: 78,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  illustration: {
    width: 72,
    height: 72,
  },
  rightColumn: {
    flex: 1,
  },
  businessRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  businessName: {
    flex: 1,
    fontSize: 15,
    lineHeight: 20,
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  clearText: {
    fontSize: 12,
    lineHeight: 16,
  },
  totalBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    minHeight: 50,
    gap: 8,
  },
  unitsBadge: {
    paddingVertical: 3,
  },
  unitsText: {
    fontSize: 12,
    lineHeight: 16,
  },
  totalAmount: {
    flex: 1,
    fontSize: 28,
    lineHeight: 34,
    letterSpacing: -0.5,
    textAlign: 'right',
  },
});
