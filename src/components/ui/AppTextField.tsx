import React, { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type NativeSyntheticEvent,
  type StyleProp,
  type TargetedEvent,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import type { IoniconsIconName } from '@react-native-vector-icons/ionicons';
import { useAppTheme } from '@/hooks';
import { AppIcon } from './AppIcon';

export interface AppTextFieldProps extends Omit<
  TextInputProps,
  'style' | 'secureTextEntry' | 'placeholderTextColor'
> {
  leftIcon: IoniconsIconName;
  isPassword?: boolean;
  rightIcon?: IoniconsIconName;
  onRightIconPress?: () => void;
  rightIconAccessibilityLabel?: string;
  error?: string;
  containerStyle?: StyleProp<ViewStyle>;
  errorTestID?: string;
}

export function AppTextField({
  leftIcon,
  isPassword = false,
  rightIcon,
  onRightIconPress,
  rightIconAccessibilityLabel,
  error,
  containerStyle,
  errorTestID,
  onFocus,
  onBlur,
  ...textInputProps
}: AppTextFieldProps) {
  const { tokens } = useAppTheme();
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const hasError = Boolean(error);

  const borderColor = hasError
    ? tokens.colors.error
    : isFocused
      ? tokens.colors.primary
      : '#D4DDD8';

  const leftIconColor = hasError
    ? tokens.colors.error
    : isFocused
      ? tokens.colors.primary
      : tokens.colors.textSecondary;

  const handleFocus = (event: NativeSyntheticEvent<TargetedEvent>) => {
    setIsFocused(true);
    onFocus?.(event);
  };

  const handleBlur = (event: NativeSyntheticEvent<TargetedEvent>) => {
    setIsFocused(false);
    onBlur?.(event);
  };

  const resolvedRightIcon: IoniconsIconName | undefined = isPassword
    ? isPasswordVisible
      ? 'eye-outline'
      : 'eye-off-outline'
    : rightIcon;

  const handleRightPress = isPassword
    ? () => setIsPasswordVisible((prev) => !prev)
    : onRightIconPress;

  const resolvedRightLabel = isPassword
    ? isPasswordVisible
      ? 'Ocultar contraseña'
      : 'Mostrar contraseña'
    : (rightIconAccessibilityLabel ?? 'Acción del campo');

  return (
    <View style={[styles.wrapper, containerStyle]}>
      <View
        style={[
          styles.fieldContainer,
          {
            backgroundColor: tokens.colors.surface,
            borderColor,
            paddingHorizontal: tokens.spacing.md,
            gap: tokens.spacing.sm,
          },
        ]}
      >
        <AppIcon name={leftIcon} size={22} color={leftIconColor} />

        <TextInput
          {...textInputProps}
          onFocus={handleFocus}
          onBlur={handleBlur}
          secureTextEntry={isPassword ? !isPasswordVisible : false}
          placeholderTextColor={tokens.colors.textSecondary}
          selectionColor={tokens.colors.primary}
          style={[
            styles.input,
            {
              fontFamily: tokens.typography.families.regular,
              color: tokens.colors.textPrimary,
            },
          ]}
        />

        {resolvedRightIcon ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={resolvedRightLabel}
            hitSlop={8}
            onPress={handleRightPress}
            style={styles.rightButton}
          >
            <AppIcon
              name={resolvedRightIcon}
              size={22}
              color={hasError ? tokens.colors.error : tokens.colors.textSecondary}
            />
          </Pressable>
        ) : null}
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
  fieldContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 56,
    borderRadius: 18,
    borderWidth: 1.5,
  },
  input: {
    flex: 1,
    fontSize: 16,
    lineHeight: 22,
    paddingVertical: 12,
  },
  rightButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  errorText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 16,
  },
});
