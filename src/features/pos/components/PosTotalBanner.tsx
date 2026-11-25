import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AppButton } from '@/components/ui';
import { useAppTheme } from '@/hooks';

export interface PosTotalBannerProps {
  onAddPress: () => void;
}

export function PosTotalBanner({ onAddPress }: PosTotalBannerProps) {
  const { tokens } = useAppTheme();

  return (
    <View style={styles.row} testID="pos-total-banner">
      <Text
        style={[
          styles.label,
          {
            fontFamily: tokens.typography.families.medium,
            color: tokens.colors.textSecondary,
          },
        ]}
      >
        Toca para sumar al cobro
      </Text>
      <AppButton
        variant="outlined"
        size="md"
        fullWidth={false}
        leftIcon="plus"
        label="+ Agregar"
        onPress={onAddPress}
        testID="pos-add-product-button"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  label: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
});
