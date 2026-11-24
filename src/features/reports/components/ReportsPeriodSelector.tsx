import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { AppIcon, SurfaceCard } from '@/components/ui';
import { useAppTheme } from '@/hooks';
import type { ReportPeriodId, ReportPeriodSummary } from '../types';

export interface ReportsPeriodSelectorProps {
  periods: ReportPeriodSummary[];
  selectedPeriod: ReportPeriodSummary;
  modalVisible: boolean;
  onOpenModal: () => void;
  onCloseModal: () => void;
  onSelectPeriod: (periodId: ReportPeriodId) => void;
}

export function ReportsPeriodSelector({
  periods,
  selectedPeriod,
  modalVisible,
  onOpenModal,
  onCloseModal,
  onSelectPeriod,
}: ReportsPeriodSelectorProps) {
  const { tokens } = useAppTheme();

  return (
    <>
      <View style={styles.pillRow}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Periodo seleccionado: ${selectedPeriod.label}`}
          onPress={onOpenModal}
          testID="reports-period-trigger"
          style={({ pressed }) => [
            styles.pillButton,
            {
              backgroundColor: pressed ? tokens.colors.secondary : tokens.colors.surface,
              borderColor: tokens.colors.border,
              borderRadius: tokens.radii.full,
              paddingHorizontal: tokens.spacing.md,
              paddingVertical: tokens.spacing.xs,
              gap: tokens.spacing.xs,
            },
          ]}
        >
          <Text
            testID="reports-period-label"
            style={[
              styles.pillText,
              {
                fontFamily: tokens.typography.families.semiBold,
                color: tokens.colors.textPrimary,
              },
            ]}
          >
            {selectedPeriod.label}
          </Text>
          <AppIcon name="chevron-down" size={16} color={tokens.colors.textPrimary} />
        </Pressable>
      </View>

      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={onCloseModal}>
        <View style={[styles.backdrop, { backgroundColor: tokens.colors.primaryDark }]}>
          <Pressable
            accessibilityLabel="Cerrar selector de periodo"
            style={StyleSheet.absoluteFill}
            onPress={onCloseModal}
          />
          <SurfaceCard style={styles.modalCard} testID="reports-period-modal">
            <View style={styles.modalHeader}>
              <Text
                style={[
                  styles.modalTitle,
                  {
                    fontFamily: tokens.typography.families.bold,
                    color: tokens.colors.textPrimary,
                  },
                ]}
              >
                Periodo del reporte
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Cerrar"
                onPress={onCloseModal}
                hitSlop={8}
              >
                <AppIcon name="close" size={20} color={tokens.colors.textSecondary} />
              </Pressable>
            </View>

            <View
              style={[styles.optionsList, { gap: tokens.spacing.xs, marginTop: tokens.spacing.sm }]}
            >
              {periods.map((period) => {
                const isSelected = period.id === selectedPeriod.id;
                return (
                  <Pressable
                    key={period.id}
                    accessibilityRole="button"
                    onPress={() => {
                      onSelectPeriod(period.id);
                      onCloseModal();
                    }}
                    testID={`reports-period-option-${period.id}`}
                    style={[
                      styles.optionRow,
                      {
                        backgroundColor: isSelected
                          ? tokens.colors.secondary
                          : tokens.colors.background,
                        borderColor: isSelected ? tokens.colors.primary : tokens.colors.border,
                        borderRadius: tokens.radii.md,
                        paddingHorizontal: tokens.spacing.md,
                        paddingVertical: tokens.spacing.sm,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        {
                          fontFamily: tokens.typography.families.semiBold,
                          color: isSelected ? tokens.colors.primaryDark : tokens.colors.textPrimary,
                        },
                      ]}
                    >
                      {period.label}
                    </Text>
                    {isSelected ? (
                      <AppIcon name="checkmark-circle" size={20} color={tokens.colors.primary} />
                    ) : null}
                  </Pressable>
                );
              })}
            </View>
          </SurfaceCard>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  pillRow: {
    alignItems: 'center',
  },
  pillButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    minHeight: 38,
  },
  pillText: {
    fontSize: 15,
    lineHeight: 20,
  },
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    opacity: 0.98,
  },
  modalCard: {
    width: '100%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalTitle: {
    fontSize: 17,
    lineHeight: 22,
  },
  optionsList: {
    width: '100%',
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
  },
  optionText: {
    fontSize: 15,
    lineHeight: 20,
  },
});
