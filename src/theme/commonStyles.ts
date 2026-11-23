import { StyleSheet } from 'react-native';
import { lightColors } from './colors';
import { elevations } from './elevations';
import { radii } from './radii';
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
    backgroundColor: lightColors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: lightColors.border,
    padding: layoutMetrics.cardPadding,
    ...elevations.xs,
  },
  divider: {
    height: 1,
    backgroundColor: lightColors.border,
    marginVertical: spacing.sm,
  },
  touchTarget: {
    minHeight: layoutMetrics.minTouchTarget,
    justifyContent: 'center',
  },
});
