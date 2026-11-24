import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { AppIcon } from '@/components/ui';
import { useAppTheme } from '@/hooks';
import { POS_CATEGORIES, type PosCategory } from '../types';

export interface PosSearchAndFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  selectedCategory: PosCategory | 'Todos';
  onSelectCategory: (category: PosCategory | 'Todos') => void;
}

const FILTER_OPTIONS: readonly (PosCategory | 'Todos')[] = ['Todos', ...POS_CATEGORIES];

export function PosSearchAndFilters({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onSelectCategory,
}: PosSearchAndFiltersProps) {
  const { tokens } = useAppTheme();

  return (
    <View style={[styles.container, { gap: tokens.spacing.xs }]}>
      <View
        style={[
          styles.searchContainer,
          {
            backgroundColor: tokens.colors.surface,
            borderColor: tokens.colors.border,
            borderRadius: tokens.radii.md,
            paddingHorizontal: tokens.spacing.sm,
            gap: tokens.spacing.xs,
          },
        ]}
      >
        <AppIcon name="search-outline" size={18} color={tokens.colors.textSecondary} />
        <TextInput
          value={searchQuery}
          onChangeText={onSearchChange}
          placeholder="Buscar producto rápido..."
          placeholderTextColor={tokens.colors.textSecondary}
          returnKeyType="search"
          autoCorrect={false}
          testID="pos-search-input"
          style={[
            styles.searchInput,
            {
              fontFamily: tokens.typography.families.regular,
              color: tokens.colors.textPrimary,
            },
          ]}
        />
        {searchQuery.length > 0 ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Limpiar búsqueda"
            onPress={() => onSearchChange('')}
            hitSlop={8}
            testID="pos-search-clear-button"
          >
            <AppIcon name="close-circle" size={18} color={tokens.colors.textSecondary} />
          </Pressable>
        ) : null}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[styles.chipsRow, { gap: tokens.spacing.xs }]}
      >
        {FILTER_OPTIONS.map((category) => {
          const isSelected = selectedCategory === category;
          return (
            <Pressable
              key={category}
              accessibilityRole="button"
              onPress={() => onSelectCategory(category)}
              testID={`pos-category-${category}`}
              style={[
                styles.chip,
                {
                  borderRadius: tokens.radii.full,
                  borderColor: isSelected ? tokens.colors.primary : tokens.colors.border,
                  backgroundColor: isSelected ? tokens.colors.primary : tokens.colors.surface,
                  paddingHorizontal: tokens.spacing.sm,
                  paddingVertical: tokens.spacing.xxs + 2,
                },
              ]}
            >
              <Text
                style={[
                  styles.chipText,
                  {
                    fontFamily: tokens.typography.families.semiBold,
                    color: isSelected ? tokens.colors.onPrimary : tokens.colors.textSecondary,
                  },
                ]}
              >
                {category}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    minHeight: 42,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    lineHeight: 19,
    paddingVertical: 8,
  },
  chipsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chip: {
    borderWidth: 1,
  },
  chipText: {
    fontSize: 12,
    lineHeight: 16,
  },
});
