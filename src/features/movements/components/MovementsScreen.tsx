import React, { useMemo, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { ScreenContainer } from '@/components/layout';
import { AppChip, AppEmptyState } from '@/components/ui';
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
      <View style={[styles.header, { paddingTop: tokens.spacing.space3 }]}>
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
        style={[
          styles.filterRow,
          { gap: tokens.spacing.space2, marginVertical: tokens.spacing.space4 },
        ]}
      >
        {FILTERS.map((filter) => (
          <AppChip
            key={filter.id}
            label={filter.label}
            selected={selectedFilter === filter.id}
            onPress={() => setSelectedFilter(filter.id)}
            testID={`movements-filter-${filter.id}`}
          />
        ))}
      </View>

      <FlatList
        data={filteredMovements}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: tokens.spacing.space6 }}
        renderItem={({ item, index }) => (
          <MovementRow
            movement={item}
            showDivider={index < filteredMovements.length - 1}
            testID={`movement-row-${item.id}`}
          />
        )}
        ListEmptyComponent={
          <AppEmptyState
            icon="receipt"
            title="Sin movimientos en esta categoría"
            description="Los cobros CoDi que recibas aparecerán aquí."
          />
        }
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: 4,
  },
  title: {
    fontSize: 24,
    lineHeight: 32,
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
});
