import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppTheme } from '@/hooks';
import type { ReportRange } from '../types';

const RANGE_OPTIONS: { id: ReportRange; label: string }[] = [
  { id: '7d', label: '7 días' },
  { id: '30d', label: '30 días' },
  { id: '90d', label: '90 días' },
];

export interface ReportRangeSelectorProps {
  value: ReportRange;
  onChange: (range: ReportRange) => void;
}

export function ReportRangeSelector({ value, onChange }: ReportRangeSelectorProps) {
  const { tokens } = useAppTheme();

  return (
    <View style={[styles.row, { gap: tokens.spacing.space2 + 2 }]} testID="reports-range-selector">
      {RANGE_OPTIONS.map((option) => {
        const selected = value === option.id;

        return (
          <Pressable
            key={option.id}
            accessibilityRole="button"
            accessibilityLabel={option.label}
            accessibilityState={{ selected }}
            onPress={() => onChange(option.id)}
            testID={`reports-range-${option.id}`}
            style={({ pressed }) => [
              styles.pillPressable,
              {
                borderRadius: tokens.radius.radiusFull,
                opacity: pressed ? 0.9 : 1,
              },
            ]}
          >
            {selected ? (
              <LinearGradient
                colors={['#6200D8', '#7200D9', '#5E17EB']}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={[
                  styles.pillInner,
                  {
                    borderRadius: tokens.radius.radiusFull,
                  },
                ]}
              >
                <Text
                  numberOfLines={1}
                  style={[
                    styles.pillText,
                    {
                      fontFamily: tokens.typography.families.semiBold,
                      color: tokens.colors.textOnPrimary,
                    },
                  ]}
                >
                  {option.label}
                </Text>
              </LinearGradient>
            ) : (
              <View
                style={[
                  styles.pillInner,
                  {
                    borderRadius: tokens.radius.radiusFull,
                    backgroundColor:
                      option.id === '90d'
                        ? 'rgba(243, 233, 255, 0.58)'
                        : 'rgba(243, 233, 255, 0.85)',
                  },
                ]}
              >
                <Text
                  numberOfLines={1}
                  style={[
                    styles.pillText,
                    {
                      fontFamily: tokens.typography.families.medium,
                      color: tokens.colors.textPrimary,
                    },
                  ]}
                >
                  {option.label}
                </Text>
              </View>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pillPressable: {
    flex: 1,
  },
  pillInner: {
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  pillText: {
    fontSize: 13,
    lineHeight: 18,
  },
});
