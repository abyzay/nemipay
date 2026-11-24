import React, { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { ScreenContainer } from '@/components/layout';
import { useAppTheme } from '@/hooks';
import { getMockReportPeriods } from '../services';
import type { ReportPeriodId } from '../types';
import { ReportsHeader } from './ReportsHeader';
import { ReportsKpiGrid } from './ReportsKpiGrid';
import { ReportsPeriodSelector } from './ReportsPeriodSelector';
import { ReportsSummaryList } from './ReportsSummaryList';
import { ReportsTrendChart } from './ReportsTrendChart';

export interface ReportsScreenProps {
  onBackPress?: () => void;
}

export function ReportsScreen({ onBackPress }: ReportsScreenProps) {
  const { tokens } = useAppTheme();
  const periods = useMemo(() => getMockReportPeriods(), []);
  const [selectedPeriodId, setSelectedPeriodId] = useState<ReportPeriodId>('week');
  const [periodModalVisible, setPeriodModalVisible] = useState(false);

  const activePeriod = useMemo(
    () => periods.find((period) => period.id === selectedPeriodId) ?? periods[0],
    [periods, selectedPeriodId]
  );

  if (!activePeriod) {
    return null;
  }

  return (
    <ScreenContainer edges={['top']} scrollable>
      <View style={[styles.content, { gap: tokens.spacing.md, paddingBottom: tokens.spacing.md }]}>
        <ReportsHeader
          onBackPress={onBackPress}
          onCalendarPress={() => setPeriodModalVisible(true)}
        />

        <ReportsPeriodSelector
          periods={periods}
          selectedPeriod={activePeriod}
          modalVisible={periodModalVisible}
          onOpenModal={() => setPeriodModalVisible(true)}
          onCloseModal={() => setPeriodModalVisible(false)}
          onSelectPeriod={setSelectedPeriodId}
        />

        <ReportsKpiGrid
          totalReceivedCents={activePeriod.totalReceivedCents}
          paymentsCount={activePeriod.paymentsCount}
        />

        <ReportsTrendChart
          points={activePeriod.chartPoints}
          yAxisStepValue={activePeriod.yAxisStepValue}
          yAxisMaxValue={activePeriod.yAxisMaxValue}
        />

        <ReportsSummaryList
          averageTicketCents={activePeriod.averageTicketCents}
          highestPaymentCents={activePeriod.highestPaymentCents}
          qrSharePercent={activePeriod.qrSharePercent}
        />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
  },
});
