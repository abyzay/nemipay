import { Platform, ViewStyle } from 'react-native';

export interface ElevationStyle {
  shadowColor: string;
  shadowOffset: { width: number; height: number };
  shadowOpacity: number;
  shadowRadius: number;
  elevation: number;
}

const createElevation = (
  height: number,
  shadowOpacity: number,
  shadowRadius: number,
  elevation: number
): ViewStyle =>
  Platform.select<ViewStyle>({
    ios: {
      shadowColor: '#064E3B',
      shadowOffset: { width: 0, height },
      shadowOpacity,
      shadowRadius,
    },
    android: {
      elevation,
    },
    default: {
      shadowColor: '#064E3B',
      shadowOffset: { width: 0, height },
      shadowOpacity,
      shadowRadius,
      elevation,
    },
  }) ?? {};

/**
 * Elevaciones muy sutiles coherentes con la estética minimalista de NemiPay.
 */
export const elevations = {
  none: createElevation(0, 0, 0, 0),
  xs: createElevation(1, 0.04, 2, 1),
  sm: createElevation(2, 0.06, 6, 2),
  md: createElevation(4, 0.08, 10, 4),
} as const;

export type ElevationTokens = typeof elevations;
