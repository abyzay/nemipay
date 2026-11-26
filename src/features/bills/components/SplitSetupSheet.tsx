import React, { useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { AppBottomSheet, AppButton, AppIcon, AppInput } from '@/components/ui';
import { env } from '@/config/env';
import { parseAmountInputToCents } from '@/features/payments/utils/parseAmountCents';
import { useAppTheme } from '@/hooks';
import { generateIdempotencyKey } from '@/services/security/crypto';
import { formatCurrencyFromCents } from '@/utils/currency';
import { useCreateBill } from '../hooks/useCreateBill';
import type { CreateBillInput, SplitMode } from '../types';
import {
  MAX_LABEL_LENGTH,
  MAX_SPLIT_PEOPLE,
  MIN_BILL_TOTAL_CENTS,
  MIN_EQUAL_PEOPLE,
  computeCustomRemainingCents,
  computeEqualShares,
  getMaxEqualPeopleForTotal,
  validateCustomShares,
} from '../utils/splitMath';

export interface SplitSetupSheetProps {
  visible: boolean;
  totalCents: number;
  concept?: string;
  items?: { productId: string; quantity: number }[];
  onClose: () => void;
  onBillCreated?: (billId: string) => void;
}

interface CustomRowDraft {
  key: string;
  label: string;
  amountText: string;
}

function sanitizeAmountText(raw: string): string {
  const cleaned = raw.replace(/[^0-9.]/g, '');
  const dotIdx = cleaned.indexOf('.');
  if (dotIdx === -1) return cleaned;
  const intPart = cleaned.slice(0, dotIdx);
  const decPart = cleaned
    .slice(dotIdx + 1)
    .replace(/\./g, '')
    .slice(0, 2);
  return `${intPart}.${decPart}`;
}

export function SplitSetupSheet({
  visible,
  totalCents,
  concept,
  items,
  onClose,
  onBillCreated,
}: SplitSetupSheetProps) {
  const { tokens } = useAppTheme();
  const createBillMutation = useCreateBill();

  const [mode, setMode] = useState<SplitMode>('EQUAL');
  const [people, setPeople] = useState<number>(2);
  const [customRows, setCustomRows] = useState<CustomRowDraft[]>(() => [
    { key: 'row-1', label: 'Persona 1', amountText: '' },
    { key: 'row-2', label: 'Persona 2', amountText: '' },
  ]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const idempotencyKeyRef = useRef<string | null>(null);

  const maxPeople = useMemo(() => getMaxEqualPeopleForTotal(totalCents), [totalCents]);
  const clampedPeople = Math.max(MIN_EQUAL_PEOPLE, Math.min(maxPeople, people));

  const resetIntent = () => {
    idempotencyKeyRef.current = null;
    setErrorMessage(null);
  };

  const equalPreview = useMemo(() => {
    if (totalCents < MIN_BILL_TOTAL_CENTS) return [];
    return computeEqualShares(totalCents, clampedPeople);
  }, [clampedPeople, totalCents]);

  const parsedCustomShares = useMemo(
    () =>
      customRows.map((row) => ({
        label: row.label.trim(),
        amountCents: parseAmountInputToCents(row.amountText, env.maxChargeCents),
      })),
    [customRows]
  );

  const customRemainingCents = useMemo(
    () => computeCustomRemainingCents(totalCents, parsedCustomShares),
    [parsedCustomShares, totalCents]
  );

  const customValidationError = useMemo(
    () => (mode === 'CUSTOM' ? validateCustomShares(totalCents, parsedCustomShares) : null),
    [mode, parsedCustomShares, totalCents]
  );

  const isTotalValid = totalCents >= MIN_BILL_TOTAL_CENTS;
  const canSubmit =
    isTotalValid &&
    !createBillMutation.isPending &&
    (mode !== 'CUSTOM' || customValidationError === null);

  const handleAddCustomRow = () => {
    if (customRows.length >= MAX_SPLIT_PEOPLE) return;
    resetIntent();
    const nextNum = customRows.length + 1;
    setCustomRows((prev) => [
      ...prev,
      { key: `row-${Date.now()}-${nextNum}`, label: `Persona ${nextNum}`, amountText: '' },
    ]);
  };

  const handleRemoveCustomRow = (rowKey: string) => {
    if (customRows.length <= 2) return;
    resetIntent();
    setCustomRows((prev) => prev.filter((r) => r.key !== rowKey));
  };

  const handleCreateBill = async () => {
    if (!canSubmit) return;

    setErrorMessage(null);
    if (!idempotencyKeyRef.current) {
      idempotencyKeyRef.current = generateIdempotencyKey();
    }

    const splitConfig =
      mode === 'EQUAL'
        ? ({ mode: 'EQUAL', people: clampedPeople } as const)
        : mode === 'CUSTOM'
          ? ({
              mode: 'CUSTOM',
              shares: parsedCustomShares.map((s) => ({
                label: s.label || undefined,
                amountCents: s.amountCents,
              })),
            } as const)
          : ({ mode: 'FREE' } as const);

    const payload: CreateBillInput =
      items && items.length > 0
        ? { items, split: splitConfig }
        : {
            amountCents: totalCents,
            concept: concept?.trim() || 'Cuenta compartida',
            split: splitConfig,
          };

    try {
      const created = await createBillMutation.mutateAsync({
        input: payload,
        idempotencyKey: idempotencyKeyRef.current,
      });

      idempotencyKeyRef.current = null;
      onClose();
      if (onBillCreated) {
        onBillCreated(created.billId);
      } else {
        router.push({ pathname: '/bill/[billId]', params: { billId: created.billId } });
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'No pudimos crear la cuenta compartida.'
      );
    }
  };

  const remainderCents = totalCents % clampedPeople;

  return (
    <AppBottomSheet
      visible={visible}
      onClose={onClose}
      title="Dividir cuenta"
      closeAccessibilityLabel="Cerrar división de cuenta"
      closeButtonTestID="split-setup-close-button"
      testID="split-setup-sheet"
    >
      <View style={styles.body}>
        <View
          style={[
            styles.totalBanner,
            {
              backgroundColor: tokens.colors.lavenderSoft,
              borderColor: tokens.colors.lavenderBorder,
              borderRadius: tokens.radius.radiusMD,
              padding: tokens.spacing.space3,
            },
          ]}
        >
          <Text
            style={[
              styles.totalLabel,
              {
                fontFamily: tokens.typography.families.medium,
                color: tokens.colors.textSecondary,
              },
            ]}
          >
            Total a dividir
          </Text>
          <Text
            testID="split-setup-total"
            style={[
              styles.totalAmount,
              tokens.typography.tabularNums,
              {
                fontFamily: tokens.typography.families.bold,
                color: tokens.colors.primary,
              },
            ]}
          >
            {`${formatCurrencyFromCents(totalCents)} MXN`}
          </Text>
        </View>

        {!isTotalValid ? (
          <Text
            testID="split-min-total-error"
            style={[
              styles.errorText,
              { fontFamily: tokens.typography.families.medium, color: tokens.colors.error },
            ]}
          >
            El monto mínimo para dividir cuenta es de $2.00 MXN.
          </Text>
        ) : null}

        <View
          style={[
            styles.modeTrack,
            {
              backgroundColor: tokens.colors.surfaceSecondary,
              borderRadius: tokens.radius.radiusFull,
              padding: 4,
            },
          ]}
        >
          {(
            [
              { id: 'EQUAL', label: 'Equitativa' },
              { id: 'CUSTOM', label: 'Personalizada' },
              { id: 'FREE', label: 'Libre' },
            ] as const
          ).map((option) => {
            const selected = mode === option.id;
            return (
              <Pressable
                key={option.id}
                accessibilityRole="tab"
                accessibilityState={{ selected }}
                onPress={() => {
                  resetIntent();
                  setMode(option.id);
                }}
                testID={`split-mode-${option.id}`}
                style={[
                  styles.modeTab,
                  {
                    backgroundColor: selected ? tokens.colors.primary : 'transparent',
                    borderRadius: tokens.radius.radiusFull,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.modeTabText,
                    {
                      fontFamily: tokens.typography.families.semiBold,
                      color: selected ? tokens.colors.textOnPrimary : tokens.colors.textPrimary,
                    },
                  ]}
                >
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {mode === 'EQUAL' ? (
          <View style={styles.section}>
            <View style={styles.counterRow}>
              <Text
                style={[
                  styles.sectionTitle,
                  {
                    fontFamily: tokens.typography.families.semiBold,
                    color: tokens.colors.textPrimary,
                  },
                ]}
              >
                ¿Entre cuántas personas? (máx. 4)
              </Text>

              <View style={styles.stepper}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Menos personas"
                  disabled={clampedPeople <= MIN_EQUAL_PEOPLE}
                  onPress={() => {
                    resetIntent();
                    setPeople((prev) => Math.max(MIN_EQUAL_PEOPLE, prev - 1));
                  }}
                  testID="split-people-minus"
                  style={[
                    styles.stepBtn,
                    {
                      backgroundColor: tokens.colors.surfaceSecondary,
                      borderRadius: tokens.radius.radiusMD,
                      opacity: clampedPeople <= MIN_EQUAL_PEOPLE ? 0.45 : 1,
                    },
                  ]}
                >
                  <AppIcon name="minus" size={18} color={tokens.colors.primary} />
                </Pressable>

                <Text
                  testID="split-people-count"
                  style={[
                    styles.peopleValue,
                    tokens.typography.tabularNums,
                    {
                      fontFamily: tokens.typography.families.bold,
                      color: tokens.colors.textPrimary,
                    },
                  ]}
                >
                  {clampedPeople}
                </Text>

                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Más personas"
                  disabled={clampedPeople >= maxPeople}
                  onPress={() => {
                    resetIntent();
                    setPeople((prev) => Math.min(maxPeople, prev + 1));
                  }}
                  testID="split-people-plus"
                  style={[
                    styles.stepBtn,
                    {
                      backgroundColor: tokens.colors.primary,
                      borderRadius: tokens.radius.radiusMD,
                      opacity: clampedPeople >= maxPeople ? 0.45 : 1,
                    },
                  ]}
                >
                  <AppIcon name="plus" size={18} color={tokens.colors.textOnPrimary} />
                </Pressable>
              </View>
            </View>

            {equalPreview.length > 0 ? (
              <View
                style={[
                  styles.previewCard,
                  {
                    backgroundColor: tokens.colors.surface,
                    borderColor: tokens.colors.border,
                    borderRadius: tokens.radius.radiusCard,
                    padding: tokens.spacing.space3,
                  },
                ]}
              >
                <Text
                  testID="split-equal-preview"
                  style={[
                    styles.previewSummary,
                    tokens.typography.tabularNums,
                    {
                      fontFamily: tokens.typography.families.semiBold,
                      color: tokens.colors.textPrimary,
                    },
                  ]}
                >
                  {remainderCents === 0
                    ? `${clampedPeople} pagos de ${formatCurrencyFromCents(equalPreview[0]?.shareCents ?? 0)}`
                    : `Primeras ${remainderCents} de ${formatCurrencyFromCents(equalPreview[0]?.shareCents ?? 0)} · restantes de ${formatCurrencyFromCents(equalPreview[equalPreview.length - 1]?.shareCents ?? 0)}`}
                </Text>
                <ScrollView style={styles.previewList} nestedScrollEnabled>
                  {equalPreview.map((share) => (
                    <View key={share.position} style={styles.previewItem}>
                      <Text
                        style={[
                          styles.previewLabel,
                          {
                            fontFamily: tokens.typography.families.regular,
                            color: tokens.colors.textSecondary,
                          },
                        ]}
                      >
                        {share.label}
                      </Text>
                      <Text
                        style={[
                          styles.previewShareAmount,
                          tokens.typography.tabularNums,
                          {
                            fontFamily: tokens.typography.families.semiBold,
                            color: tokens.colors.textPrimary,
                          },
                        ]}
                      >
                        {formatCurrencyFromCents(share.shareCents)}
                      </Text>
                    </View>
                  ))}
                </ScrollView>
              </View>
            ) : null}
          </View>
        ) : null}

        {mode === 'CUSTOM' ? (
          <View style={styles.section}>
            <View
              style={[
                styles.remainingPill,
                {
                  backgroundColor:
                    customRemainingCents === 0
                      ? tokens.colors.successLight
                      : tokens.colors.warningLight,
                  borderRadius: tokens.radius.radiusMD,
                  paddingHorizontal: tokens.spacing.space3,
                  paddingVertical: tokens.spacing.space2,
                },
              ]}
            >
              <Text
                testID="split-custom-remaining"
                style={[
                  styles.remainingText,
                  tokens.typography.tabularNums,
                  {
                    fontFamily: tokens.typography.families.semiBold,
                    color:
                      customRemainingCents === 0
                        ? tokens.colors.success
                        : tokens.colors.warningText,
                  },
                ]}
              >
                {customRemainingCents === 0
                  ? 'Suma exacta lista ✓'
                  : customRemainingCents > 0
                    ? `Falta asignar ${formatCurrencyFromCents(customRemainingCents)}`
                    : `Excede por ${formatCurrencyFromCents(Math.abs(customRemainingCents))}`}
              </Text>
            </View>

            <ScrollView style={styles.customScroll} nestedScrollEnabled>
              <View style={{ gap: tokens.spacing.space2 }}>
                {customRows.map((row, index) => (
                  <View key={row.key} style={styles.customRow}>
                    <View style={styles.customLabelWrap}>
                      <AppInput
                        variant="soft"
                        placeholder={`Persona ${index + 1}`}
                        value={row.label}
                        maxLength={MAX_LABEL_LENGTH}
                        onChangeText={(text) => {
                          resetIntent();
                          setCustomRows((prev) =>
                            prev.map((item) =>
                              item.key === row.key ? { ...item, label: text } : item
                            )
                          );
                        }}
                        testID={`split-custom-label-${index}`}
                      />
                    </View>

                    <View style={styles.customAmountWrap}>
                      <AppInput
                        variant="soft"
                        placeholder="0.00"
                        keyboardType="decimal-pad"
                        value={row.amountText}
                        onChangeText={(text) => {
                          resetIntent();
                          const next = sanitizeAmountText(text);
                          setCustomRows((prev) =>
                            prev.map((item) =>
                              item.key === row.key ? { ...item, amountText: next } : item
                            )
                          );
                        }}
                        testID={`split-custom-amount-${index}`}
                      />
                    </View>

                    {customRows.length > 2 ? (
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={`Quitar parte ${index + 1}`}
                        onPress={() => handleRemoveCustomRow(row.key)}
                        style={[
                          styles.removeRowBtn,
                          {
                            backgroundColor: tokens.colors.errorLight,
                            borderRadius: tokens.radius.radiusMD,
                          },
                        ]}
                      >
                        <AppIcon name="trash-2" size={16} color={tokens.colors.error} />
                      </Pressable>
                    ) : null}
                  </View>
                ))}
              </View>
            </ScrollView>

            {customRows.length < MAX_SPLIT_PEOPLE ? (
              <AppButton
                variant="outlined"
                size="md"
                leftIcon="plus"
                label="Agregar persona"
                onPress={handleAddCustomRow}
                testID="split-custom-add-button"
              />
            ) : null}
          </View>
        ) : null}

        {mode === 'FREE' ? (
          <View
            style={[
              styles.freeInfoCard,
              {
                backgroundColor: tokens.colors.surface,
                borderColor: tokens.colors.border,
                borderRadius: tokens.radius.radiusCard,
                padding: tokens.spacing.space4,
              },
            ]}
          >
            <AppIcon name="user-round" size={24} color={tokens.colors.primary} />
            <Text
              style={[
                styles.freeInfoTitle,
                {
                  fontFamily: tokens.typography.families.semiBold,
                  color: tokens.colors.textPrimary,
                },
              ]}
            >
              Aportaciones libres
            </Text>
            <Text
              style={[
                styles.freeInfoText,
                {
                  fontFamily: tokens.typography.families.regular,
                  color: tokens.colors.textSecondary,
                },
              ]}
            >
              {`Cada persona elige cuánto pagar desde el carrusel hasta liquidar los ${formatCurrencyFromCents(totalCents)}.`}
            </Text>
          </View>
        ) : null}

        {errorMessage ? (
          <Text
            testID="split-setup-error"
            style={[
              styles.errorText,
              { fontFamily: tokens.typography.families.medium, color: tokens.colors.error },
            ]}
          >
            {errorMessage}
          </Text>
        ) : null}

        <AppButton
          variant="primary"
          size="lg"
          leftIcon="qr-code"
          label={createBillMutation.isPending ? 'Creando cuenta…' : 'Crear cuenta'}
          loading={createBillMutation.isPending}
          disabled={!canSubmit}
          onPress={() => void handleCreateBill()}
          style={{ borderRadius: tokens.radius.radiusFull }}
          testID="split-create-bill-button"
        />
      </View>
    </AppBottomSheet>
  );
}

const styles = StyleSheet.create({
  body: {
    width: '100%',
    gap: 14,
  },
  totalBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
  },
  totalLabel: {
    fontSize: 13,
    lineHeight: 18,
  },
  totalAmount: {
    fontSize: 18,
    lineHeight: 24,
  },
  modeTrack: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modeTab: {
    flex: 1,
    paddingVertical: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeTabText: {
    fontSize: 13,
    lineHeight: 18,
  },
  section: {
    gap: 10,
  },
  counterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  stepBtn: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  peopleValue: {
    minWidth: 28,
    textAlign: 'center',
    fontSize: 18,
    lineHeight: 22,
  },
  previewCard: {
    borderWidth: 1,
    gap: 8,
  },
  previewSummary: {
    fontSize: 13,
    lineHeight: 18,
  },
  previewList: {
    maxHeight: 150,
  },
  previewItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  previewLabel: {
    fontSize: 13,
    lineHeight: 18,
  },
  previewShareAmount: {
    fontSize: 13,
    lineHeight: 18,
  },
  remainingPill: {
    alignItems: 'center',
  },
  remainingText: {
    fontSize: 13,
    lineHeight: 18,
  },
  customScroll: {
    maxHeight: 210,
  },
  customRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  customLabelWrap: {
    flex: 1.2,
  },
  customAmountWrap: {
    flex: 1,
  },
  removeRowBtn: {
    width: 40,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  freeInfoCard: {
    borderWidth: 1,
    alignItems: 'center',
    gap: 8,
  },
  freeInfoTitle: {
    fontSize: 15,
    lineHeight: 20,
  },
  freeInfoText: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
  },
});
