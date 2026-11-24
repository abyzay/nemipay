import {
  fontFamilies,
  getColors,
  getPaperTheme,
  grayScale,
  lightColors,
  nemipayLightTheme,
  nemipayTheme,
  radii,
  radius,
  shadows,
  spacing,
} from '@/theme';

describe('Identidad visual y Design System de NemiPay', () => {
  it('expone exactamente la paleta oficial de colores del Design System', () => {
    // Marca
    expect(lightColors.primary).toBe('#7200D9');
    expect(lightColors.primaryLight).toBe('#941EFF');
    expect(lightColors.primaryDark).toBe('#5600A8');
    expect(lightColors.lavender).toBe('#F3E9FF');
    expect(lightColors.lavenderSoft).toBe('#FAF7FF');

    // Superficies
    expect(lightColors.background).toBe('#FFFFFF');
    expect(lightColors.surface).toBe('#F8F7FB');
    expect(lightColors.surfaceSecondary).toBe('#F4F2F7');
    expect(lightColors.border).toBe('#E8E5EF');
    expect(lightColors.divider).toBe('#F0EDF4');

    // Texto
    expect(lightColors.textPrimary).toBe('#17152F');
    expect(lightColors.textSecondary).toBe('#817B91');
    expect(lightColors.textMuted).toBe('#A6A1B3');
    expect(lightColors.textDisabled).toBe('#C5C1CD');
    expect(lightColors.textOnPrimary).toBe('#FFFFFF');

    // Semánticos
    expect(lightColors.success).toBe('#16A36A');
    expect(lightColors.successLight).toBe('#E6F7EF');
    expect(lightColors.warning).toBe('#F59E0B');
    expect(lightColors.warningLight).toBe('#FFF7E6');
    expect(lightColors.error).toBe('#EF4444');
    expect(lightColors.errorLight).toBe('#FEECEC');
    expect(lightColors.info).toBe('#3B82F6');

    // Escala de grises
    expect(grayScale[50]).toBe('#FAF9FC');
    expect(grayScale[900]).toBe('#17152F');
  });

  it('configura React Native Paper con tema claro, radios definidos y tipografía Plus Jakarta Sans', () => {
    expect(nemipayLightTheme.dark).toBe(false);
    expect(nemipayLightTheme.roundness).toBe(radii.md);
    expect(nemipayLightTheme.colors.primary).toBe('#7200D9');
    expect(nemipayLightTheme.colors.background).toBe('#FFFFFF');
    expect(nemipayLightTheme.colors.surface).toBe('#FFFFFF');
    expect(fontFamilies.regular).toBe('PlusJakartaSans_400Regular');
    expect(fontFamilies.semiBold).toBe('PlusJakartaSans_600SemiBold');
    expect(fontFamilies.bold).toBe('PlusJakartaSans_700Bold');
    expect(nemipayLightTheme.fonts.bodyMedium.fontFamily).toBe(fontFamilies.regular);
    expect(nemipayLightTheme.fonts.titleLarge.fontFamily).toBe(fontFamilies.semiBold);
    expect(nemipayLightTheme.fonts.headlineLarge.fontFamily).toBe(fontFamilies.bold);
  });

  it('expone escalas de espaciado, radios, sombras y punto de extensión para tema oscuro', () => {
    expect(nemipayTheme.spacing).toEqual(spacing);
    expect(spacing.space1).toBe(4);
    expect(spacing.space6).toBe(24);
    expect(radius.radiusCard).toBe(18);
    expect(radius.radiusButton).toBe(16);
    expect(radius.radiusInput).toBe(14);
    expect(shadows.card).toBeDefined();
    expect(shadows.floating).toBeDefined();
    expect(getColors('light')).toEqual(lightColors);
    expect(getPaperTheme('light')).toBe(nemipayLightTheme);
    expect(getPaperTheme('dark')).toBe(nemipayLightTheme);
  });
});
