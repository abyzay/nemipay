import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { ScreenContainer } from '@/components/layout';
import { AppButton, AppCard, AppHeader, AppIcon } from '@/components/ui';
import { fetchMerchantProfile } from '@/features/authentication/services';
import { formatMovementDateLabel } from '@/features/movements/services';
import { useAppTheme } from '@/hooks';
import { BillScreen } from '@/features/bills/components/BillScreen';
import { generateIdempotencyKey } from '@/services/security/crypto';
import { useUiStore } from '@/stores';
import { useChargeLive } from '../hooks/useChargeLive';
import { useCreateCharge } from '../hooks/useCreateCharge';
import { paymentKeys } from '../queries/keys';
import { announcePaymentReceived } from '../services/announce';
import { cancelCharge } from '../services/chargesService';
import { CodiQrCard } from './CodiQrCard';
import { PaymentReceivedModal } from './PaymentReceivedModal';

export interface ChargeScreenProps {
  chargeId: string;
  onBackPress: () => void;
}

function formatCountdown(expiresAtIso: string, nowMs: number): string {
  const diffSec = Math.max(0, Math.floor((new Date(expiresAtIso).getTime() - nowMs) / 1000));
  const mins = Math.floor(diffSec / 60);
  const secs = diffSec % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function ChargeScreen({ chargeId, onBackPress }: ChargeScreenProps) {
  const { tokens } = useAppTheme();
  const { width: windowWidth } = useWindowDimensions();
  const authenticatedUser = useUiStore((state) => state.authenticatedUser);
  const { data: charge, isLoading, error } = useChargeLive(chargeId);
  const createChargeMutation = useCreateCharge();

  const merchantQuery = useQuery({
    queryKey: paymentKeys.merchant(authenticatedUser?.id ?? ''),
    queryFn: () => fetchMerchantProfile(authenticatedUser!.id),
    enabled: Boolean(authenticatedUser?.id) && charge?.status === 'CONFIRMED',
  });

  const hasAnnouncedCharge = useUiStore((state) => state.hasAnnouncedCharge);
  const markChargeAnnounced = useUiStore((state) => state.markChargeAnnounced);

  const [nowMs, setNowMs] = useState(() => Date.now());
  const [confirmExitVisible, setConfirmExitVisible] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const qrSize = useMemo(() => {
    const available = Math.max(220, Math.min(280, windowWidth - 116));
    return available;
  }, [windowWidth]);

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
      <ScreenContainer edges={['top', 'bottom']}>
        <AppHeader title="Cobro CoDi" onBackPress={onBackPress} backTestID="collect-back-button" />
        <View style={styles.centerState}>
          <View
            style={[
              styles.statusOrb,
              {
                backgroundColor: tokens.colors.lavender,
                borderRadius: tokens.radius.radiusFull,
              },
            ]}
          >
            <ActivityIndicator size="large" color={tokens.colors.primary} />
          </View>
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
      <ScreenContainer edges={['top', 'bottom']}>
        <AppHeader title="Cobro CoDi" onBackPress={onBackPress} backTestID="collect-back-button" />
        <View style={styles.centerState}>
          <View
            style={[
              styles.statusOrb,
              {
                backgroundColor: tokens.colors.errorLight,
                borderRadius: tokens.radius.radiusFull,
              },
            ]}
          >
            <AppIcon name="circle-alert" size={38} color={tokens.colors.error} />
          </View>
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
          <View style={styles.actionStack}>
            <AppButton variant="primary" label="Volver" onPress={onBackPress} />
          </View>
        </View>
      </ScreenContainer>
    );
  }

  if (charge?.billId) {
    return <BillScreen billId={charge.billId} onBackPress={onBackPress} />;
  }

  if (charge.status === 'CONFIRMED') {
    const merchantName = merchantQuery.data?.name ?? authenticatedUser?.displayName;
    return (
      <PaymentReceivedModal
        visible
        amountCents={charge.amountCents}
        timeLabel={formatMovementDateLabel(charge.paidAt ?? charge.createdAt)}
        concept={charge.concept}
        charge={charge}
        merchantName={merchantName}
        onAccept={onBackPress}
      />
    );
  }

  return (
    <ScreenContainer scrollable edges={['top', 'bottom']}>
      <AppHeader
        title="Cobro CoDi"
        onBackPress={handleRequestBack}
        backTestID="collect-back-button"
        rightSlot={
          charge.status === 'AWAITING_PAYMENT' ? (
            <View
              style={[
                styles.timerPill,
                {
                  backgroundColor: tokens.colors.lavender,
                  borderRadius: tokens.radius.radiusFull,
                  paddingHorizontal: tokens.spacing.space2 + 2,
                  paddingVertical: tokens.spacing.space1 + 1,
                  gap: tokens.spacing.space1,
                },
              ]}
            >
              <AppIcon name="clock" size={13} color={tokens.colors.primary} />
              <Text
                testID="charge-countdown"
                style={[
                  styles.timerText,
                  tokens.typography.tabularNums,
                  {
                    fontFamily: tokens.typography.families.semiBold,
                    color: tokens.colors.primary,
                  },
                ]}
              >
                {countdownLabel}
              </Text>
            </View>
          ) : undefined
        }
      />

      {charge.status === 'CREATING' ? (
        <View style={styles.centerState} testID="charge-creating-state">
          <View
            style={[
              styles.statusOrb,
              {
                backgroundColor: tokens.colors.lavender,
                borderRadius: tokens.radius.radiusFull,
              },
            ]}
          >
            <ActivityIndicator size="large" color={tokens.colors.primary} />
          </View>
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
            style={[
              styles.stateSubtitle,
              {
                fontFamily: tokens.typography.families.regular,
                color: tokens.colors.textSecondary,
              },
            ]}
          >
            Preparando tu código CoDi seguro…
          </Text>
        </View>
      ) : null}

      {charge.status === 'AWAITING_PAYMENT' ? (
        <View
          style={{
            gap: tokens.spacing.space4,
            paddingTop: tokens.spacing.space2,
            paddingBottom: tokens.spacing.space6,
          }}
        >
          <CodiQrCard
            amountCents={charge.amountCents}
            concept={charge.concept}
            qrPayload={charge.qrPayload}
            qrSize={qrSize}
          />

          <View
            style={[
              styles.waitingRow,
              {
                backgroundColor: tokens.colors.lavenderSoft,
                borderColor: tokens.colors.lavenderBorder,
                borderRadius: tokens.radius.radiusMD,
                paddingHorizontal: tokens.spacing.space3 + 2,
                paddingVertical: tokens.spacing.space2 + 2,
              },
            ]}
          >
            <View style={[styles.waitingDot, { backgroundColor: tokens.colors.primary }]} />
            <Text
              style={[
                styles.waitingText,
                {
                  fontFamily: tokens.typography.families.medium,
                  color: tokens.colors.textSecondary,
                },
              ]}
            >
              {`Esperando confirmación automática · vence en ${countdownLabel}`}
            </Text>
          </View>

          {confirmExitVisible ? (
            <AppCard
              variant="selected"
              style={{ gap: tokens.spacing.space3 }}
              testID="charge-cancel-prompt"
            >
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
          <View
            style={[
              styles.statusOrb,
              {
                backgroundColor: tokens.colors.warningLight,
                borderRadius: tokens.radius.radiusFull,
              },
            ]}
          >
            <AppIcon name="clock" size={38} color={tokens.colors.warning} />
          </View>
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
            <AppButton variant="outlined" label="Volver" onPress={onBackPress} />
          </View>
        </View>
      ) : null}

      {charge.status === 'FAILED' ||
      charge.status === 'CANCELLED' ||
      charge.status === 'UNDER_REVIEW' ? (
        <View style={styles.centerState} testID="charge-terminal-error-state">
          <View
            style={[
              styles.statusOrb,
              {
                backgroundColor:
                  charge.status === 'UNDER_REVIEW'
                    ? tokens.colors.warningLight
                    : tokens.colors.errorLight,
                borderRadius: tokens.radius.radiusFull,
              },
            ]}
          >
            <AppIcon
              name={charge.status === 'UNDER_REVIEW' ? 'shield-alert' : 'circle-alert'}
              size={38}
              color={
                charge.status === 'UNDER_REVIEW' ? tokens.colors.warningText : tokens.colors.error
              }
            />
          </View>
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
            <AppButton variant="outlined" label="Volver" onPress={onBackPress} />
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
    minHeight: 380,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 16,
  },
  statusOrb: {
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
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
  timerPill: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timerText: {
    fontSize: 13,
    lineHeight: 17,
  },
  waitingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
  },
  waitingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  waitingText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
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
