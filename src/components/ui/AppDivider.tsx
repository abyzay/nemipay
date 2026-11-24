import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useAppTheme } from '@/hooks';

export interface AppDividerProps {
  verticalMargin?: number;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export function AppDivider({ verticalMargin = 0, style, testID }: AppDividerProps) {
  const { tokens } = useAppTheme();

  return (
    <View
      testID={testID}
      style={[
        styles.divider,
        {
          backgroundColor: tokens.colors.divider,
          marginVertical: verticalMargin,
        },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  divider: {
    height: 1,
    width: '100%',
  },
});
