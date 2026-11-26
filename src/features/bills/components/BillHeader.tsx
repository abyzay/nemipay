import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AppIcon } from '@/components/ui';
import { useAppTheme } from '@/hooks';
import { formatCurrencyFromCents } from '@/utils/currency';
import type { BillParticipantDetail, BillSummary } from '../types';

export interface BillHeaderProps {
  bill: BillSummary;
  participants: readonly BillParticipantDetail[];
  activeIndex: number;
  onSelectIndex: (index: number) => void;
}

export function BillHeader({ bill, participants, activeIndex, onSelectIndex }: BillHeaderProps) {
  const { tokens } = useAppTheme();
  const remainingCents = Math.max(0, bill.totalCents - bill.collectedCents);
  const progressRatio =
    bill.totalCents > 0 ? Math.min(1, bill.collectedCents / bill.totalCents) : 0;

  return (
    <View style={styles.wrapper} testID="bill-header-summary">
      <View
        style={[
          styles.summaryCard,
          tokens.shadows.card,
          {
            backgroundColor: tokens.colors.background,
            borderColor: tokens.colors.border,
            borderRadius: tokens.radius.radiusCard,
            paddingHorizontal: tokens.spacing.space4,
            paddingVertical: tokens.spacing.space3 + 2,
            gap: tokens.spacing.space3,
          },
        ]}
      >
        <View style={styles.amountsRow}>
          <View style={styles.metric}>
            <Text
              style={[
                styles.metricLabel,
                {
                  fontFamily: tokens.typography.families.medium,
                  color: tokens.colors.textSecondary,
                },
              ]}
            >
              Total
            </Text>
            <Text
              testID="bill-total-amount"
              style={[
                styles.metricValue,
                tokens.typography.tabularNums,
                { fontFamily: tokens.typography.families.bold, color: tokens.colors.textPrimary },
              ]}
            >
              {formatCurrencyFromCents(bill.totalCents)}
            </Text>
            <Text
              style={[
                styles.currencyLabel,
                {
                  fontFamily: tokens.typography.families.medium,
                  color: tokens.colors.textSecondary,
                },
              ]}
            >
              MXN
            </Text>
          </View>

          <View style={styles.metric}>
            <Text
              style={[
                styles.metricLabel,
                {
                  fontFamily: tokens.typography.families.medium,
                  color: tokens.colors.textSecondary,
                },
              ]}
            >
              Recaudado
            </Text>
            <Text
              testID="bill-collected-amount"
              style={[
                styles.metricValue,
                tokens.typography.tabularNums,
                { fontFamily: tokens.typography.families.bold, color: tokens.colors.success },
              ]}
            >
              {formatCurrencyFromCents(bill.collectedCents)}
            </Text>
            <Text
              style={[
                styles.currencyLabel,
                {
                  fontFamily: tokens.typography.families.medium,
                  color: tokens.colors.textSecondary,
                },
              ]}
            >
              MXN
            </Text>
          </View>

          <View style={[styles.metric, { alignItems: 'flex-end' }]}>
            <Text
              style={[
                styles.metricLabel,
                {
                  fontFamily: tokens.typography.families.medium,
                  color: tokens.colors.textSecondary,
                },
              ]}
            >
              Restante
            </Text>
            <Text
              testID="bill-remaining-amount"
              style={[
                styles.metricValue,
                tokens.typography.tabularNums,
                { fontFamily: tokens.typography.families.bold, color: tokens.colors.primary },
              ]}
            >
              {formatCurrencyFromCents(remainingCents)}
            </Text>
            <Text
              style={[
                styles.currencyLabel,
                {
                  fontFamily: tokens.typography.families.medium,
                  color: tokens.colors.textSecondary,
                },
              ]}
            >
              MXN
            </Text>
          </View>
        </View>

        <View
          style={[
            styles.progressTrack,
            {
              backgroundColor: tokens.colors.lavender,
              borderRadius: tokens.radius.radiusFull,
            },
          ]}
        >
          <View
            testID="bill-progress-fill"
            style={[
              styles.progressFill,
              {
                width: `${Math.max(3, Math.round(progressRatio * 100))}%`,
                backgroundColor:
                  bill.status === 'PAID' ? tokens.colors.success : tokens.colors.primary,
                borderRadius: tokens.radius.radiusFull,
              },
            ]}
          />
        </View>
      </View>

      {participants.length > 0 ? (
        <View style={styles.cardsGrid} testID="bill-indicators-row">
          {participants.map((p, idx) => {
            const isSelected = idx === activeIndex;
            const isPaid = p.state === 'PAID';
            const isReview = p.state === 'REVIEW';
            const displayAmount = p.charge?.amountCents ?? p.shareCents ?? 0;

            const borderColor = isSelected
              ? tokens.colors.primary
              : isPaid
                ? tokens.colors.success
                : tokens.colors.border;

            const iconColor = isPaid
              ? tokens.colors.success
              : isReview
                ? tokens.colors.error
                : isSelected || p.state === 'PAYING'
                  ? tokens.colors.primary
                  : tokens.colors.gray[500];

            const statusBadge = isPaid
              ? {
                  label: 'Pagada',
                  bg: tokens.colors.successLight,
                  text: tokens.colors.success,
                }
              : isReview
                ? {
                    label: 'Revisar',
                    bg: tokens.colors.errorLight,
                    text: tokens.colors.error,
                  }
                : {
                    label: 'Pendiente',
                    bg: tokens.colors.lavender,
                    text: tokens.colors.primary,
                  };

            return (
              <Pressable
                key={p.id}
                accessibilityRole="button"
                accessibilityLabel={`Ir a ${p.label || `Persona ${p.position}`}`}
                onPress={() => onSelectIndex(idx)}
                testID={`bill-indicator-${idx}`}
                style={({ pressed }) => [
                  styles.participantCard,
                  tokens.shadows.card,
                  {
                    backgroundColor: tokens.colors.background,
                    borderColor,
                    borderWidth: isSelected ? 1.5 : 1,
                    borderRadius: tokens.radius.radiusCard,
                    opacity: pressed ? 0.9 : 1,
                  },
                ]}
              >
                {isSelected || isPaid ? (
                  <View
                    style={[
                      styles.cornerCheck,
                      {
                        backgroundColor: isPaid ? tokens.colors.success : tokens.colors.primary,
                        borderRadius: tokens.radius.radiusFull,
                      },
                    ]}
                  >
                    <AppIcon
                      name="check"
                      size={11}
                      color={tokens.colors.textOnPrimary}
                      strokeWidth={3}
                    />
                  </View>
                ) : null}

                <View style={styles.cardBody}>
                  <View style={styles.avatarBox}>
                    <AppIcon name="user-round" size={22} color={iconColor} />
                  </View>

                  <View style={styles.cardMeta}>
                    <Text
                      numberOfLines={1}
                      style={[
                        styles.cardName,
                        {
                          fontFamily: tokens.typography.families.medium,
                          color: tokens.colors.textSecondary,
                        },
                      ]}
                    >
                      {p.label || `Persona ${p.position}`}
                    </Text>

                    <Text
                      numberOfLines={1}
                      style={[
                        styles.cardAmount,
                        tokens.typography.tabularNums,
                        {
                          fontFamily: tokens.typography.families.bold,
                          color: tokens.colors.textPrimary,
                        },
                      ]}
                    >
                      {formatCurrencyFromCents(displayAmount)}
                    </Text>

                    <View
                      style={[
                        styles.statusPill,
                        {
                          backgroundColor: statusBadge.bg,
                          borderRadius: tokens.radius.radiusFull,
                        },
                      ]}
                    >
                      <Text
                        numberOfLines={1}
                        style={[
                          styles.statusPillText,
                          {
                            fontFamily: tokens.typography.families.semiBold,
                            color: statusBadge.text,
                          },
                        ]}
                      >
                        {statusBadge.label}
                      </Text>
                    </View>
                  </View>
                </View>
              </Pressable>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 12,
  },
  summaryCard: {
    borderWidth: 1,
  },
  amountsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  metric: {
    gap: 1,
  },
  metricLabel: {
    fontSize: 12,
    lineHeight: 16,
  },
  metricValue: {
    fontSize: 18,
    lineHeight: 24,
  },
  currencyLabel: {
    fontSize: 11,
    lineHeight: 14,
  },
  progressTrack: {
    height: 6,
    overflow: 'hidden',
    width: '100%',
  },
  progressFill: {
    height: '100%',
  },
  cardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  participantCard: {
    flexBasis: '48%',
    flexGrow: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    position: 'relative',
  },
  cornerCheck: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatarBox: {
    width: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardMeta: {
    flex: 1,
    minWidth: 0,
    gap: 2,
    alignItems: 'flex-start',
  },
  cardName: {
    fontSize: 12,
    lineHeight: 16,
    paddingRight: 18,
  },
  cardAmount: {
    fontSize: 16,
    lineHeight: 20,
  },
  statusPill: {
    marginTop: 2,
    paddingHorizontal: 10,
    paddingVertical: 2,
  },
  statusPillText: {
    fontSize: 11,
    lineHeight: 15,
  },
});
