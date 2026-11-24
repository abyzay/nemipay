import { configureFonts } from 'react-native-paper';
import type { MD3Type, MD3TypescaleKey } from 'react-native-paper/lib/typescript/types';

/**
 * Familia tipográfica oficial de NemiPay: Plus Jakarta Sans.
 */
export const fontFamilies = {
  regular: 'PlusJakartaSans_400Regular',
  medium: 'PlusJakartaSans_500Medium',
  semiBold: 'PlusJakartaSans_600SemiBold',
  bold: 'PlusJakartaSans_700Bold',
  extraBold: 'PlusJakartaSans_800ExtraBold',
} as const;

export const typographyScale = {
  display: {
    fontFamily: fontFamilies.bold,
    fontSize: 36,
    lineHeight: 44,
    letterSpacing: -0.8,
  },
  h1: {
    fontFamily: fontFamilies.bold,
    fontSize: 32,
    lineHeight: 40,
    letterSpacing: -0.6,
  },
  h2: {
    fontFamily: fontFamilies.semiBold,
    fontSize: 24,
    lineHeight: 32,
    letterSpacing: -0.4,
  },
  h3: {
    fontFamily: fontFamilies.semiBold,
    fontSize: 20,
    lineHeight: 28,
    letterSpacing: -0.2,
  },
  h4: {
    fontFamily: fontFamilies.semiBold,
    fontSize: 18,
    lineHeight: 26,
    letterSpacing: -0.1,
  },
  body: {
    fontFamily: fontFamilies.regular,
    fontSize: 16,
    lineHeight: 24,
  },
  bodySmall: {
    fontFamily: fontFamilies.regular,
    fontSize: 14,
    lineHeight: 20,
  },
  caption: {
    fontFamily: fontFamilies.medium,
    fontSize: 12,
    lineHeight: 16,
  },
  button: {
    fontFamily: fontFamilies.semiBold,
    fontSize: 16,
    lineHeight: 24,
  },
} as const;

export const tabularNumbersStyle = {
  fontVariant: ['tabular-nums'] as 'tabular-nums'[],
};

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

export type FontFamilies = typeof fontFamilies;
export type TypographyScale = typeof typographyScale;
