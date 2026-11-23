import {
  fontFamilies,
  getColors,
  getPaperTheme,
  lightColors,
  nemipayLightTheme,
  nemipayTheme,
  radii,
  spacing,
} from '@/theme';

describe('Identidad visual y tema de NemiPay', () => {
  it('expone exactamente la paleta oficial de colores', () => {
    expect(lightColors.primary).toBe('#087F5B');
    expect(lightColors.primaryDark).toBe('#064E3B');
    expect(lightColors.secondary).toBe('#DDF5EA');
    expect(lightColors.background).toBe('#F7FAF8');
    expect(lightColors.surface).toBe('#FFFFFF');
    expect(lightColors.textPrimary).toBe('#202B26');
    expect(lightColors.textSecondary).toBe('#78857E');
    expect(lightColors.border).toBe('#E7EDE9');
    expect(lightColors.success).toBe('#15966A');
    expect(lightColors.warning).toBe('#E8A23A');
    expect(lightColors.error).toBe('#D64545');
  });

  it('configura React Native Paper con tema claro, radios moderados y tipografía Inter', () => {
    expect(nemipayLightTheme.dark).toBe(false);
    expect(nemipayLightTheme.roundness).toBe(radii.md);
    expect(nemipayLightTheme.colors.primary).toBe('#087F5B');
    expect(nemipayLightTheme.colors.background).toBe('#F7FAF8');
    expect(nemipayLightTheme.colors.surface).toBe('#FFFFFF');
    expect(nemipayLightTheme.fonts.bodyMedium.fontFamily).toBe(fontFamilies.regular);
    expect(nemipayLightTheme.fonts.titleLarge.fontFamily).toBe(fontFamilies.semiBold);
    expect(nemipayLightTheme.fonts.headlineLarge.fontFamily).toBe(fontFamilies.bold);
  });

  it('expone escalas de espaciado y punto de extensión para tema oscuro futuro', () => {
    expect(nemipayTheme.spacing).toEqual(spacing);
    expect(getColors('light')).toEqual(lightColors);
    expect(getPaperTheme('light')).toBe(nemipayLightTheme);
    expect(getPaperTheme('dark')).toBe(nemipayLightTheme);
  });
});
