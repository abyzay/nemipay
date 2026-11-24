import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AppIcon } from '@/components/ui';
import { useAppTheme } from '@/hooks';

export interface PosHeaderProps {
  onAddProductPress: () => void;
  onClosePress: () => void;
}

export function PosHeader({ onAddProductPress, onClosePress }: PosHeaderProps) {
  const { tokens } = useAppTheme();

  return (
    <View style={[styles.container, { paddingTop: tokens.spacing.xxs }]}>
      <View style={[styles.leftGroup, { gap: tokens.spacing.xs }]}>
        <View
          style={[
            styles.storeBadge,
            {
              backgroundColor: tokens.colors.secondary,
              borderRadius: tokens.radii.md,
            },
          ]}
        >
          <AppIcon name="storefront" size={20} color={tokens.colors.primary} />
        </View>
        <Text
          style={[
            styles.title,
            {
              fontFamily: tokens.typography.families.bold,
              color: tokens.colors.textPrimary,
            },
          ]}
        >
          Punto de venta
        </Text>
      </View>

      <View style={[styles.actionsGroup, { gap: tokens.spacing.xs }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Agregar nuevo producto"
          onPress={onAddProductPress}
          testID="pos-add-product-button"
          style={({ pressed }) => [
            styles.addButton,
            {
              backgroundColor: pressed ? tokens.colors.border : tokens.colors.secondary,
              borderRadius: tokens.radii.full,
              paddingHorizontal: tokens.spacing.sm,
              gap: tokens.spacing.xxs,
            },
          ]}
        >
          <AppIcon name="add" size={16} color={tokens.colors.primaryDark} />
          <Text
            style={[
              styles.addLabel,
              {
                fontFamily: tokens.typography.families.semiBold,
                color: tokens.colors.primaryDark,
              },
            ]}
          >
            Producto
          </Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Cerrar punto de venta"
          onPress={onClosePress}
          testID="pos-close-button"
          style={({ pressed }) => [
            styles.closeButton,
            {
              borderRadius: tokens.radii.full,
              backgroundColor: pressed ? tokens.colors.secondary : 'transparent',
            },
          ]}
        >
          <AppIcon name="close" size={22} color={tokens.colors.textPrimary} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
  },
  leftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  storeBadge: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    lineHeight: 24,
  },
  actionsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 34,
  },
  addLabel: {
    fontSize: 13,
    lineHeight: 18,
  },
  closeButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
