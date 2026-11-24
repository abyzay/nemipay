import { StyleSheet } from 'react-native';
import { lightColors } from './colors';
import { radius } from './radius';
import { shadows } from './shadows';
import { layoutMetrics, spacing } from './spacing';

export const commonStyles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: lightColors.background,
    paddingHorizontal: layoutMetrics.screenHorizontalPadding,
  },
  centeredContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  surfaceCard: {
    backgroundColor: lightColors.surfaceCard,
    borderRadius: radius.radiusCard,
    borderWidth: 1,
    borderColor: lightColors.border,
    padding: layoutMetrics.cardPadding,
    ...shadows.card,
  },
  secondaryCard: {
    backgroundColor: lightColors.surface,
    borderRadius: radius.radiusButton,
    padding: layoutMetrics.cardPadding,
  },
  divider: {
    height: 1,
    backgroundColor: lightColors.divider,
    marginVertical: spacing.space3,
  },
  touchTarget: {
    minHeight: layoutMetrics.minTouchTarget,
    justifyContent: 'center',
  },
});
