import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { AmountDisplay } from '@/components/financial';
import { AppBadge, AppCard, AppIcon } from '@/components/ui';
import { APP_ASSETS } from '@/constants/assets';
import { useAppTheme } from '@/hooks';

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
    <AppCard
      variant="standard"
      padding="sm"
      testID="pos-total-banner"
      style={{ borderRadius: tokens.radius.radiusCard }}
    >
      <View style={[styles.container, { gap: tokens.spacing.space3 }]}>
        <View
          style={[
            styles.illustrationBox,
            {
              backgroundColor: tokens.colors.surface,
              borderColor: tokens.colors.border,
              borderRadius: tokens.radius.radiusMD,
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

        <View style={[styles.rightColumn, { gap: tokens.spacing.space2 }]}>
          <View style={styles.businessRow}>
            <Text
              numberOfLines={1}
              style={[
                styles.businessName,
                {
                  fontFamily: tokens.typography.families.semiBold,
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
                    backgroundColor: pressed ? tokens.colors.errorLight : 'transparent',
                    borderRadius: tokens.radius.radiusFull,
                    gap: 4,
                  },
                ]}
              >
                <AppIcon name="trash-2" size={14} color={tokens.colors.error} />
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
                backgroundColor: hasItems ? tokens.colors.lavenderSoft : tokens.colors.surface,
                borderColor: hasItems ? tokens.colors.lavenderBorder : tokens.colors.border,
                borderRadius: tokens.radius.radiusInput,
                paddingHorizontal: tokens.spacing.space3,
                paddingVertical: tokens.spacing.space2,
              },
            ]}
          >
            <AppBadge
              label={unitsCount === 1 ? '1 art.' : `${unitsCount} art.`}
              variant={hasItems ? 'lavender' : 'neutral'}
              testID="pos-units-count"
            />

            <AmountDisplay
              amountCents={totalCents}
              size="md"
              tone={hasItems ? 'primary' : 'default'}
              adjustsFontSizeToFit
              testID="pos-total-amount"
              style={styles.totalAmount}
            />
          </View>
        </View>
      </View>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  illustrationBox: {
    width: 70,
    height: 70,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  illustration: {
    width: 64,
    height: 64,
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
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  clearText: {
    fontSize: 12,
    lineHeight: 16,
  },
  totalBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    minHeight: 46,
    gap: 8,
  },
  totalAmount: {
    flex: 1,
    textAlign: 'right',
  },
});
