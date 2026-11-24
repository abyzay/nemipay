import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { ScreenContainer } from '@/components/layout';
import { useAppTheme } from '@/hooks';
import { getMockMovements } from '../services';
import type { MovementChannel } from '../types';
import { MovementRow } from './MovementRow';

type MovementFilter = 'all' | MovementChannel;

const FILTERS: readonly { id: MovementFilter; label: string }[] = [
  { id: 'all', label: 'Todos' },
  { id: 'codi_qr', label: 'QR CoDi' },
  { id: 'codi_push', label: 'Solicitud CoDi' },
];

export function MovementsScreen() {
  const { tokens } = useAppTheme();
  const [selectedFilter, setSelectedFilter] = useState<MovementFilter>('all');
  const allMovements = useMemo(() => getMockMovements(), []);

  const filteredMovements = useMemo(() => {
    if (selectedFilter === 'all') {
      return allMovements;
    }
    return allMovements.filter((item) => item.channel === selectedFilter);
  }, [allMovements, selectedFilter]);

  return (
    <ScreenContainer edges={['top']}>
      <View style={[styles.header, { paddingTop: tokens.spacing.sm }]}>
        <Text
          style={[
            styles.title,
            {
              fontFamily: tokens.typography.families.bold,
              color: tokens.colors.textPrimary,
            },
          ]}
        >
          Actividad de cobros
        </Text>
        <Text
          style={[
            styles.subtitle,
            {
              fontFamily: tokens.typography.families.regular,
              color: tokens.colors.textSecondary,
            },
          ]}
        >
          Pagos CoDi recibidos en tu negocio
        </Text>
      </View>

      <View
        style={[styles.filterRow, { gap: tokens.spacing.xs, marginVertical: tokens.spacing.md }]}
      >
        {FILTERS.map((filter) => {
          const isSelected = selectedFilter === filter.id;
          return (
            <Pressable
              key={filter.id}
              accessibilityRole="button"
              onPress={() => setSelectedFilter(filter.id)}
              testID={`movements-filter-${filter.id}`}
              style={[
                styles.filterChip,
                {
                  borderRadius: tokens.radii.full,
                  borderColor: isSelected ? tokens.colors.primary : tokens.colors.border,
                  backgroundColor: isSelected ? tokens.colors.primary : tokens.colors.surface,
                  paddingHorizontal: tokens.spacing.sm + 2,
                  paddingVertical: tokens.spacing.xs,
                },
              ]}
            >
              <Text
                style={[
                  styles.filterText,
                  {
                    fontFamily: tokens.typography.families.semiBold,
                    color: isSelected ? tokens.colors.onPrimary : tokens.colors.textSecondary,
                  },
                ]}
              >
                {filter.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <FlatList
        data={filteredMovements}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ gap: tokens.spacing.xs + 2, paddingBottom: tokens.spacing.lg }}
        renderItem={({ item }) => (
          <MovementRow movement={item} testID={`movement-row-${item.id}`} />
        )}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: 4,
  },
  title: {
    fontSize: 22,
    lineHeight: 28,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  filterChip: {
    borderWidth: 1,
  },
  filterText: {
    fontSize: 13,
    lineHeight: 18,
  },
});
