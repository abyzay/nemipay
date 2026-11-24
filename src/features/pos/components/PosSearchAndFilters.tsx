import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { AppChip, AppInput } from '@/components/ui';
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
    <View style={[styles.container, { gap: tokens.spacing.space2 + 2 }]}>
      <AppInput
        leftIcon="search"
        value={searchQuery}
        onChangeText={onSearchChange}
        placeholder="Buscar producto rápido..."
        returnKeyType="search"
        autoCorrect={false}
        rightIcon={searchQuery.length > 0 ? 'close' : undefined}
        onRightIconPress={searchQuery.length > 0 ? () => onSearchChange('') : undefined}
        rightIconAccessibilityLabel="Limpiar búsqueda"
        rightIconTestID="pos-search-clear-button"
        testID="pos-search-input"
      />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[styles.chipsRow, { gap: tokens.spacing.space2 }]}
      >
        {FILTER_OPTIONS.map((category) => (
          <AppChip
            key={category}
            label={category}
            selected={selectedCategory === category}
            onPress={() => onSelectCategory(category)}
            testID={`pos-category-${category}`}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  chipsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
