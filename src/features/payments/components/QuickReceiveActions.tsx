import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AppCard, AppIcon, type AppIconName } from '@/components/ui';
import { useAppTheme } from '@/hooks';

export interface QuickReceiveActionsProps {
  onQuickChargePress: () => void;
  onBusinessQrPress: () => void;
}

interface ActionTileProps {
  icon: AppIconName;
  label: string;
  onPress: () => void;
  testID: string;
}

function QuickActionTile({ icon, label, onPress, testID }: ActionTileProps) {
  const { tokens } = useAppTheme();

  return (
    <AppCard
      variant="secondary"
      padding="md"
      elevated={false}
      onPress={onPress}
      accessibilityLabel={label}
      testID={testID}
      style={styles.tileWrapper}
    >
      <View style={[styles.tileContent, { gap: tokens.spacing.space2 }]}>
        <View
          style={[
            styles.iconCircle,
            {
              backgroundColor: tokens.colors.lavender,
              borderRadius: tokens.radius.radiusFull,
            },
          ]}
        >
          <AppIcon name={icon} size={20} color={tokens.colors.primary} />
        </View>
        <Text
          numberOfLines={1}
          style={[
            styles.tileLabel,
            {
              fontFamily: tokens.typography.families.semiBold,
              color: tokens.colors.textPrimary,
            },
          ]}
        >
          {label}
        </Text>
      </View>
    </AppCard>
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
    <View style={[styles.row, { gap: tokens.spacing.space3 }]}>
      <View style={styles.col}>
        <QuickActionTile
          icon="banknote"
          label="Cobro rápido"
          onPress={onQuickChargePress}
          testID="dashboard-quick-charge-button"
        />
      </View>
      <View style={styles.col}>
        <QuickActionTile
          icon="store"
          label="QR del negocio"
          onPress={onBusinessQrPress}
          testID="dashboard-business-qr-button"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  col: {
    flex: 1,
  },
  tileWrapper: {
    minHeight: 92,
    justifyContent: 'center',
  },
  tileContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircle: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileLabel: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
});
