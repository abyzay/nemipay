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
    <View style={[styles.container, { paddingTop: tokens.spacing.space1 }]}>
      <View style={[styles.leftGroup, { gap: tokens.spacing.space2 + 2 }]}>
        <View
          style={[
            styles.storeBadge,
            {
              backgroundColor: tokens.colors.lavender,
              borderRadius: tokens.radius.radiusMD,
            },
          ]}
        >
          <AppIcon name="store" size={18} color={tokens.colors.primary} />
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

      <View style={[styles.actionsGroup, { gap: tokens.spacing.space2 }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Agregar nuevo producto"
          onPress={onAddProductPress}
          testID="pos-add-product-button"
          style={({ pressed }) => [
            styles.addButton,
            {
              backgroundColor: pressed ? tokens.colors.lavenderBorder : tokens.colors.lavender,
              borderRadius: tokens.radius.radiusFull,
              paddingHorizontal: tokens.spacing.space3,
              gap: tokens.spacing.space1,
            },
          ]}
        >
          <AppIcon name="plus" size={16} color={tokens.colors.primary} />
          <Text
            style={[
              styles.addLabel,
              {
                fontFamily: tokens.typography.families.semiBold,
                color: tokens.colors.primary,
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
              borderRadius: tokens.radius.radiusFull,
              backgroundColor: pressed ? tokens.colors.surfaceSecondary : tokens.colors.surface,
              borderColor: tokens.colors.border,
            },
          ]}
        >
          <AppIcon name="close" size={20} color={tokens.colors.textPrimary} />
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
    minHeight: 48,
  },
  leftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  storeBadge: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    lineHeight: 26,
  },
  actionsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 36,
  },
  addLabel: {
    fontSize: 13,
    lineHeight: 18,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
