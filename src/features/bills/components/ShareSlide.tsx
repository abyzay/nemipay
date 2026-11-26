import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { AppButton, AppIcon, AppInput } from '@/components/ui';
import { formatMovementDateLabel } from '@/features/movements/services';
import { parseAmountInputToCents } from '@/features/payments/utils/parseAmountCents';
import { useAppTheme } from '@/hooks';
import { formatCurrencyFromCents } from '@/utils/currency';
import type { BillParticipantDetail } from '../types';
import { MAX_LABEL_LENGTH, MIN_SHARE_CENTS } from '../utils/splitMath';

export interface ShareSlideProps {
  participant: BillParticipantDetail;
  billConcept: string;
  width: number;
  qrSize: number;
  isGenerating: boolean;
  errorMessage?: string | null;
  onRegenerateExpired: (participantId: string) => void;
  onRetryShare: (participantId: string) => void;
}

function formatCountdown(expiresAtIso: string, nowMs: number): string {
  const diffSec = Math.max(0, Math.floor((new Date(expiresAtIso).getTime() - nowMs) / 1000));
  const mins = Math.floor(diffSec / 60);
  const secs = diffSec % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function isImagePayload(qrPayload: string): boolean {
  return (
    qrPayload.startsWith('data:image/') ||
    qrPayload.startsWith('http://') ||
    qrPayload.startsWith('https://')
  );
}

export function ShareSlide({
  participant,
  billConcept,
  width,
  qrSize,
  isGenerating,
  errorMessage,
  onRegenerateExpired,
  onRetryShare,
}: ShareSlideProps) {
  const { tokens } = useAppTheme();
  const [nowMs, setNowMs] = useState(() => Date.now());

  const charge = participant.charge;
  const isPayingCharge = participant.state === 'PAYING' && charge?.status === 'AWAITING_PAYMENT';

  useEffect(() => {
    if (!isPayingCharge) return;
    const timer = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [isPayingCharge]);

  const titleLabel = participant.label || `Persona ${participant.position}`;
  const displayAmountCents = charge?.amountCents ?? participant.shareCents ?? 0;

  const isExpired =
    charge?.status === 'EXPIRED' ||
    (charge?.status === 'AWAITING_PAYMENT' && new Date(charge.expiresAt).getTime() <= nowMs);

  const isPaid = participant.state === 'PAID';
  const isReview = participant.state === 'REVIEW';

  return (
    <View style={[styles.slide, { width }]} testID={`share-slide-${participant.id}`}>
      {isPaid ? (
        <View
          testID={`share-paid-card-${participant.id}`}
          style={[
            styles.stateCard,
            tokens.shadows.card,
            {
              backgroundColor: tokens.colors.successLight,
              borderColor: tokens.colors.success,
              borderRadius: tokens.radius.radiusLarge,
              padding: tokens.spacing.space5,
            },
          ]}
        >
          <View style={styles.cardHeaderLeft}>
            <Text
              style={[
                styles.participantTitle,
                { fontFamily: tokens.typography.families.bold, color: tokens.colors.textPrimary },
              ]}
            >
              {titleLabel}
            </Text>
          </View>
          <View
            style={[
              styles.stateOrb,
              { backgroundColor: tokens.colors.success, borderRadius: tokens.radius.radiusFull },
            ]}
          >
            <AppIcon name="check" size={34} color={tokens.colors.textOnPrimary} strokeWidth={2.8} />
          </View>
          <Text
            style={[
              styles.stateTitle,
              { fontFamily: tokens.typography.families.bold, color: tokens.colors.success },
            ]}
          >
            Pagada ✓
          </Text>
          <Text
            testID={`share-amount-${participant.id}`}
            style={[
              styles.paidBigAmount,
              tokens.typography.tabularNums,
              { fontFamily: tokens.typography.families.bold, color: tokens.colors.textPrimary },
            ]}
          >
            {formatCurrencyFromCents(displayAmountCents)}
          </Text>
          <Text
            style={[
              styles.stateSubtitle,
              {
                fontFamily: tokens.typography.families.medium,
                color: tokens.colors.textSecondary,
              },
            ]}
          >
            {formatMovementDateLabel(participant.paidAt ?? charge?.paidAt ?? participant.createdAt)}
          </Text>
        </View>
      ) : isReview ? (
        <View
          testID={`share-review-card-${participant.id}`}
          style={[
            styles.stateCard,
            tokens.shadows.card,
            {
              backgroundColor: tokens.colors.errorLight,
              borderColor: tokens.colors.error,
              borderRadius: tokens.radius.radiusLarge,
              padding: tokens.spacing.space5,
            },
          ]}
        >
          <View style={styles.cardHeaderLeft}>
            <Text
              style={[
                styles.participantTitle,
                { fontFamily: tokens.typography.families.bold, color: tokens.colors.textPrimary },
              ]}
            >
              {titleLabel}
            </Text>
          </View>
          <AppIcon name="shield-alert" size={38} color={tokens.colors.error} />
          <Text
            style={[
              styles.stateTitle,
              { fontFamily: tokens.typography.families.bold, color: tokens.colors.error },
            ]}
          >
            Revisar pago
          </Text>
          <Text
            style={[
              styles.stateSubtitle,
              {
                fontFamily: tokens.typography.families.regular,
                color: tokens.colors.textSecondary,
              },
            ]}
          >
            El monto recibido en el webhook no coincide exactamente con esta parte.
          </Text>
        </View>
      ) : isExpired ? (
        <View
          testID={`share-expired-card-${participant.id}`}
          style={[
            styles.stateCard,
            tokens.shadows.card,
            {
              backgroundColor: tokens.colors.warningLight,
              borderColor: tokens.colors.warning,
              borderRadius: tokens.radius.radiusLarge,
              padding: tokens.spacing.space5,
            },
          ]}
        >
          <View style={styles.cardHeaderLeft}>
            <Text
              style={[
                styles.participantTitle,
                { fontFamily: tokens.typography.families.bold, color: tokens.colors.textPrimary },
              ]}
            >
              {titleLabel}
            </Text>
          </View>
          <AppIcon name="clock" size={36} color={tokens.colors.warningText} />
          <Text
            style={[
              styles.stateTitle,
              { fontFamily: tokens.typography.families.bold, color: tokens.colors.textPrimary },
            ]}
          >
            Este QR venció
          </Text>
          <Text
            style={[
              styles.stateSubtitle,
              {
                fontFamily: tokens.typography.families.regular,
                color: tokens.colors.textSecondary,
              },
            ]}
          >
            Genera un nuevo código QR CoDi para esta persona.
          </Text>
          <AppButton
            variant="primary"
            size="md"
            label={isGenerating ? 'Generando…' : 'Generar de nuevo'}
            loading={isGenerating}
            disabled={isGenerating}
            onPress={() => onRegenerateExpired(participant.id)}
            testID={`share-regenerate-button-${participant.id}`}
          />
        </View>
      ) : charge && charge.status === 'AWAITING_PAYMENT' && charge.qrPayload ? (
        <View
          style={[
            styles.qrCard,
            tokens.shadows.card,
            {
              backgroundColor: tokens.colors.background,
              borderColor: tokens.colors.border,
              borderRadius: tokens.radius.radiusLarge,
              padding: tokens.spacing.space4,
              gap: tokens.spacing.space3,
            },
          ]}
        >
          <View style={styles.cardHeaderLeft}>
            <Text
              style={[
                styles.participantTitle,
                { fontFamily: tokens.typography.families.bold, color: tokens.colors.textPrimary },
              ]}
            >
              {titleLabel}
            </Text>
          </View>

          <View style={styles.heroAmountBlock}>
            <View style={styles.heroAmountRow}>
              <Text
                testID={`share-qr-amount-${participant.id}`}
                style={[
                  styles.heroAmountText,
                  tokens.typography.tabularNums,
                  {
                    fontFamily: tokens.typography.families.extraBold,
                    color: tokens.colors.primaryDark,
                  },
                ]}
              >
                {formatCurrencyFromCents(charge.amountCents)}
              </Text>
              <Text
                style={[
                  styles.heroCurrencyText,
                  {
                    fontFamily: tokens.typography.families.semiBold,
                    color: tokens.colors.textSecondary,
                  },
                ]}
              >
                MXN
              </Text>
            </View>

            <Text
              numberOfLines={2}
              style={[
                styles.conceptText,
                {
                  fontFamily: tokens.typography.families.medium,
                  color: tokens.colors.textSecondary,
                },
              ]}
            >
              {billConcept}
            </Text>
          </View>

          <View
            testID={`share-qr-stage-${participant.id}`}
            style={[
              styles.qrStage,
              {
                backgroundColor: tokens.colors.surface,
                borderColor: tokens.colors.divider,
                borderRadius: tokens.radius.radiusCard,
                padding: tokens.spacing.space4,
              },
            ]}
          >
            {isImagePayload(charge.qrPayload) ? (
              <Image
                source={{ uri: charge.qrPayload }}
                style={{ width: qrSize, height: qrSize }}
                resizeMode="contain"
                testID={`share-qr-image-${participant.id}`}
              />
            ) : (
              <View
                style={[
                  styles.qrFrame,
                  {
                    backgroundColor: tokens.colors.background,
                    borderRadius: tokens.radius.radiusMD,
                    padding: tokens.spacing.space2,
                  },
                ]}
              >
                <QRCode
                  value={charge.qrPayload}
                  size={qrSize}
                  color={tokens.colors.textPrimary}
                  backgroundColor={tokens.colors.background}
                />
              </View>
            )}

            <View style={styles.instructionRow}>
              <AppIcon name="qr-code" size={16} color={tokens.colors.primary} />
              <Text
                testID={`share-qr-instruction-${participant.id}`}
                style={[
                  styles.instructionText,
                  {
                    fontFamily: tokens.typography.families.semiBold,
                    color: tokens.colors.textPrimary,
                  },
                ]}
              >
                Abre tu app bancaria → CoDi → Escanear
              </Text>
            </View>
          </View>

          <View
            style={[
              styles.countdownPill,
              {
                backgroundColor: tokens.colors.lavender,
                borderRadius: tokens.radius.radiusFull,
              },
            ]}
          >
            <AppIcon name="clock" size={15} color={tokens.colors.primary} />
            <Text
              testID={`share-countdown-${participant.id}`}
              style={[
                styles.countdownText,
                tokens.typography.tabularNums,
                { fontFamily: tokens.typography.families.semiBold, color: tokens.colors.primary },
              ]}
            >
              {`El código vence en ${formatCountdown(charge.expiresAt, nowMs)}`}
            </Text>
          </View>
        </View>
      ) : (
        <View
          testID={`share-pending-card-${participant.id}`}
          style={[
            styles.stateCard,
            tokens.shadows.card,
            {
              backgroundColor: tokens.colors.background,
              borderColor: tokens.colors.border,
              borderRadius: tokens.radius.radiusLarge,
              padding: tokens.spacing.space5,
            },
          ]}
        >
          <View style={styles.cardHeaderLeft}>
            <Text
              style={[
                styles.participantTitle,
                { fontFamily: tokens.typography.families.bold, color: tokens.colors.textPrimary },
              ]}
            >
              {titleLabel}
            </Text>
          </View>

          {errorMessage ? (
            <>
              <AppIcon name="circle-alert" size={34} color={tokens.colors.error} />
              <Text
                style={[
                  styles.stateTitle,
                  { fontFamily: tokens.typography.families.semiBold, color: tokens.colors.error },
                ]}
              >
                No se pudo generar el QR
              </Text>
              <Text
                style={[
                  styles.stateSubtitle,
                  {
                    fontFamily: tokens.typography.families.regular,
                    color: tokens.colors.textSecondary,
                  },
                ]}
              >
                {errorMessage}
              </Text>
              <AppButton
                variant="primary"
                size="md"
                label="Reintentar"
                loading={isGenerating}
                disabled={isGenerating}
                onPress={() => onRetryShare(participant.id)}
                testID={`share-retry-button-${participant.id}`}
              />
            </>
          ) : (
            <>
              <ActivityIndicator size="large" color={tokens.colors.primary} />
              <Text
                style={[
                  styles.stateTitle,
                  {
                    fontFamily: tokens.typography.families.semiBold,
                    color: tokens.colors.textPrimary,
                  },
                ]}
              >
                Generando QR…
              </Text>
              <Text
                testID={`share-amount-${participant.id}`}
                style={[
                  styles.stateSubtitle,
                  tokens.typography.tabularNums,
                  {
                    fontFamily: tokens.typography.families.semiBold,
                    color: tokens.colors.primary,
                  },
                ]}
              >
                {formatCurrencyFromCents(displayAmountCents)}
              </Text>
            </>
          )}
        </View>
      )}
    </View>
  );
}

export interface FreeContributionSlideProps {
  width: number;
  availableCents: number;
  isSubmitting: boolean;
  errorMessage?: string | null;
  onSubmit: (amountCents: number, label: string) => void;
}

export function FreeContributionSlide({
  width,
  availableCents,
  isSubmitting,
  errorMessage,
  onSubmit,
}: FreeContributionSlideProps) {
  const { tokens } = useAppTheme();
  const [label, setLabel] = useState('');
  const [amountText, setAmountText] = useState('');

  const amountCents = parseAmountInputToCents(amountText, availableCents);
  const canCreate =
    !isSubmitting &&
    availableCents >= MIN_SHARE_CENTS &&
    amountCents >= MIN_SHARE_CENTS &&
    amountCents <= availableCents;

  const handleSubmit = () => {
    if (!canCreate) return;
    onSubmit(amountCents, label.trim());
    setLabel('');
    setAmountText('');
  };

  return (
    <View style={[styles.slide, { width }]} testID="free-contribution-slide">
      <View
        style={[
          styles.freeCard,
          tokens.shadows.card,
          {
            backgroundColor: tokens.colors.background,
            borderColor: tokens.colors.border,
            borderRadius: tokens.radius.radiusLarge,
            padding: tokens.spacing.space5,
          },
        ]}
      >
        <Text
          style={[
            styles.participantTitle,
            { fontFamily: tokens.typography.families.bold, color: tokens.colors.textPrimary },
          ]}
        >
          Nueva aportación
        </Text>
        <Text
          testID="free-available-balance"
          style={[
            styles.stateSubtitle,
            tokens.typography.tabularNums,
            { fontFamily: tokens.typography.families.semiBold, color: tokens.colors.primary },
          ]}
        >
          {`Saldo disponible: ${formatCurrencyFromCents(Math.max(0, availableCents))}`}
        </Text>

        {availableCents < MIN_SHARE_CENTS ? (
          <Text
            style={[
              styles.stateSubtitle,
              {
                fontFamily: tokens.typography.families.regular,
                color: tokens.colors.textSecondary,
              },
            ]}
          >
            Todo el saldo restante ya tiene un QR activo o fue cubierto.
          </Text>
        ) : (
          <View style={styles.freeForm}>
            <AppInput
              variant="soft"
              placeholder="Nombre (opcional, máx. 20 caracteres)"
              maxLength={MAX_LABEL_LENGTH}
              value={label}
              onChangeText={setLabel}
              testID="free-share-label-input"
            />
            <AppInput
              variant="soft"
              placeholder="Monto en MXN (ej. 50)"
              keyboardType="decimal-pad"
              value={amountText}
              onChangeText={(text) => {
                const cleaned = text.replace(/[^0-9.]/g, '');
                const dotIdx = cleaned.indexOf('.');
                if (dotIdx === -1) {
                  setAmountText(cleaned);
                } else {
                  setAmountText(
                    `${cleaned.slice(0, dotIdx)}.${cleaned
                      .slice(dotIdx + 1)
                      .replace(/\./g, '')
                      .slice(0, 2)}`
                  );
                }
              }}
              testID="free-share-amount-input"
            />
            <Pressable
              accessibilityRole="button"
              onPress={() => setAmountText((availableCents / 100).toFixed(2))}
              testID="free-fill-remaining-button"
              style={[
                styles.fillChip,
                {
                  backgroundColor: tokens.colors.lavenderSoft,
                  borderRadius: tokens.radius.radiusFull,
                },
              ]}
            >
              <Text
                style={[
                  styles.fillChipText,
                  tokens.typography.tabularNums,
                  { fontFamily: tokens.typography.families.semiBold, color: tokens.colors.primary },
                ]}
              >
                {`Usar restante (${formatCurrencyFromCents(availableCents)})`}
              </Text>
            </Pressable>

            {errorMessage ? (
              <Text
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
              label={isSubmitting ? 'Generando QR…' : 'Generar QR'}
              loading={isSubmitting}
              disabled={!canCreate}
              onPress={handleSubmit}
              testID="free-share-submit-button"
            />
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  slide: {
    paddingHorizontal: 1,
  },
  qrCard: {
    borderWidth: 1,
    alignItems: 'center',
  },
  cardHeaderLeft: {
    width: '100%',
    alignItems: 'flex-start',
  },
  participantTitle: {
    fontSize: 17,
    lineHeight: 22,
  },
  heroAmountBlock: {
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
  },
  heroAmountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  heroAmountText: {
    fontSize: 36,
    lineHeight: 42,
    letterSpacing: -0.6,
  },
  heroCurrencyText: {
    fontSize: 14,
    lineHeight: 18,
  },
  conceptText: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
  },
  qrStage: {
    width: '100%',
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  qrFrame: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  instructionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  instructionText: {
    fontSize: 12,
    lineHeight: 16,
  },
  countdownPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 7,
  },
  countdownText: {
    fontSize: 13,
    lineHeight: 18,
  },
  stateCard: {
    minHeight: 300,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  stateOrb: {
    width: 68,
    height: 68,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stateTitle: {
    fontSize: 18,
    lineHeight: 24,
    textAlign: 'center',
  },
  paidBigAmount: {
    fontSize: 28,
    lineHeight: 34,
  },
  stateSubtitle: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
  },
  freeCard: {
    borderWidth: 1,
    gap: 12,
  },
  freeForm: {
    gap: 10,
    marginTop: 4,
  },
  fillChip: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  fillChipText: {
    fontSize: 12,
    lineHeight: 16,
  },
  errorText: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
  },
});
