import React from 'react';
import { StyleSheet, View } from 'react-native';
import { SectionHeader } from '@/components/ui';
import { useAppTheme } from '@/hooks';
import type { ReceivedMovement } from '../types';
import { MovementRow } from './MovementRow';

export interface RecentMovementsSectionProps {
  movements: ReceivedMovement[];
  onSeeAllPress: () => void;
}

export function RecentMovementsSection({ movements, onSeeAllPress }: RecentMovementsSectionProps) {
  const { tokens } = useAppTheme();
  const visibleMovements = movements.slice(0, 3);

  return (
    <View
      style={[styles.container, { gap: tokens.spacing.xs + 2 }]}
      testID="recent-movements-section"
    >
      <SectionHeader
        title="Actividad reciente"
        actionLabel="Ver todas"
        onActionPress={onSeeAllPress}
        actionTestID="dashboard-see-all-movements-button"
      />

      <View style={[styles.list, { gap: tokens.spacing.xs }]}>
        {visibleMovements.map((movement, index) => (
          <MovementRow
            key={movement.id}
            movement={movement}
            compact
            testID={`dashboard-movement-item-${index}`}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  list: {
    width: '100%',
  },
});
