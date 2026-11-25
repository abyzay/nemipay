import React, { useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { AmountDisplay } from '@/components/financial';
import { AppButton, AppIcon, AppInput } from '@/components/ui';
import { env } from '@/config/env';
import { useAppTheme } from '@/hooks';
import { generateIdempotencyKey } from '@/services/security/crypto';
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

  const canCharge = amountCents >= 100 && !createChargeMutation.isPending;

  return (
    <View style={[styles.container, { gap: tokens.spacing.space3 }]}>
      <View
        style={[
          styles.amountStage,
          {
            backgroundColor: tokens.colors.surface,
            borderColor: tokens.colors.border,
            borderRadius: tokens.radius.radiusCard,
            padding: tokens.spacing.space4,
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
        <AmountDisplay
          amountCents={amountCents}
          size="display"
          tone={amountCents >= 100 ? 'primary' : 'default'}
          testID="free-amount-display"
        />

        {!conceptVisible ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => setConceptVisible(true)}
            testID="free-amount-add-concept-toggle"
            style={styles.conceptToggle}
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
              label="Concepto (opcional)"
              value={conceptInput}
              onChangeText={handleConceptChange}
              maxLength={60}
              placeholder="Ej. Producto o servicio"
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

      <View style={[styles.keypadGrid, { gap: tokens.spacing.space2 }]}>
        {KEYPAD_ROWS.map((row, rowIndex) => (
          <View key={rowIndex} style={[styles.keypadRow, { gap: tokens.spacing.space2 }]}>
            {row.map((key) => (
              <Pressable
                key={key}
                accessibilityRole="button"
                accessibilityLabel={key === 'backspace' ? 'Borrar' : key}
                onPress={() => handleKeyPress(key)}
                testID={`keypad-key-${key}`}
                style={({ pressed }) => [
                  styles.keypadButton,
                  {
                    backgroundColor: pressed ? tokens.colors.lavenderSoft : tokens.colors.surface,
                    borderColor: tokens.colors.border,
                    borderRadius: tokens.radius.radiusMD,
                  },
                ]}
              >
                {key === 'backspace' ? (
                  <AppIcon name="chevron-left" size={22} color={tokens.colors.textPrimary} />
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

      <AppButton
        variant="primary"
        size="lg"
        leftIcon="qr-code"
        label={createChargeMutation.isPending ? 'Generando QR…' : 'Cobrar con CoDi'}
        loading={createChargeMutation.isPending}
        disabled={!canCharge}
        onPress={() => void handleChargePress()}
        testID="free-amount-charge-button"
      />
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
    gap: 6,
  },
  amountLabel: {
    fontSize: 13,
    lineHeight: 18,
  },
  conceptToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
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
    minHeight: 54,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keypadKeyText: {
    fontSize: 22,
    lineHeight: 28,
  },
});
