import React, { useEffect } from 'react';
import { type DimensionValue, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useAppTheme } from '@/hooks';

export interface AppSkeletonProps {
  width?: DimensionValue;
  height?: number;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export function AppSkeleton({
  width = '100%',
  height = 16,
  borderRadius,
  style,
  testID,
}: AppSkeletonProps) {
  const { tokens } = useAppTheme();
  const reducedMotion = useReducedMotion();
  const opacity = useSharedValue(0.65);

  useEffect(() => {
    if (reducedMotion) {
      opacity.value = 0.75;
      return;
    }

    opacity.value = withRepeat(withTiming(1, { duration: 850 }), -1, true);
  }, [opacity, reducedMotion]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      testID={testID}
      style={[
        {
          width,
          height,
          borderRadius: borderRadius ?? tokens.radius.radiusSM,
          backgroundColor: tokens.colors.surfaceSecondary,
        },
        animatedStyle,
        style,
      ]}
    />
  );
}
