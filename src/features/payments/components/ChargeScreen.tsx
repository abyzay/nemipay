import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Image, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import QRCode from 'react-native-qrcode-svg';
import { AmountDisplay } from '@/components/financial';
import { ScreenContainer } from '@/components/layout';
import { AppButton, AppCard, AppHeader, AppIcon } from '@/components/ui';
import { useAppTheme } from '@/hooks';
import { generateIdempotencyKey } from '@/services/security/crypto';
import { useUiStore } from '@/stores';
import { useChargeLive } from '../hooks/useChargeLive';
import { useCreateCharge } from '../hooks/useCreateCharge';
import { announcePaymentReceived } from '../services/announce';
import { cancelCharge } from '../services/chargesService';
import { PaymentReceivedModal } from './PaymentReceivedModal';

export interface ChargeScreenProps {
  chargeId: string;
  onBackPress: () => void;
}

function formatTimeLabel(isoDate: string | null): string {
  const date = isoDate ? new Date(isoDate) : new Date();
  const hours24 = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const period = hours24 >= 12 ? 'p.m.' : 'a.m.';
  const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
  return `${hours12}:${minutes} ${period}`;
}

function formatCountdown(expiresAtIso: string, nowMs: number): string {
  const diffSec = Math.max(0, Math.floor((new Date(expiresAtIso).getTime() - nowMs) / 1000));
  const mins = Math.floor(diffSec / 60);
  const secs = diffSec % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function isImagePayload(qrPayload: string): boolean {
  return (
    qrPayload.startsWith('data:image/') ||
    qrPayload.startsWith('http://') ||
    qrPayload.startsWith('https://')
  );
}

export function ChargeScreen({ chargeId, onBackPress }: ChargeScreenProps) {
  const { tokens } = useAppTheme();
  const { data: charge, isLoading, error } = useChargeLive(chargeId);
  const createChargeMutation = useCreateCharge();

  const hasAnnouncedCharge = useUiStore((state) => state.hasAnnouncedCharge);
  const markChargeAnnounced = useUiStore((state) => state.markChargeAnnounced);

  const [nowMs, setNowMs] = useState(() => Date.now());
  const [confirmExitVisible, setConfirmExitVisible] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    if (charge?.status !== 'AWAITING_PAYMENT') {
      return;
    }
    const timer = setInterval(() => {
      setNowMs(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, [charge?.status]);

  useEffect(() => {
    if (!charge || charge.status !== 'CONFIRMED') {
      return;
    }
    if (!hasAnnouncedCharge(charge.id)) {
      markChargeAnnounced(charge.id);
      announcePaymentReceived(charge.amountCents);
    }
  }, [charge, hasAnnouncedCharge, markChargeAnnounced]);

  const countdownLabel = useMemo(() => {
    if (!charge) return '0:00';
    return formatCountdown(charge.expiresAt, nowMs);
  }, [charge, nowMs]);

  const handleRequestBack = () => {
    if (charge?.status === 'AWAITING_PAYMENT') {
      setConfirmExitVisible(true);
      return;
    }
    onBackPress();
  };

  const handleCancelAndExit = async () => {
    if (!charge) {
      onBackPress();
      return;
    }
    setIsCancelling(true);
    setActionError(null);
    try {
      await cancelCharge(charge.id);
      onBackPress();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'No se pudo cancelar el cobro.');
      setIsCancelling(false);
    }
  };

  const handleRegenerateCharge = async () => {
    if (!charge || createChargeMutation.isPending) {
      return;
    }
    setActionError(null);
    try {
      const nextCharge = await createChargeMutation.mutateAsync({
        input:
          charge.items && charge.items.length > 0
            ? {
                items: charge.items.map((item) => ({
                  productId: item.productId,
                  quantity: item.quantity,
                })),
              }
            : {
                amountCents: charge.amountCents,
                concept: charge.concept,
              },
        idempotencyKey: generateIdempotencyKey(),
      });
      router.replace({ pathname: '/collect', params: { chargeId: nextCharge.id } });
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'No se pudo generar un nuevo cobro.');
    }
  };

  if (isLoading && !charge) {
    return (
      <ScreenContainer edges={['top']}>
        <AppHeader title="Cobro CoDi" onBackPress={onBackPress} backTestID="collect-back-button" />
        <View style={styles.centerState}>
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
        </View>
      </ScreenContainer>
    );
  }

  if (error || !charge) {
    return (
      <ScreenContainer edges={['top']}>
        <AppHeader title="Cobro CoDi" onBackPress={onBackPress} backTestID="collect-back-button" />
        <View style={styles.centerState}>
          <AppIcon name="circle-alert" size={44} color={tokens.colors.error} />
          <Text
            style={[
              styles.stateTitle,
              {
                fontFamily: tokens.typography.families.bold,
                color: tokens.colors.textPrimary,
              },
            ]}
          >
            No pudimos cargar el cobro
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
            {error?.message ?? 'Verifica tu conexión e intenta de nuevo.'}
          </Text>
          <AppButton variant="primary" label="Volver" onPress={onBackPress} />
        </View>
      </ScreenContainer>
    );
  }

  if (charge.status === 'CONFIRMED') {
    return (
      <PaymentReceivedModal
        visible
        amountCents={charge.amountCents}
        timeLabel={formatTimeLabel(charge.paidAt)}
        concept={charge.concept}
        onAccept={onBackPress}
      />
    );
  }

  return (
    <ScreenContainer scrollable edges={['top']}>
      <AppHeader
        title="Cobro CoDi"
        onBackPress={handleRequestBack}
        backTestID="collect-back-button"
      />

      {charge.status === 'CREATING' ? (
        <View style={styles.centerState} testID="charge-creating-state">
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
        </View>
      ) : null}

      {charge.status === 'AWAITING_PAYMENT' ? (
        <View style={{ gap: tokens.spacing.space4, paddingTop: tokens.spacing.space3 }}>
          <AppCard style={[styles.qrCard, { gap: tokens.spacing.space3 }]}>
            <AmountDisplay
              amountCents={charge.amountCents}
              size="display"
              tone="primary"
              testID="charge-amount-display"
            />
            <Text
              style={[
                styles.conceptText,
                {
                  fontFamily: tokens.typography.families.medium,
                  color: tokens.colors.textSecondary,
                },
              ]}
            >
              {charge.concept}
            </Text>

            <View
              style={[
                styles.qrWrapper,
                {
                  backgroundColor: tokens.colors.background,
                  borderColor: tokens.colors.border,
                  borderRadius: tokens.radius.radiusCard,
                  padding: tokens.spacing.space4,
                },
              ]}
            >
              {charge.qrPayload ? (
                isImagePayload(charge.qrPayload) ? (
                  <Image
                    source={{ uri: charge.qrPayload }}
                    style={styles.qrImage}
                    resizeMode="contain"
                    testID="charge-qr-image"
                  />
                ) : (
                  <QRCode
                    value={charge.qrPayload}
                    size={220}
                    color={tokens.colors.textPrimary}
                    backgroundColor={tokens.colors.background}
                  />
                )
              ) : (
                <ActivityIndicator size="large" color={tokens.colors.primary} />
              )}
            </View>

            <Text
              testID="charge-countdown"
              style={[
                styles.countdownText,
                tokens.typography.tabularNums,
                {
                  fontFamily: tokens.typography.families.semiBold,
                  color: tokens.colors.primary,
                },
              ]}
            >
              {`Vence en ${countdownLabel}`}
            </Text>

            <View
              style={[
                styles.noticeBanner,
                {
                  backgroundColor: tokens.colors.lavenderSoft,
                  borderColor: tokens.colors.lavenderBorder,
                  borderRadius: tokens.radius.radiusMD,
                  padding: tokens.spacing.space3,
                  gap: tokens.spacing.space2,
                },
              ]}
            >
              <AppIcon name="qr-code" size={18} color={tokens.colors.primary} />
              <Text
                testID="charge-instruction-text"
                style={[
                  styles.noticeText,
                  {
                    fontFamily: tokens.typography.families.semiBold,
                    color: tokens.colors.textPrimary,
                  },
                ]}
              >
                Abre la app de tu banco → CoDi → Escanear
              </Text>
            </View>
          </AppCard>

          {confirmExitVisible ? (
            <AppCard style={{ gap: tokens.spacing.space3 }} testID="charge-cancel-prompt">
              <Text
                style={[
                  styles.promptTitle,
                  {
                    fontFamily: tokens.typography.families.semiBold,
                    color: tokens.colors.textPrimary,
                  },
                ]}
              >
                Este cobro sigue esperando pago. ¿Deseas cancelarlo?
              </Text>
              <View style={{ gap: tokens.spacing.space2 }}>
                <AppButton
                  variant="destructive"
                  label={isCancelling ? 'Cancelando…' : 'Cancelar cobro'}
                  loading={isCancelling}
                  disabled={isCancelling}
                  onPress={() => void handleCancelAndExit()}
                  testID="charge-confirm-cancel-button"
                />
                <AppButton
                  variant="outlined"
                  label="Seguir esperando"
                  disabled={isCancelling}
                  onPress={() => setConfirmExitVisible(false)}
                />
              </View>
            </AppCard>
          ) : (
            <AppButton
              variant="outlined"
              label="Cancelar cobro"
              onPress={() => setConfirmExitVisible(true)}
              testID="charge-cancel-button"
            />
          )}
        </View>
      ) : null}

      {charge.status === 'EXPIRED' ? (
        <View style={styles.centerState} testID="charge-expired-state">
          <AppIcon name="clock" size={48} color={tokens.colors.warning} />
          <Text
            style={[
              styles.stateTitle,
              {
                fontFamily: tokens.typography.families.bold,
                color: tokens.colors.textPrimary,
              },
            ]}
          >
            El QR expiró
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
            Genera un nuevo código QR CoDi por el mismo monto.
          </Text>
          <View style={styles.actionStack}>
            <AppButton
              variant="primary"
              label={createChargeMutation.isPending ? 'Generando…' : 'Generar de nuevo'}
              loading={createChargeMutation.isPending}
              disabled={createChargeMutation.isPending}
              onPress={() => void handleRegenerateCharge()}
              testID="charge-regenerate-button"
            />
            <AppButton variant="outlined" label="Volver a Cobrar" onPress={onBackPress} />
          </View>
        </View>
      ) : null}

      {charge.status === 'FAILED' ||
      charge.status === 'CANCELLED' ||
      charge.status === 'UNDER_REVIEW' ? (
        <View style={styles.centerState} testID="charge-terminal-error-state">
          <AppIcon name="circle-alert" size={48} color={tokens.colors.error} />
          <Text
            style={[
              styles.stateTitle,
              {
                fontFamily: tokens.typography.families.bold,
                color: tokens.colors.textPrimary,
              },
            ]}
          >
            {charge.status === 'UNDER_REVIEW'
              ? 'Pago en revisión'
              : charge.status === 'CANCELLED'
                ? 'Cobro cancelado'
                : 'No se pudo generar el cobro'}
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
            {charge.status === 'UNDER_REVIEW'
              ? 'El monto recibido no coincide exactamente con el solicitado.'
              : charge.status === 'CANCELLED'
                ? 'Este cobro fue cancelado. Si tu cliente ya pagó, se registrará automáticamente.'
                : 'Intenta generar el cobro de nuevo.'}
          </Text>
          <View style={styles.actionStack}>
            <AppButton
              variant="primary"
              label="Reintentar"
              loading={createChargeMutation.isPending}
              disabled={createChargeMutation.isPending}
              onPress={() => void handleRegenerateCharge()}
              testID="charge-retry-button"
            />
            <AppButton variant="outlined" label="Volver a Cobrar" onPress={onBackPress} />
          </View>
        </View>
      ) : null}

      {actionError ? (
        <Text
          style={[
            styles.errorText,
            {
              fontFamily: tokens.typography.families.medium,
              color: tokens.colors.error,
              marginTop: tokens.spacing.space3,
            },
          ]}
        >
          {actionError}
        </Text>
      ) : null}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  centerState: {
    flex: 1,
    minHeight: 360,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 16,
  },
  stateTitle: {
    fontSize: 20,
    lineHeight: 28,
    textAlign: 'center',
  },
  stateSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  actionStack: {
    width: '100%',
    gap: 10,
    marginTop: 8,
  },
  qrCard: {
    alignItems: 'center',
  },
  conceptText: {
    fontSize: 15,
    lineHeight: 20,
    textAlign: 'center',
  },
  qrWrapper: {
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrImage: {
    width: 220,
    height: 220,
  },
  countdownText: {
    fontSize: 14,
    lineHeight: 20,
  },
  noticeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    borderWidth: 1,
  },
  noticeText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  promptTitle: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
  },
});
