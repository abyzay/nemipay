import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useAppTheme } from '@/hooks';

export interface AuthBackdropProps {
  testID?: string;
}

/**
 * Fondo orgánico sutil en tonos lavanda del Design System para las pantallas de autenticación y perfil.
 */
export function AuthBackdrop({ testID }: AuthBackdropProps = {}) {
  const { tokens } = useAppTheme();

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill} testID={testID}>
      <Svg
        width="100%"
        height="100%"
        viewBox="0 0 390 844"
        preserveAspectRatio="none"
        accessibilityElementsHidden
        importantForAccessibility="no"
      >
        <Path
          d="M250 0H390V148C340 160 288 138 264 98C244 64 234 26 250 0Z"
          fill={tokens.colors.lavender}
          fillOpacity={0.6}
        />
        <Path
          d="M0 720C58 708 118 732 146 776C162 802 162 828 152 844H0V720Z"
          fill={tokens.colors.lavenderSoft}
          fillOpacity={0.9}
        />
        <Path
          d="M390 738C346 728 300 752 282 794C272 816 272 832 278 844H390V738Z"
          fill={tokens.colors.lavender}
          fillOpacity={0.45}
        />
      </Svg>
    </View>
  );
}
