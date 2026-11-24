import React from 'react';
import { Pressable, StyleSheet, Text, type StyleProp, type ViewStyle } from 'react-native';
import { useAppTheme } from '@/hooks';
import { AppIcon, type AppIconName } from './AppIcon';

export interface AppChipProps {
  label: string;
  selected?: boolean;
  onPress: () => void;
  icon?: AppIconName;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export function AppChip({
  label,
  selected = false,
  onPress,
  icon,
  disabled = false,
  style,
  testID,
}: AppChipProps) {
  const { tokens } = useAppTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected, disabled }}
      disabled={disabled}
      onPress={onPress}
      testID={testID}
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: selected
            ? tokens.colors.primary
            : pressed
              ? tokens.colors.lavenderSoft
              : tokens.colors.surfaceSecondary,
          borderRadius: tokens.radius.radiusFull,
          paddingHorizontal: tokens.spacing.space4,
          gap: tokens.spacing.space2 - 2,
          opacity: disabled ? 0.55 : pressed ? 0.92 : 1,
        },
        style,
      ]}
    >
      {icon ? (
        <AppIcon
          name={icon}
          size={16}
          color={selected ? tokens.colors.textOnPrimary : tokens.colors.gray[700]}
        />
      ) : null}
      <Text
        numberOfLines={1}
        style={[
          styles.label,
          {
            fontFamily: tokens.typography.families.semiBold,
            color: selected ? tokens.colors.textOnPrimary : tokens.colors.gray[700],
          },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    height: 38,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 13,
    lineHeight: 18,
  },
});
