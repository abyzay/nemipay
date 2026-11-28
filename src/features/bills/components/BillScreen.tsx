import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenContainer } from '@/components/layout';
import { AppButton, AppCard, AppHeader, AppIcon, NemiPayLogo } from '@/components/ui';
import {
  announceBillOverpaid,
  announceBillSettled,
  announcePartialBillPayment,
  keepScreenAwake,
} from '@/features/payments/services/announce';
import { useAppTheme } from '@/hooks';
import { useUiStore } from '@/stores';
import { formatCurrencyFromCents } from '@/utils/currency';
import { useActiveSharePolling, useBillLive } from '../hooks/useBillLive';
import { useCancelBill } from '../hooks/useCancelBill';
import { BillCarousel } from './BillCarousel';
import { BillHeader } from './BillHeader';

export interface BillScreenProps {
  billId: string;
  onBackPress: () => void;
}

export function BillScreen({ billId, onBackPress }: BillScreenProps) {
  const { tokens } = useAppTheme();
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [flashMessage, setFlashMessage] = useState<string | null>(null);
  const [cancelConfirmVisible, setCancelConfirmVisible] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  const hasAnnouncedCharge = useUiStore((state) => state.hasAnnouncedCharge);
  const markChargeAnnounced = useUiStore((state) => state.markChargeAnnounced);
  const cancelBillMutation = useCancelBill();

  const { data: resolvedDetail, isLoading, error } = useBillLive(billId);

  // Mantiene la pantalla encendida mientras la cuenta está activa
  useEffect(() => {
    void keepScreenAwake();
  }, []);

  // Reconstrucción al recargar: ubicarse inicialmente en el primer participante pendiente/pagando
  const defaultPendingIndex = useMemo(() => {
    if (!resolvedDetail) return 0;
    const idx = resolvedDetail.participants.findIndex(
      (p) => p.state === 'PAYING' || p.state === 'PENDING'
    );
    return idx !== -1 ? idx : 0;
  }, [resolvedDetail]);

  const activeIndex = selectedIndex ?? defaultPendingIndex;

  const activeParticipant = resolvedDetail?.participants[activeIndex];
  const activeChargeId =
    activeParticipant?.charge &&
    (activeParticipant.charge.status === 'AWAITING_PAYMENT' ||
      activeParticipant.charge.status === 'CREATING')
      ? activeParticipant.charge.id
      : null;

  const billStatus = resolvedDetail?.bill.status;
  const isBillTerminal =
    billStatus === 'PAID' || billStatus === 'CANCELLED' || billStatus === 'EXPIRED';

  useActiveSharePolling(billId, activeChargeId, isBillTerminal);

  // Anuncio de voz por cobro confirmado (una sola vez por chargeId) y destello verde en pago parcial
  const initializedChargesRef = useRef(false);
  useEffect(() => {
    if (!resolvedDetail) return;

    // Al reconstruir pantalla por recarga, no re-anunciar cobros ya pagados previamente
    if (!initializedChargesRef.current) {
      initializedChargesRef.current = true;
      for (const p of resolvedDetail.participants) {
        if (p.charge?.status === 'CONFIRMED') {
          markChargeAnnounced(p.charge.id);
        }
      }
      return;
    }

    const newlyConfirmed = resolvedDetail.participants.filter(
      (p) => p.charge?.status === 'CONFIRMED' && !hasAnnouncedCharge(p.charge.id)
    );
    if (newlyConfirmed.length === 0) return;

    let latestPartialPhrase: string | null = null;
    for (const participant of newlyConfirmed) {
      if (!participant.charge) continue;
      markChargeAnnounced(participant.charge.id);

      if (resolvedDetail.bill.overpaidCents > 0) {
        announceBillOverpaid(resolvedDetail.bill.overpaidCents);
      } else if (resolvedDetail.bill.status === 'PAID') {
        announceBillSettled(resolvedDetail.bill.totalCents);
      } else {
        const remaining = Math.max(
          0,
          resolvedDetail.bill.totalCents - resolvedDetail.bill.collectedCents
        );
        latestPartialPhrase = announcePartialBillPayment(participant.charge.amountCents, remaining);
      }
    }

    if (latestPartialPhrase) {
      const phrase = latestPartialPhrase;
      const showTimer = setTimeout(() => setFlashMessage(phrase), 0);
      return () => clearTimeout(showTimer);
    }

    return undefined;
  }, [hasAnnouncedCharge, markChargeAnnounced, resolvedDetail]);

  useEffect(() => {
    if (!flashMessage) return;
    const timer = setTimeout(() => setFlashMessage(null), 1800);
    return () => clearTimeout(timer);
  }, [flashMessage]);

  const hasConfirmedPayments = useMemo(() => {
    if (!resolvedDetail) return false;
    return (
      resolvedDetail.bill.collectedCents > 0 ||
      resolvedDetail.participants.some((p) => p.charge?.status === 'CONFIRMED')
    );
  }, [resolvedDetail]);

  const handleConfirmCancelBill = async () => {
    setCancelError(null);
    try {
      await cancelBillMutation.mutateAsync(billId);
      onBackPress();
    } catch (err) {
      setCancelError(err instanceof Error ? err.message : 'No pudimos cancelar la cuenta.');
    }
  };

  if (isLoading && !resolvedDetail) {
    return (
      <ScreenContainer edges={['top', 'bottom']}>
        <AppHeader
          title="Cuenta compartida"
          onBackPress={onBackPress}
          backTestID="bill-back-button"
        />
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={tokens.colors.primary} />
          <Text
            style={[
              styles.stateSubtitle,
              { fontFamily: tokens.typography.families.medium, color: tokens.colors.textSecondary },
            ]}
          >
            Cargando cuenta…
          </Text>
        </View>
      </ScreenContainer>
    );
  }

  if (error || !resolvedDetail) {
    return (
      <ScreenContainer edges={['top', 'bottom']}>
        <AppHeader
          title="Cuenta compartida"
          onBackPress={onBackPress}
          backTestID="bill-back-button"
        />
        <View style={styles.centerState}>
          <AppIcon name="circle-alert" size={38} color={tokens.colors.error} />
          <Text
            style={[
              styles.stateTitle,
              { fontFamily: tokens.typography.families.bold, color: tokens.colors.textPrimary },
            ]}
          >
            No pudimos cargar la cuenta
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

  const { bill, participants } = resolvedDetail;

  if (bill.status === 'PAID') {
    return (
      <View
        testID="bill-paid-fullscreen"
        style={[styles.paidFullScreen, { backgroundColor: tokens.colors.success }]}
      >
        <SafeAreaView edges={['top', 'bottom']} style={styles.paidSafeArea}>
          <View style={styles.paidContent}>
            <View
              style={[
                styles.paidIconCircle,
                {
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  borderRadius: tokens.radius.radiusFull,
                },
              ]}
            >
              <AppIcon name="check" size={48} strokeWidth={3} color={tokens.colors.textOnPrimary} />
            </View>
            <Text
              style={[
                styles.paidTitle,
                {
                  fontFamily: tokens.typography.families.bold,
                  color: tokens.colors.textOnPrimary,
                },
              ]}
            >
              ¡Cuenta liquidada!
            </Text>
            <Text
              testID="bill-paid-total"
              style={[
                styles.paidTotalText,
                tokens.typography.tabularNums,
                {
                  fontFamily: tokens.typography.families.bold,
                  color: tokens.colors.textOnPrimary,
                },
              ]}
            >
              {formatCurrencyFromCents(bill.totalCents)}
            </Text>
            <Text
              style={[
                styles.paidConcept,
                {
                  fontFamily: tokens.typography.families.medium,
                  color: 'rgba(255, 255, 255, 0.9)',
                },
              ]}
            >
              {bill.concept}
            </Text>

            {bill.overpaidCents > 0 ? (
              <View
                testID="bill-overpaid-banner"
                style={[
                  styles.overpaidFullscreenBanner,
                  {
                    backgroundColor: tokens.colors.warningLight,
                    borderRadius: tokens.radius.radiusCard,
                  },
                ]}
              >
                <AppIcon name="circle-alert" size={20} color={tokens.colors.warningText} />
                <Text
                  style={[
                    styles.overpaidText,
                    {
                      fontFamily: tokens.typography.families.semiBold,
                      color: tokens.colors.warningText,
                    },
                  ]}
                >
                  {`Sobrepago de ${formatCurrencyFromCents(bill.overpaidCents)}: devuelve ese importe a quien pagó de más`}
                </Text>
              </View>
            ) : null}
          </View>

          <AppButton
            variant="secondary"
            size="lg"
            label="Finalizar"
            onPress={onBackPress}
            style={{ borderRadius: tokens.radius.radiusFull }}
            testID="bill-paid-finish-button"
          />
        </SafeAreaView>
      </View>
    );
  }

  return (
    <ScreenContainer scrollable edges={['top', 'bottom']}>
      <View style={[styles.container, { gap: tokens.spacing.space3 }]}>
        <AppHeader
          centerSlot={<NemiPayLogo size="sm" />}
          onBackPress={onBackPress}
          backTestID="bill-back-button"
          testID="bill-screen-header"
        />

        {flashMessage ? (
          <View
            testID="bill-partial-flash"
            style={[
              styles.flashBanner,
              {
                backgroundColor: tokens.colors.success,
                borderRadius: tokens.radius.radiusMD,
              },
            ]}
          >
            <AppIcon name="circle-check" size={18} color={tokens.colors.textOnPrimary} />
            <Text
              style={[
                styles.flashText,
                {
                  fontFamily: tokens.typography.families.semiBold,
                  color: tokens.colors.textOnPrimary,
                },
              ]}
            >
              {flashMessage}
            </Text>
          </View>
        ) : null}

        {bill.overpaidCents > 0 ? (
          <View
            testID="bill-overpaid-banner"
            style={[
              styles.overpaidBanner,
              {
                backgroundColor: tokens.colors.warningLight,
                borderColor: tokens.colors.warning,
                borderRadius: tokens.radius.radiusMD,
              },
            ]}
          >
            <AppIcon name="circle-alert" size={18} color={tokens.colors.warningText} />
            <Text
              style={[
                styles.overpaidText,
                {
                  fontFamily: tokens.typography.families.semiBold,
                  color: tokens.colors.warningText,
                },
              ]}
            >
              {`Sobrepago de ${formatCurrencyFromCents(bill.overpaidCents)}: devuelve ese importe a quien pagó de más`}
            </Text>
          </View>
        ) : null}

        <BillHeader
          bill={bill}
          participants={participants}
          activeIndex={activeIndex}
          onSelectIndex={setSelectedIndex}
        />

        {bill.status === 'CANCELLED' || bill.status === 'EXPIRED' ? (
          <AppCard variant="secondary" padding="md" style={{ gap: tokens.spacing.space2 }}>
            <Text
              style={[
                styles.stateTitle,
                { fontFamily: tokens.typography.families.bold, color: tokens.colors.textPrimary },
              ]}
            >
              {bill.status === 'CANCELLED' ? 'Cuenta cancelada' : 'Cuenta expirada'}
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
              {`Recaudado: ${formatCurrencyFromCents(bill.collectedCents)} de ${formatCurrencyFromCents(bill.totalCents)}.`}
            </Text>
            <AppButton variant="primary" label="Volver" onPress={onBackPress} />
          </AppCard>
        ) : (
          <BillCarousel
            detail={resolvedDetail}
            activeIndex={activeIndex}
            onActiveIndexChange={setSelectedIndex}
          />
        )}

        {!hasConfirmedPayments && (bill.status === 'OPEN' || bill.status === 'PARTIALLY_PAID') ? (
          cancelConfirmVisible ? (
            <AppCard variant="selected" padding="md" style={{ gap: tokens.spacing.space2 }}>
              <Text
                style={[
                  styles.cancelPrompt,
                  {
                    fontFamily: tokens.typography.families.semiBold,
                    color: tokens.colors.textPrimary,
                  },
                ]}
              >
                ¿Cancelar esta cuenta y sus QR activos?
              </Text>
              {cancelError ? (
                <Text
                  style={[
                    styles.errorText,
                    { fontFamily: tokens.typography.families.medium, color: tokens.colors.error },
                  ]}
                >
                  {cancelError}
                </Text>
              ) : null}
              <AppButton
                variant="destructive"
                label={cancelBillMutation.isPending ? 'Cancelando…' : 'Confirmar cancelación'}
                loading={cancelBillMutation.isPending}
                disabled={cancelBillMutation.isPending}
                onPress={() => void handleConfirmCancelBill()}
                testID="bill-confirm-cancel-button"
              />
              <AppButton
                variant="outlined"
                label="Seguir cobrando"
                disabled={cancelBillMutation.isPending}
                onPress={() => setCancelConfirmVisible(false)}
              />
            </AppCard>
          ) : (
            <AppButton
              variant="outlined"
              size="md"
              label="Cancelar cuenta"
              onPress={() => setCancelConfirmVisible(true)}
              style={{ borderRadius: tokens.radius.radiusFull }}
              testID="bill-cancel-button"
            />
          )
        ) : null}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: 24,
  },
  centerState: {
    flex: 1,
    minHeight: 360,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 16,
  },
  stateTitle: {
    fontSize: 18,
    lineHeight: 24,
    textAlign: 'center',
  },
  stateSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  flashBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  flashText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  overpaidBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  overpaidFullscreenBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    marginTop: 12,
  },
  overpaidText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  cancelPrompt: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
  },
  paidFullScreen: {
    flex: 1,
  },
  paidSafeArea: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  paidContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  paidIconCircle: {
    width: 96,
    height: 96,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  paidTitle: {
    fontSize: 30,
    lineHeight: 36,
    textAlign: 'center',
  },
  paidTotalText: {
    fontSize: 44,
    lineHeight: 52,
  },
  paidConcept: {
    fontSize: 16,
    lineHeight: 22,
    textAlign: 'center',
  },
});
