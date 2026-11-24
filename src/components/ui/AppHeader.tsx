import React from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { useAppTheme } from '@/hooks';
import { AppIcon } from './AppIcon';

export interface AppHeaderProps {
  title?: string;
  subtitle?: string;
  onBackPress?: () => void;
  backTestID?: string;
  leftSlot?: React.ReactNode;
  centerSlot?: React.ReactNode;
  rightSlot?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export function AppHeader({
  title,
  subtitle,
  onBackPress,
  backTestID = 'header-back-button',
  leftSlot,
  centerSlot,
  rightSlot,
  style,
  testID,
}: AppHeaderProps) {
  const { tokens } = useAppTheme();

  return (
    <View style={[styles.container, { paddingTop: tokens.spacing.space2 }, style]} testID={testID}>
      <View style={styles.sideSlot}>
        {leftSlot ? (
          leftSlot
        ) : onBackPress ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Regresar"
            onPress={onBackPress}
            testID={backTestID}
            style={({ pressed }) => [
              styles.backButton,
              {
                borderRadius: tokens.radius.radiusFull,
                backgroundColor: pressed ? tokens.colors.lavenderSoft : 'transparent',
              },
            ]}
          >
            <AppIcon name="chevron-left" size={24} color={tokens.colors.textPrimary} />
          </Pressable>
        ) : null}
      </View>

      <View style={styles.centerSlot}>
        {centerSlot ? (
          centerSlot
        ) : title ? (
          <View style={styles.titleStack}>
            <Text
              numberOfLines={1}
              style={[
                styles.title,
                {
                  fontFamily: tokens.typography.families.semiBold,
                  color: tokens.colors.textPrimary,
                },
              ]}
            >
              {title}
            </Text>
            {subtitle ? (
              <Text
                numberOfLines={1}
                style={[
                  styles.subtitle,
                  {
                    fontFamily: tokens.typography.families.regular,
                    color: tokens.colors.textSecondary,
                  },
                ]}
              >
                {subtitle}
              </Text>
            ) : null}
          </View>
        ) : null}
      </View>

      <View style={[styles.sideSlot, styles.rightSlot]}>{rightSlot}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 48,
  },
  sideSlot: {
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
  },
  rightSlot: {
    alignItems: 'flex-end',
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -8,
  },
  centerSlot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  titleStack: {
    alignItems: 'center',
    gap: 2,
  },
  title: {
    fontSize: 18,
    lineHeight: 24,
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 12,
    lineHeight: 16,
  },
});
