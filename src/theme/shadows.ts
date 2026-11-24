import { Platform, type ViewStyle } from 'react-native';

export interface ShadowStyle {
  shadowColor: string;
  shadowOffset: { width: number; height: number };
  shadowOpacity: number;
  shadowRadius: number;
  elevation: number;
}

const SHADOW_COLOR = '#241044';

function createShadow(
  offsetY: number,
  shadowOpacity: number,
  shadowRadius: number,
  elevation: number
): ViewStyle {
  if (offsetY === 0 && shadowOpacity === 0 && shadowRadius === 0 && elevation === 0) {
    return (
      Platform.select<ViewStyle>({
        ios: {
          shadowColor: 'transparent',
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0,
          shadowRadius: 0,
        },
        android: {
          elevation: 0,
        },
        default: {
          shadowColor: 'transparent',
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0,
          shadowRadius: 0,
          elevation: 0,
        },
      }) ?? {}
    );
  }

  return (
    Platform.select<ViewStyle>({
      ios: {
        shadowColor: SHADOW_COLOR,
        shadowOffset: { width: 0, height: offsetY },
        shadowOpacity,
        shadowRadius,
      },
      android: {
        elevation,
      },
      default: {
        shadowColor: SHADOW_COLOR,
        shadowOffset: { width: 0, height: offsetY },
        shadowOpacity,
        shadowRadius,
        elevation,
      },
    }) ?? {}
  );
}

/**
 * Sombras discretas de NemiPay inspiradas en la estética minimalista de Qlub.
 */
export const shadows = {
  none: createShadow(0, 0, 0, 0),
  card: createShadow(3, 0.045, 12, 2),
  floating: createShadow(5, 0.08, 18, 4),
} as const;

export type ShadowTokens = typeof shadows;
