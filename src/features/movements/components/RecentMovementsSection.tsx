import React from 'react';
import { StyleSheet, View } from 'react-native';
import { AppCard, SectionHeader } from '@/components/ui';
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
      style={[styles.container, { gap: tokens.spacing.space3 }]}
      testID="recent-movements-section"
    >
      <SectionHeader
        title="Actividad reciente"
        actionLabel="Ver todas"
        onActionPress={onSeeAllPress}
        actionTestID="dashboard-see-all-movements-button"
      />

      <AppCard
        variant="standard"
        padding="none"
        style={{ paddingHorizontal: tokens.spacing.space4, paddingVertical: tokens.spacing.space1 }}
      >
        {visibleMovements.map((movement, index) => (
          <MovementRow
            key={movement.id}
            movement={movement}
            compact
            showDivider={index < visibleMovements.length - 1}
            testID={`dashboard-movement-item-${index}`}
          />
        ))}
      </AppCard>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
});
