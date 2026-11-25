import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useAppTheme } from '@/hooks';

export type LogoSize = 'sm' | 'md' | 'lg' | 'xl';
export type LogoLayout = 'horizontal' | 'vertical';

export interface NemiPayLogoProps {
  size?: LogoSize;
  layout?: LogoLayout;
  showWordmark?: boolean;
  testID?: string;
}

const SIZE_CONFIG: Record<
  LogoSize,
  { iconSize: number; fontSize: number; lineHeight: number; gap: number; letterSpacing: number }
> = {
  sm: { iconSize: 24, fontSize: 18, lineHeight: 24, gap: 6, letterSpacing: -0.4 },
  md: { iconSize: 32, fontSize: 22, lineHeight: 28, gap: 8, letterSpacing: -0.5 },
  lg: { iconSize: 40, fontSize: 26, lineHeight: 32, gap: 10, letterSpacing: -0.5 },
  xl: { iconSize: 64, fontSize: 34, lineHeight: 40, gap: 10, letterSpacing: -0.7 },
};

export function NemiPayLogo({
  size = 'md',
  layout = 'horizontal',
  showWordmark = true,
  testID,
}: NemiPayLogoProps) {
  const { tokens } = useAppTheme();
  const dimensions = SIZE_CONFIG[size];
  const isVertical = layout === 'vertical';

  return (
    <View
      style={[
        styles.container,
        isVertical ? styles.vertical : styles.horizontal,
        { gap: dimensions.gap },
      ]}
      testID={testID}
    >
      <Svg
        width={dimensions.iconSize}
        height={dimensions.iconSize}
        viewBox="0 0 64 64"
        accessibilityElementsHidden
        importantForAccessibility="no"
      >
        <Path
          d="M14 48L20.5 16.5C21.4 12.1 26.8 10.6 29.8 13.9L31.5 15.8L25 49.5C24.2 53.5 18.8 54.6 15.5 51.8C14.3 50.8 13.7 49.4 14 48Z"
          fill={tokens.colors.primaryLight}
        />
        <Path
          d="M21 15.5C22.4 12.4 26.8 11.7 29.4 14.3L33.2 18.5L26.8 25.4L21 15.5Z"
          fill={tokens.colors.primaryDark}
          fillOpacity={0.28}
        />
        <Path
          d="M32.5 48.2L39 14.5C39.8 10.5 45.2 9.4 48.5 12.2C49.7 13.2 50.3 14.6 50 16L43.5 47.5C42.6 51.9 37.2 53.4 34.2 50.1L32.5 48.2Z"
          fill={tokens.colors.primaryLight}
        />
        <Path
          d="M20.2 17.2C19.3 13.3 23.6 10.4 27.1 12.4C28.1 13 28.9 13.8 29.6 14.8L43.8 46.8C44.7 50.7 40.4 53.6 36.9 51.6C35.9 51 35.1 50.2 34.4 49.2L20.2 17.2Z"
          fill={tokens.colors.primary}
        />
        <Path
          d="M35.5 44.5L43.2 46.6C42.6 50.4 38.6 52.4 35.2 50.4C34.4 49.9 33.8 49.2 33.4 48.4L35.5 44.5Z"
          fill={tokens.colors.primaryDark}
          fillOpacity={0.32}
        />
      </Svg>
      {showWordmark ? (
        <Text
          style={{
            fontFamily: tokens.typography.families.bold,
            fontSize: dimensions.fontSize,
            lineHeight: dimensions.lineHeight,
            letterSpacing: dimensions.letterSpacing,
            color: tokens.colors.textPrimary,
          }}
        >
          NemiPay
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  horizontal: {
    flexDirection: 'row',
  },
  vertical: {
    flexDirection: 'column',
  },
});
