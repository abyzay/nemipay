import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { IoniconsIconName } from '@react-native-vector-icons/ionicons';
import { AppIcon } from '@/components/ui';
import { useAppTheme } from '@/hooks';

export interface QuickReceiveActionsProps {
  onQuickChargePress: () => void;
  onBusinessQrPress: () => void;
}

interface ActionTileProps {
  icon: IoniconsIconName;
  label: string;
  onPress: () => void;
  testID: string;
}

function QuickActionTile({ icon, label, onPress, testID }: ActionTileProps) {
  const { tokens } = useAppTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      testID={testID}
      style={({ pressed }) => [
        styles.tile,
        {
          backgroundColor: pressed ? tokens.colors.border : tokens.colors.secondary,
          borderRadius: tokens.radii.lg,
          borderColor: tokens.colors.border,
          paddingVertical: tokens.spacing.sm + 2,
          paddingHorizontal: tokens.spacing.sm,
          gap: tokens.spacing.xxs + 2,
        },
      ]}
    >
      <AppIcon name={icon} size={24} color={tokens.colors.primaryDark} />
      <Text
        numberOfLines={1}
        style={[
          styles.tileLabel,
          {
            fontFamily: tokens.typography.families.semiBold,
            color: tokens.colors.onSecondary,
          },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

/**
 * Acciones rápidas enfocadas exclusivamente en recibir pagos CoDi.
 */
export function QuickReceiveActions({
  onQuickChargePress,
  onBusinessQrPress,
}: QuickReceiveActionsProps) {
  const { tokens } = useAppTheme();

  return (
    <View style={[styles.row, { gap: tokens.spacing.sm }]}>
      <QuickActionTile
        icon="cash-outline"
        label="Cobro rápido"
        onPress={onQuickChargePress}
        testID="dashboard-quick-charge-button"
      />
      <QuickActionTile
        icon="storefront-outline"
        label="QR del negocio"
        onPress={onBusinessQrPress}
        testID="dashboard-business-qr-button"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  tile: {
    flex: 1,
    minHeight: 74,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  tileLabel: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
});
