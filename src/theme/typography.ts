import { configureFonts } from 'react-native-paper';
import type { MD3Type, MD3TypescaleKey } from 'react-native-paper/lib/typescript/types';

export const fontFamilies = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semiBold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
} as const;

export const typographyScale = {
  display: { fontFamily: fontFamilies.bold, fontSize: 32, lineHeight: 40 },
  headline: { fontFamily: fontFamilies.bold, fontSize: 24, lineHeight: 32 },
  title: { fontFamily: fontFamilies.semiBold, fontSize: 18, lineHeight: 26 },
  subtitle: { fontFamily: fontFamilies.medium, fontSize: 16, lineHeight: 24 },
  body: { fontFamily: fontFamilies.regular, fontSize: 15, lineHeight: 22 },
  caption: { fontFamily: fontFamilies.regular, fontSize: 13, lineHeight: 18 },
  label: { fontFamily: fontFamilies.semiBold, fontSize: 13, lineHeight: 18 },
  amountHero: { fontFamily: fontFamilies.bold, fontSize: 36, lineHeight: 44 },
} as const;

const paperFontOverrides: Partial<Record<MD3TypescaleKey, Partial<MD3Type>>> = {
  displayLarge: { fontFamily: fontFamilies.bold },
  displayMedium: { fontFamily: fontFamilies.bold },
  displaySmall: { fontFamily: fontFamilies.semiBold },
  headlineLarge: { fontFamily: fontFamilies.bold },
  headlineMedium: { fontFamily: fontFamilies.semiBold },
  headlineSmall: { fontFamily: fontFamilies.semiBold },
  titleLarge: { fontFamily: fontFamilies.semiBold },
  titleMedium: { fontFamily: fontFamilies.medium },
  titleSmall: { fontFamily: fontFamilies.medium },
  labelLarge: { fontFamily: fontFamilies.semiBold },
  labelMedium: { fontFamily: fontFamilies.medium },
  labelSmall: { fontFamily: fontFamilies.medium },
  bodyLarge: { fontFamily: fontFamilies.regular },
  bodyMedium: { fontFamily: fontFamilies.regular },
  bodySmall: { fontFamily: fontFamilies.regular },
};

export const paperFonts = configureFonts({ config: paperFontOverrides });
