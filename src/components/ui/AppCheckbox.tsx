import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useAppTheme } from '@/hooks';
import { AppIcon } from './AppIcon';

export interface AppCheckboxProps {
  checked: boolean;
  onToggle: (nextValue: boolean) => void;
  children: React.ReactNode;
  error?: string;
  accessibilityLabel: string;
  testID?: string;
  errorTestID?: string;
}

export function AppCheckbox({
  checked,
  onToggle,
  children,
  error,
  accessibilityLabel,
  testID,
  errorTestID,
}: AppCheckboxProps) {
  const { tokens } = useAppTheme();
  const hasError = Boolean(error);

  const boxBorderColor = hasError
    ? tokens.colors.error
    : checked
      ? tokens.colors.primary
      : tokens.colors.textSecondary;

  return (
    <View style={styles.wrapper}>
      <View style={[styles.row, { gap: tokens.spacing.sm }]}>
        <Pressable
          accessibilityRole="checkbox"
          accessibilityLabel={accessibilityLabel}
          accessibilityState={{ checked }}
          hitSlop={8}
          onPress={() => onToggle(!checked)}
          testID={testID}
          style={[
            styles.box,
            {
              borderRadius: tokens.radii.sm,
              borderColor: boxBorderColor,
              backgroundColor: checked ? tokens.colors.primary : tokens.colors.surface,
            },
          ]}
        >
          {checked ? <AppIcon name="checkmark" size={16} color={tokens.colors.onPrimary} /> : null}
        </Pressable>

        <View style={styles.labelContainer}>{children}</View>
      </View>

      {hasError ? (
        <View
          accessibilityRole="alert"
          style={[styles.errorRow, { marginTop: tokens.spacing.xxs + 2, gap: 4 }]}
        >
          <AppIcon name="alert-circle-outline" size={14} color={tokens.colors.error} />
          <Text
            testID={errorTestID}
            style={[
              styles.errorText,
              {
                fontFamily: tokens.typography.families.medium,
                color: tokens.colors.error,
              },
            ]}
          >
            {error}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  box: {
    width: 24,
    height: 24,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelContainer: {
    flex: 1,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 2,
  },
  errorText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 16,
  },
});
