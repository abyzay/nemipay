import React from 'react';
import { type StyleProp, type TextStyle } from 'react-native';
import { Ionicons, type IoniconsIconName } from '@react-native-vector-icons/ionicons';
import { useAppTheme } from '@/hooks';

export interface AppIconProps {
  name: IoniconsIconName;
  size?: number;
  color?: string;
  style?: StyleProp<TextStyle>;
  testID?: string;
}

export function AppIcon({ name, size = 24, color, style, testID }: AppIconProps) {
  const { tokens } = useAppTheme();

  return (
    <Ionicons
      name={name}
      size={size}
      color={color ?? tokens.colors.textPrimary}
      style={style}
      testID={testID}
    />
  );
}
