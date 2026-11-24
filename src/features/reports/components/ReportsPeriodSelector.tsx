import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AppBottomSheet, AppCard, AppIcon } from '@/components/ui';
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
              backgroundColor: pressed ? tokens.colors.lavender : tokens.colors.surfaceSecondary,
              borderRadius: tokens.radius.radiusFull,
              paddingHorizontal: tokens.spacing.space4,
              paddingVertical: tokens.spacing.space2,
              gap: tokens.spacing.space2,
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
          <AppIcon name="chevron-down" size={16} color={tokens.colors.primary} />
        </Pressable>
      </View>

      <AppBottomSheet
        visible={modalVisible}
        onClose={onCloseModal}
        title="Periodo del reporte"
        closeAccessibilityLabel="Cerrar selector de periodo"
        testID="reports-period-modal"
      >
        <View style={[styles.optionsList, { gap: tokens.spacing.space2 + 2 }]}>
          {periods.map((period) => {
            const isSelected = period.id === selectedPeriod.id;
            return (
              <AppCard
                key={period.id}
                variant={isSelected ? 'selected' : 'secondary'}
                padding="md"
                elevated={false}
                onPress={() => {
                  onSelectPeriod(period.id);
                  onCloseModal();
                }}
                testID={`reports-period-option-${period.id}`}
              >
                <View style={styles.optionRow}>
                  <Text
                    style={[
                      styles.optionText,
                      {
                        fontFamily: tokens.typography.families.semiBold,
                        color: isSelected ? tokens.colors.primary : tokens.colors.textPrimary,
                      },
                    ]}
                  >
                    {period.label}
                  </Text>
                  {isSelected ? (
                    <AppIcon name="circle-check" size={20} color={tokens.colors.primary} />
                  ) : null}
                </View>
              </AppCard>
            );
          })}
        </View>
      </AppBottomSheet>
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
    minHeight: 38,
  },
  pillText: {
    fontSize: 14,
    lineHeight: 20,
  },
  optionsList: {
    width: '100%',
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  optionText: {
    fontSize: 15,
    lineHeight: 20,
  },
});
