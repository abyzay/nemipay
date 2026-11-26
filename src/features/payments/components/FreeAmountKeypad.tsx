import React, { useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { AppButton, AppCheckbox, AppIcon, AppInput } from '@/components/ui';
import { env } from '@/config/env';
import { SplitSetupSheet } from '@/features/bills/components/SplitSetupSheet';
import { useAppTheme } from '@/hooks';
import { generateIdempotencyKey } from '@/services/security/crypto';
import { formatCurrencyFromCents } from '@/utils/currency';
import { useCreateCharge } from '../hooks/useCreateCharge';
import { applyKeypadKey, parseAmountInputToCents } from '../utils/parseAmountCents';

export interface FreeAmountKeypadProps {
  onChargeCreated?: (chargeId: string) => void;
}

const KEYPAD_ROWS: readonly (readonly string[])[] = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['.', '0', 'backspace'],
];

export function FreeAmountKeypad({ onChargeCreated }: FreeAmountKeypadProps) {
  const { tokens } = useAppTheme();
  const createChargeMutation = useCreateCharge();

  const [amountInput, setAmountInput] = useState('');
  const [conceptVisible, setConceptVisible] = useState(false);
  const [conceptInput, setConceptInput] = useState('');
  const [splitEnabled, setSplitEnabled] = useState(false);
  const [splitSheetVisible, setSplitSheetVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const idempotencyKeyRef = useRef<string | null>(null);

  const amountCents = useMemo(
    () => parseAmountInputToCents(amountInput, env.maxChargeCents),
    [amountInput]
  );

  const handleKeyPress = (key: string) => {
    setErrorMessage(null);
    idempotencyKeyRef.current = null;
    setAmountInput((prev) => applyKeypadKey(prev, key, env.maxChargeCents));
  };

  const handleConceptChange = (text: string) => {
    setErrorMessage(null);
    idempotencyKeyRef.current = null;
    setConceptInput(text);
  };

  const handleChargePress = async () => {
    if (splitEnabled) {
      if (amountCents < 200) {
        setErrorMessage('El monto mínimo para dividir cuenta es de $2.00 MXN.');
        return;
      }
      setErrorMessage(null);
      setSplitSheetVisible(true);
      return;
    }

    if (amountCents < 100 || createChargeMutation.isPending) {
      return;
    }

    setErrorMessage(null);
    if (!idempotencyKeyRef.current) {
      idempotencyKeyRef.current = generateIdempotencyKey();
    }

    const trimmedConcept = conceptInput.trim();

    try {
      const charge = await createChargeMutation.mutateAsync({
        input: {
          amountCents,
          concept: trimmedConcept || 'Cobro NemiPay',
        },
        idempotencyKey: idempotencyKeyRef.current,
      });

      setAmountInput('');
      setConceptInput('');
      setConceptVisible(false);
      idempotencyKeyRef.current = null;

      if (onChargeCreated) {
        onChargeCreated(charge.id);
      } else {
        router.push({ pathname: '/collect', params: { chargeId: charge.id } });
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'No pudimos generar el cobro CoDi.');
    }
  };

  const minRequiredCents = splitEnabled ? 200 : 100;
  const isAmountValid = amountCents >= minRequiredCents;
  const canCharge = isAmountValid && !createChargeMutation.isPending;

  return (
    <View style={[styles.container, { gap: tokens.spacing.space3 }]}>
      <View
        style={[
          styles.amountStage,
          {
            backgroundColor: '#F6F0FF',
            borderColor: 'rgba(114, 0, 217, 0.1)',
            borderRadius: tokens.radius.radiusBalanceCard,
            paddingHorizontal: tokens.spacing.space5,
            paddingVertical: tokens.spacing.space5,
          },
        ]}
      >
        <Text
          style={[
            styles.amountLabel,
            {
              fontFamily: tokens.typography.families.medium,
              color: tokens.colors.textSecondary,
            },
          ]}
        >
          Monto a cobrar
        </Text>

        <View style={styles.amountRow}>
          <Text
            testID="free-amount-display"
            numberOfLines={1}
            adjustsFontSizeToFit
            style={[
              styles.amountValue,
              tokens.typography.tabularNums,
              {
                fontFamily: tokens.typography.families.bold,
                color: isAmountValid ? tokens.colors.primary : tokens.colors.textMuted,
              },
            ]}
          >
            {formatCurrencyFromCents(amountCents)}
          </Text>
          <Text
            style={[
              styles.currencyLabel,
              {
                fontFamily: tokens.typography.families.semiBold,
                color: isAmountValid ? tokens.colors.primaryDark : tokens.colors.textSecondary,
              },
            ]}
          >
            MXN
          </Text>
        </View>

        {!conceptVisible ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => setConceptVisible(true)}
            testID="free-amount-add-concept-toggle"
            style={({ pressed }) => [
              styles.conceptToggle,
              {
                backgroundColor: pressed ? tokens.colors.lavender : tokens.colors.background,
                borderColor: tokens.colors.lavenderBorder,
                borderRadius: tokens.radius.radiusFull,
                paddingHorizontal: tokens.spacing.space3 + 2,
                paddingVertical: tokens.spacing.space1 + 2,
              },
            ]}
          >
            <AppIcon name="plus" size={14} color={tokens.colors.primary} />
            <Text
              style={[
                styles.conceptToggleText,
                {
                  fontFamily: tokens.typography.families.semiBold,
                  color: tokens.colors.primary,
                },
              ]}
            >
              Agregar concepto
            </Text>
          </Pressable>
        ) : (
          <View style={styles.conceptInputWrap}>
            <AppInput
              variant="soft"
              placeholder="Concepto (opcional): Ej. Café y pan"
              value={conceptInput}
              onChangeText={handleConceptChange}
              maxLength={60}
              rightIcon="close"
              onRightIconPress={() => {
                setConceptInput('');
                setConceptVisible(false);
              }}
              rightIconAccessibilityLabel="Quitar concepto"
              testID="free-amount-concept-input"
            />
          </View>
        )}
      </View>

      {errorMessage ? (
        <Text
          testID="free-amount-error"
          style={[
            styles.errorText,
            {
              fontFamily: tokens.typography.families.medium,
              color: tokens.colors.error,
            },
          ]}
        >
          {errorMessage}
        </Text>
      ) : null}

      <View style={[styles.keypadGrid, { gap: tokens.spacing.space2 + 2 }]}>
        {KEYPAD_ROWS.map((row, rowIndex) => (
          <View key={rowIndex} style={[styles.keypadRow, { gap: tokens.spacing.space2 + 2 }]}>
            {row.map((key) => (
              <Pressable
                key={key}
                accessibilityRole="button"
                accessibilityLabel={key === 'backspace' ? 'Borrar' : key}
                onPress={() => handleKeyPress(key)}
                testID={`keypad-key-${key}`}
                style={({ pressed }) => [
                  styles.keypadButton,
                  tokens.shadows.card,
                  {
                    backgroundColor: pressed ? tokens.colors.lavender : tokens.colors.background,
                    borderColor: pressed ? tokens.colors.lavenderBorder : tokens.colors.border,
                    borderRadius: tokens.radius.radiusButton,
                  },
                ]}
              >
                {key === 'backspace' ? (
                  <AppIcon name="chevron-left" size={22} color={tokens.colors.primary} />
                ) : (
                  <Text
                    style={[
                      styles.keypadKeyText,
                      tokens.typography.tabularNums,
                      {
                        fontFamily: tokens.typography.families.semiBold,
                        color: tokens.colors.textPrimary,
                      },
                    ]}
                  >
                    {key}
                  </Text>
                )}
              </Pressable>
            ))}
          </View>
        ))}
      </View>

      <AppCheckbox
        checked={splitEnabled}
        onToggle={(next) => {
          setErrorMessage(null);
          setSplitEnabled(next);
        }}
        error={
          splitEnabled && amountCents > 0 && amountCents < 200
            ? 'El monto mínimo para dividir cuenta es de $2.00 MXN ($1.00 por persona).'
            : undefined
        }
        errorTestID="free-amount-split-min-error"
        accessibilityLabel="Dividir cuenta entre varias personas"
        testID="free-amount-split-checkbox"
      >
        <Pressable
          onPress={() => {
            setErrorMessage(null);
            setSplitEnabled((prev) => !prev);
          }}
        >
          <Text
            style={{
              fontFamily: tokens.typography.families.semiBold,
              fontSize: 14,
              color: tokens.colors.textPrimary,
            }}
          >
            Dividir cuenta
          </Text>
          {splitEnabled && amountCents === 0 ? (
            <Text
              style={{
                fontFamily: tokens.typography.families.regular,
                fontSize: 12,
                color: tokens.colors.textSecondary,
                marginTop: 2,
              }}
            >
              Ingresa al menos $2.00 MXN para habilitar la división
            </Text>
          ) : null}
        </Pressable>
      </AppCheckbox>

      <AppButton
        variant="primary"
        size="lg"
        leftIcon={splitEnabled ? 'user-round' : 'qr-code'}
        label={
          createChargeMutation.isPending
            ? 'Generando QR…'
            : splitEnabled
              ? 'Dividir cuenta'
              : 'Cobrar con CoDi'
        }
        loading={createChargeMutation.isPending}
        disabled={!canCharge}
        onPress={() => void handleChargePress()}
        testID="free-amount-charge-button"
      />

      {splitSheetVisible ? (
        <SplitSetupSheet
          visible
          totalCents={amountCents}
          concept={conceptInput.trim() || undefined}
          onClose={() => setSplitSheetVisible(false)}
          onBillCreated={(billId) => {
            setSplitSheetVisible(false);
            setAmountInput('');
            setConceptInput('');
            setConceptVisible(false);
            setSplitEnabled(false);
            router.push({ pathname: '/bill/[billId]', params: { billId } });
          }}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
  },
  amountStage: {
    borderWidth: 1,
    alignItems: 'center',
    gap: 8,
  },
  amountLabel: {
    fontSize: 13,
    lineHeight: 18,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    gap: 6,
    maxWidth: '100%',
  },
  amountValue: {
    fontSize: 40,
    lineHeight: 48,
    letterSpacing: -0.8,
    flexShrink: 1,
  },
  currencyLabel: {
    fontSize: 15,
    lineHeight: 20,
  },
  conceptToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: 1,
    marginTop: 2,
  },
  conceptToggleText: {
    fontSize: 13,
    lineHeight: 18,
  },
  conceptInputWrap: {
    width: '100%',
    marginTop: 4,
  },
  errorText: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
  },
  keypadGrid: {
    width: '100%',
  },
  keypadRow: {
    flexDirection: 'row',
  },
  keypadButton: {
    flex: 1,
    minHeight: 56,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keypadKeyText: {
    fontSize: 22,
    lineHeight: 28,
  },
});
