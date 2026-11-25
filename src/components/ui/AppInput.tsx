import React, { useRef, useState } from 'react';
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
import { useAppTheme } from '@/hooks';
import { AppIcon, type AppIconName } from './AppIcon';

export type AppInputVariant = 'outlined' | 'soft';

export interface AppInputProps extends Omit<
  TextInputProps,
  'style' | 'secureTextEntry' | 'placeholderTextColor'
> {
  label?: string;
  helperText?: string;
  variant?: AppInputVariant;
  leftIcon?: AppIconName;
  prefix?: string;
  isPassword?: boolean;
  rightIcon?: AppIconName;
  onRightIconPress?: () => void;
  rightIconAccessibilityLabel?: string;
  rightIconTestID?: string;
  error?: string;
  disabled?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
  errorTestID?: string;
}

export function AppInput({
  label,
  helperText,
  variant = 'outlined',
  leftIcon,
  prefix,
  isPassword = false,
  rightIcon,
  onRightIconPress,
  rightIconAccessibilityLabel,
  rightIconTestID,
  error,
  disabled = false,
  editable,
  containerStyle,
  errorTestID,
  onFocus,
  onBlur,
  ...textInputProps
}: AppInputProps) {
  const { tokens } = useAppTheme();
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const isDisabled = disabled || editable === false;
  const hasError = Boolean(error);
  const isSoft = variant === 'soft';

  const borderColor = hasError
    ? tokens.colors.error
    : isFocused
      ? tokens.colors.primary
      : isSoft
        ? tokens.colors.divider
        : tokens.colors.border;

  const backgroundColor = isDisabled
    ? tokens.colors.surfaceSecondary
    : isSoft
      ? isFocused
        ? tokens.colors.background
        : tokens.colors.surface
      : tokens.colors.background;

  const fieldRadius = isSoft ? tokens.radius.radiusLarge : tokens.radius.radiusInput;

  const iconColor = hasError
    ? tokens.colors.error
    : isFocused
      ? tokens.colors.primary
      : isDisabled
        ? tokens.colors.textDisabled
        : tokens.colors.textSecondary;

  const handleFocus = (event: NativeSyntheticEvent<TargetedEvent>) => {
    setIsFocused(true);
    onFocus?.(event);
  };

  const handleBlur = (event: NativeSyntheticEvent<TargetedEvent>) => {
    setIsFocused(false);
    onBlur?.(event);
  };

  const resolvedRightIcon: AppIconName | undefined = isPassword
    ? isPasswordVisible
      ? 'eye'
      : 'eye-off'
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
      {label ? (
        <Text
          style={[
            styles.label,
            {
              fontFamily: tokens.typography.families.semiBold,
              color: hasError ? tokens.colors.error : tokens.colors.gray[700],
              marginBottom: tokens.spacing.space1 + 2,
            },
          ]}
        >
          {label}
        </Text>
      ) : null}

      <View
        style={[
          styles.fieldContainer,
          {
            height: tokens.layout.inputHeight,
            backgroundColor,
            borderColor,
            borderRadius: fieldRadius,
            paddingHorizontal: tokens.spacing.space4,
            gap: tokens.spacing.space3,
          },
        ]}
      >
        {leftIcon ? <AppIcon name={leftIcon} size={20} color={iconColor} /> : null}

        {prefix ? (
          <Text
            style={[
              styles.prefix,
              {
                fontFamily: tokens.typography.families.semiBold,
                color: isDisabled ? tokens.colors.textDisabled : tokens.colors.primary,
              },
            ]}
          >
            {prefix}
          </Text>
        ) : null}

        <TextInput
          {...textInputProps}
          editable={!isDisabled}
          onFocus={handleFocus}
          onBlur={handleBlur}
          secureTextEntry={isPassword ? !isPasswordVisible : false}
          placeholderTextColor={tokens.colors.textMuted}
          selectionColor={tokens.colors.primary}
          style={[
            styles.input,
            {
              fontFamily: tokens.typography.families.regular,
              color: isDisabled ? tokens.colors.textSecondary : tokens.colors.textPrimary,
            },
          ]}
        />

        {resolvedRightIcon ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={resolvedRightLabel}
            disabled={isDisabled}
            hitSlop={8}
            onPress={handleRightPress}
            testID={rightIconTestID}
            style={styles.rightButton}
          >
            <AppIcon
              name={resolvedRightIcon}
              size={20}
              color={hasError ? tokens.colors.error : tokens.colors.textSecondary}
            />
          </Pressable>
        ) : null}
      </View>

      {hasError ? (
        <View
          accessibilityRole="alert"
          style={[styles.feedbackRow, { marginTop: tokens.spacing.space1 + 2, gap: 6 }]}
        >
          <AppIcon name="circle-alert" size={14} color={tokens.colors.error} />
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
      ) : helperText ? (
        <Text
          style={[
            styles.helperText,
            {
              fontFamily: tokens.typography.families.regular,
              color: tokens.colors.textSecondary,
              marginTop: tokens.spacing.space1 + 2,
            },
          ]}
        >
          {helperText}
        </Text>
      ) : null}
    </View>
  );
}

export interface AppOtpInputProps {
  length?: number;
  value: string;
  onChangeText: (value: string) => void;
  error?: string;
  disabled?: boolean;
  testID?: string;
}

export function AppOtpInput({
  length = 6,
  value,
  onChangeText,
  error,
  disabled = false,
  testID,
}: AppOtpInputProps) {
  const { tokens } = useAppTheme();
  const inputRef = useRef<React.ComponentRef<typeof TextInput>>(null);
  const [focused, setFocused] = useState(false);
  const digits = value.replace(/[^0-9]/g, '').slice(0, length);

  return (
    <View style={styles.wrapper} testID={testID}>
      <Pressable
        accessibilityRole="none"
        onPress={() => inputRef.current?.focus()}
        style={[styles.otpRow, { gap: tokens.spacing.space2 }]}
      >
        {Array.from({ length }).map((_, index) => {
          const char = digits[index] ?? '';
          const isCurrent = focused && index === Math.min(digits.length, length - 1);
          return (
            <View
              key={index}
              style={[
                styles.otpBox,
                {
                  backgroundColor: disabled
                    ? tokens.colors.surfaceSecondary
                    : tokens.colors.background,
                  borderColor: error
                    ? tokens.colors.error
                    : isCurrent || char
                      ? tokens.colors.primary
                      : tokens.colors.lavenderBorder,
                  borderRadius: tokens.radius.radiusInput,
                },
              ]}
            >
              <Text
                style={[
                  styles.otpDigit,
                  {
                    fontFamily: tokens.typography.families.bold,
                    color: tokens.colors.textPrimary,
                  },
                ]}
              >
                {char}
              </Text>
            </View>
          );
        })}
      </Pressable>

      <TextInput
        ref={inputRef}
        value={digits}
        onChangeText={(next) => onChangeText(next.replace(/[^0-9]/g, '').slice(0, length))}
        keyboardType="number-pad"
        maxLength={length}
        editable={!disabled}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={styles.hiddenOtpInput}
        caretHidden
      />

      {error ? (
        <View
          accessibilityRole="alert"
          style={[styles.feedbackRow, { marginTop: tokens.spacing.space2, gap: 6 }]}
        >
          <AppIcon name="circle-alert" size={14} color={tokens.colors.error} />
          <Text
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
  label: {
    fontSize: 13,
    lineHeight: 18,
  },
  fieldContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
  },
  prefix: {
    fontSize: 16,
    lineHeight: 22,
  },
  input: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
    paddingVertical: 10,
  },
  rightButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  feedbackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  errorText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 16,
  },
  helperText: {
    fontSize: 12,
    lineHeight: 16,
    paddingHorizontal: 4,
  },
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  otpBox: {
    flex: 1,
    height: 54,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  otpDigit: {
    fontSize: 20,
    lineHeight: 26,
    textAlign: 'center',
  },
  hiddenOtpInput: {
    position: 'absolute',
    opacity: 0,
    width: 1,
    height: 1,
  },
});
