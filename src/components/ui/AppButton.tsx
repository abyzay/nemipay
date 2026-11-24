import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useAppTheme } from '@/hooks';
import { AppIcon, type AppIconName } from './AppIcon';

export type AppButtonVariant = 'primary' | 'secondary' | 'outlined' | 'destructive';
export type AppButtonSize = 'md' | 'lg';

export interface AppButtonProps {
  label: string;
  onPress: () => void;
  variant?: AppButtonVariant;
  size?: AppButtonSize;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  leftIcon?: AppIconName;
  rightIcon?: AppIconName;
  accessibilityLabel?: string;
  testID?: string;
  style?: StyleProp<ViewStyle>;
}

export function AppButton({
  label,
  onPress,
  variant = 'primary',
  size = 'lg',
  disabled = false,
  loading = false,
  fullWidth = true,
  leftIcon,
  rightIcon,
  accessibilityLabel,
  testID,
  style,
}: AppButtonProps) {
  const { tokens } = useAppTheme();
  const reducedMotion = useReducedMotion();
  const scale = useSharedValue(1);
  const isDisabled = disabled || loading;

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    if (isDisabled || reducedMotion) return;
    scale.set(withTiming(0.98, { duration: tokens.animation.micro }));
  };

  const handlePressOut = () => {
    if (reducedMotion) return;
    scale.set(withTiming(1, { duration: tokens.animation.micro }));
  };

  const getColors = (pressed: boolean) => {
    if (isDisabled) {
      if (variant === 'outlined') {
        return {
          background: 'transparent',
          border: tokens.colors.border,
          text: tokens.colors.textDisabled,
        };
      }
      return {
        background: tokens.colors.surfaceSecondary,
        border: tokens.colors.surfaceSecondary,
        text: tokens.colors.textDisabled,
      };
    }

    switch (variant) {
      case 'secondary':
        return {
          background: pressed ? tokens.colors.lavenderBorder : tokens.colors.lavender,
          border: pressed ? tokens.colors.lavenderBorder : tokens.colors.lavender,
          text: tokens.colors.primary,
        };
      case 'outlined':
        return {
          background: pressed ? tokens.colors.lavenderSoft : 'transparent',
          border: tokens.colors.lavenderBorder,
          text: tokens.colors.primary,
        };
      case 'destructive':
        return {
          background: pressed ? '#FCD9D9' : tokens.colors.errorLight,
          border: pressed ? '#FCD9D9' : tokens.colors.errorLight,
          text: tokens.colors.error,
        };
      case 'primary':
      default:
        return {
          background: pressed ? tokens.colors.primaryDark : tokens.colors.primary,
          border: pressed ? tokens.colors.primaryDark : tokens.colors.primary,
          text: tokens.colors.textOnPrimary,
        };
    }
  };

  const height = size === 'md' ? 48 : tokens.layout.buttonHeight;

  return (
    <Animated.View style={[animatedStyle, fullWidth ? styles.fullWidth : undefined]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? label}
        accessibilityState={{ disabled: isDisabled, busy: loading }}
        disabled={isDisabled}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        testID={testID}
        style={({ pressed }) => {
          const colors = getColors(pressed);
          return [
            styles.base,
            {
              height,
              borderRadius: tokens.radius.radiusButton,
              paddingHorizontal: tokens.spacing.space5,
              backgroundColor: colors.background,
              borderColor: colors.border,
              borderWidth: variant === 'outlined' ? 1 : 0,
              opacity: pressed && !isDisabled ? 0.96 : 1,
            },
            style,
          ];
        }}
      >
        {({ pressed }) => {
          const colors = getColors(pressed);
          return (
            <View style={[styles.content, { gap: tokens.spacing.space2 }]}>
              {loading ? (
                <ActivityIndicator
                  size="small"
                  color={colors.text}
                  testID={testID ? `${testID}-spinner` : undefined}
                />
              ) : leftIcon ? (
                <AppIcon name={leftIcon} size={20} color={colors.text} />
              ) : null}

              <Text
                numberOfLines={1}
                style={[
                  styles.label,
                  {
                    fontFamily: tokens.typography.families.semiBold,
                    color: colors.text,
                  },
                ]}
              >
                {label}
              </Text>

              {!loading && rightIcon ? (
                <AppIcon name={rightIcon} size={20} color={colors.text} />
              ) : null}
            </View>
          );
        }}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  fullWidth: {
    width: '100%',
  },
  base: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 16,
    lineHeight: 24,
  },
});
