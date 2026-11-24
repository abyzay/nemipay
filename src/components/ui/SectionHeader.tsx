import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useAppTheme } from '@/hooks';
import { AppIcon } from './AppIcon';

export interface SectionHeaderProps {
  title: string;
  actionLabel?: string;
  onActionPress?: () => void;
  actionTestID?: string;
}

export function SectionHeader({
  title,
  actionLabel,
  onActionPress,
  actionTestID,
}: SectionHeaderProps) {
  const { tokens } = useAppTheme();

  return (
    <View style={styles.container}>
      <Text
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

      {actionLabel && onActionPress ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={actionLabel}
          onPress={onActionPress}
          hitSlop={8}
          testID={actionTestID}
          style={({ pressed }) => [
            styles.actionButton,
            {
              gap: tokens.spacing.space1,
              opacity: pressed ? 0.7 : 1,
            },
          ]}
        >
          <Text
            style={[
              styles.actionText,
              {
                fontFamily: tokens.typography.families.semiBold,
                color: tokens.colors.primary,
              },
            ]}
          >
            {actionLabel}
          </Text>
          <AppIcon name="chevron-right" size={16} color={tokens.colors.primary} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 18,
    lineHeight: 26,
    letterSpacing: -0.2,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  actionText: {
    fontSize: 14,
    lineHeight: 20,
  },
});
