import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, StyleSheet, View, useWindowDimensions } from 'react-native';
import { AppButton } from '@/components/ui';
import { useAppTheme } from '@/hooks';
import { generateIdempotencyKey } from '@/services/security/crypto';
import { useShareCharge } from '../hooks/useShareCharge';
import type { BillDetail, BillParticipantDetail } from '../types';
import { FreeContributionSlide, ShareSlide } from './ShareSlide';

// VERIFY: Mantener MAX_LIVE_SHARES = 2 mientras Pey soporte >= 2 QR simultáneos.
export const MAX_LIVE_SHARES = 2;
const AUTO_ADVANCE_DELAY_MS = 1500;

export interface BillCarouselProps {
  detail: BillDetail;
  activeIndex: number;
  onActiveIndexChange: (index: number) => void;
}

type CarouselItem =
  { kind: 'participant'; participant: BillParticipantDetail } | { kind: 'new-free' };

function isChargeLiveNotExpired(participant: BillParticipantDetail, nowMs: number): boolean {
  const charge = participant.charge;
  if (!charge) return false;
  if (charge.status === 'CREATING') return true;
  if (charge.status === 'AWAITING_PAYMENT') {
    return new Date(charge.expiresAt).getTime() > nowMs;
  }
  return false;
}

function needsQrGeneration(participant: BillParticipantDetail): boolean {
  if (participant.state === 'PAID' || participant.state === 'REVIEW') {
    return false;
  }
  if (!participant.charge) {
    return true;
  }
  return false;
}

export function BillCarousel({ detail, activeIndex, onActiveIndexChange }: BillCarouselProps) {
  const { tokens } = useAppTheme();
  const { width: windowWidth } = useWindowDimensions();
  const listRef = useRef<FlatList<CarouselItem>>(null);
  const shareChargeMutation = useShareCharge();

  const slideWidth = Math.max(
    280,
    Math.min(540, windowWidth - tokens.layout.screenHorizontalPadding * 2)
  );
  const qrSize = Math.max(185, Math.min(230, slideWidth - 110));

  const [generatingParticipantIds, setGeneratingParticipantIds] = useState<Record<string, boolean>>(
    {}
  );
  const [shareErrors, setShareErrors] = useState<Record<string, string>>({});
  const [freeSubmitError, setFreeSubmitError] = useState<string | null>(null);
  const [nowMs, setNowMs] = useState(() => Date.now());

  const inFlightKeysRef = useRef<Map<string, string>>(new Map());
  const requestedAutoRef = useRef<Set<string>>(new Set());
  const prevActiveParticipantStateRef = useRef<string | null>(null);

  const isBillOpen = detail.bill.status === 'OPEN' || detail.bill.status === 'PARTIALLY_PAID';

  useEffect(() => {
    if (detail.bill.splitMode !== 'FREE' || !isBillOpen) {
      return;
    }
    const timer = setInterval(() => setNowMs(Date.now()), 5000);
    return () => clearInterval(timer);
  }, [detail.bill.splitMode, isBillOpen]);

  const slides: CarouselItem[] = useMemo(() => {
    const base: CarouselItem[] = detail.participants.map((p) => ({
      kind: 'participant',
      participant: p,
    }));
    if (detail.bill.splitMode === 'FREE' && isBillOpen) {
      base.push({ kind: 'new-free' });
    }
    return base;
  }, [detail.bill.splitMode, detail.participants, isBillOpen]);

  const freeAvailableCents = useMemo(() => {
    let confirmed = 0;
    let reserved = 0;
    for (const p of detail.participants) {
      if (!p.charge) continue;
      if (p.charge.status === 'CONFIRMED') {
        confirmed += p.charge.amountCents;
      } else if (
        (p.charge.status === 'CREATING' || p.charge.status === 'AWAITING_PAYMENT') &&
        new Date(p.charge.expiresAt).getTime() > nowMs
      ) {
        reserved += p.charge.amountCents;
      }
    }
    return Math.max(0, detail.bill.totalCents - confirmed - reserved);
  }, [detail.bill.totalCents, detail.participants, nowMs]);

  const scrollToSlide = useCallback(
    (index: number) => {
      const clamped = Math.max(0, Math.min(slides.length - 1, index));
      onActiveIndexChange(clamped);
      listRef.current?.scrollToIndex({ index: clamped, animated: true });
    },
    [onActiveIndexChange, slides.length]
  );

  const reserveParticipantQr = useCallback(
    async (participantId: string, forceNewKey = false) => {
      if (generatingParticipantIds[participantId]) return;

      let key = forceNewKey ? undefined : inFlightKeysRef.current.get(participantId);
      if (!key) {
        key = generateIdempotencyKey();
        inFlightKeysRef.current.set(participantId, key);
      }

      setGeneratingParticipantIds((prev) => ({ ...prev, [participantId]: true }));
      setShareErrors((prev) => {
        if (!prev[participantId]) return prev;
        const copy = { ...prev };
        delete copy[participantId];
        return copy;
      });

      try {
        await shareChargeMutation.mutateAsync({
          input: { billId: detail.bill.id, participantId },
          idempotencyKey: key,
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'No pudimos generar el QR.';
        setShareErrors((prev) => ({ ...prev, [participantId]: message }));
      } finally {
        setGeneratingParticipantIds((prev) => ({ ...prev, [participantId]: false }));
      }
    },
    [detail.bill.id, generatingParticipantIds, shareChargeMutation]
  );

  // Creación bajo demanda al activar diapositiva + pre-creación respetando MAX_LIVE_SHARES
  useEffect(() => {
    if (!isBillOpen || detail.bill.splitMode === 'FREE') {
      return;
    }

    const nowMs = Date.now();
    const liveCount = detail.participants.filter((p) => isChargeLiveNotExpired(p, nowMs)).length;
    const activeSlide = slides[activeIndex];
    const activeParticipant = activeSlide?.kind === 'participant' ? activeSlide.participant : null;

    if (
      activeParticipant &&
      needsQrGeneration(activeParticipant) &&
      !requestedAutoRef.current.has(activeParticipant.id) &&
      liveCount < MAX_LIVE_SHARES
    ) {
      requestedAutoRef.current.add(activeParticipant.id);
      void reserveParticipantQr(activeParticipant.id);
      return;
    }

    // Si la diapositiva activa ya tiene QR y aún cabe otra en MAX_LIVE_SHARES, pre-crea la siguiente pendiente
    if (
      activeParticipant &&
      isChargeLiveNotExpired(activeParticipant, nowMs) &&
      liveCount < MAX_LIVE_SHARES
    ) {
      const nextPending =
        detail.participants.slice(activeIndex + 1).find((p) => needsQrGeneration(p)) ??
        detail.participants.find((p) => needsQrGeneration(p));
      if (nextPending && !requestedAutoRef.current.has(nextPending.id)) {
        requestedAutoRef.current.add(nextPending.id);
        void reserveParticipantQr(nextPending.id);
      }
    }
  }, [
    activeIndex,
    detail.bill.splitMode,
    detail.participants,
    isBillOpen,
    reserveParticipantQr,
    slides,
  ]);

  // Avance automático tras ~1.5 s cuando la diapositiva activa se marca como pagada
  useEffect(() => {
    const activeSlide = slides[activeIndex];
    const currentKey =
      activeSlide?.kind === 'participant'
        ? `${activeSlide.participant.id}:${activeSlide.participant.state}`
        : null;

    const prevKey = prevActiveParticipantStateRef.current;
    prevActiveParticipantStateRef.current = currentKey;

    if (
      activeSlide?.kind !== 'participant' ||
      activeSlide.participant.state !== 'PAID' ||
      prevKey === currentKey ||
      !prevKey?.startsWith(`${activeSlide.participant.id}:`)
    ) {
      return;
    }

    const timer = setTimeout(() => {
      if (detail.bill.splitMode === 'FREE') {
        const freeSlideIdx = slides.findIndex((s) => s.kind === 'new-free');
        if (freeSlideIdx !== -1) {
          scrollToSlide(freeSlideIdx);
        }
        return;
      }

      const nextIdxAfter = detail.participants.findIndex(
        (p, idx) => idx > activeIndex && (p.state === 'PENDING' || p.state === 'PAYING')
      );
      const nextIdxAny =
        nextIdxAfter !== -1
          ? nextIdxAfter
          : detail.participants.findIndex((p) => p.state === 'PENDING' || p.state === 'PAYING');
      if (nextIdxAny !== -1 && nextIdxAny !== activeIndex) {
        scrollToSlide(nextIdxAny);
      }
    }, AUTO_ADVANCE_DELAY_MS);

    return () => clearTimeout(timer);
  }, [activeIndex, detail.bill.splitMode, detail.participants, scrollToSlide, slides]);

  const handleRegenerateExpired = (participantId: string) => {
    inFlightKeysRef.current.delete(participantId);
    requestedAutoRef.current.add(participantId);
    void reserveParticipantQr(participantId, true);
  };

  const handleCreateFreeShare = async (amountCents: number, label: string) => {
    setFreeSubmitError(null);
    try {
      const created = await shareChargeMutation.mutateAsync({
        input: {
          billId: detail.bill.id,
          amountCents,
          label: label || undefined,
        },
        idempotencyKey: generateIdempotencyKey(),
      });
      if (created.participantId) {
        // La nueva aportación aparecerá justo antes de 'new-free'
        onActiveIndexChange(detail.participants.length);
      }
    } catch (err) {
      setFreeSubmitError(
        err instanceof Error ? err.message : 'No pudimos generar el QR para esta aportación.'
      );
    }
  };

  useEffect(() => {
    if (slides.length === 0) return;
    const clamped = Math.max(0, Math.min(slides.length - 1, activeIndex));
    try {
      listRef.current?.scrollToIndex({ index: clamped, animated: true });
    } catch {
      // Ignora si la lista aún no mide su layout inicial
    }
  }, [activeIndex, slides.length]);

  return (
    <View style={styles.container}>
      <FlatList
        ref={listRef}
        data={slides}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) =>
          item.kind === 'participant' ? item.participant.id : 'new-free-contribution'
        }
        getItemLayout={(_data, index) => ({
          length: slideWidth,
          offset: slideWidth * index,
          index,
        })}
        onMomentumScrollEnd={(event) => {
          const offsetX = event.nativeEvent.contentOffset.x;
          const nextIdx = Math.round(offsetX / slideWidth);
          if (nextIdx >= 0 && nextIdx < slides.length && nextIdx !== activeIndex) {
            onActiveIndexChange(nextIdx);
          }
        }}
        renderItem={({ item }) =>
          item.kind === 'participant' ? (
            <ShareSlide
              participant={item.participant}
              billConcept={detail.bill.concept}
              width={slideWidth}
              qrSize={qrSize}
              isGenerating={Boolean(generatingParticipantIds[item.participant.id])}
              errorMessage={shareErrors[item.participant.id]}
              onRegenerateExpired={handleRegenerateExpired}
              onRetryShare={(pid) => void reserveParticipantQr(pid, true)}
            />
          ) : (
            <FreeContributionSlide
              width={slideWidth}
              availableCents={freeAvailableCents}
              isSubmitting={shareChargeMutation.isPending}
              errorMessage={freeSubmitError}
              onSubmit={(amt, lbl) => void handleCreateFreeShare(amt, lbl)}
            />
          )
        }
        style={{ width: slideWidth, alignSelf: 'center' }}
      />

      {detail.bill.splitMode === 'FREE' && isBillOpen && slides.length > 1 ? (
        <View style={styles.navRow}>
          <AppButton
            variant="secondary"
            size="md"
            leftIcon="plus"
            label="Nueva aportación"
            onPress={() => scrollToSlide(slides.length - 1)}
            style={{ borderRadius: tokens.radius.radiusFull }}
            testID="bill-carousel-new-free-button"
          />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
    width: '100%',
  },
  navRow: {
    width: '100%',
  },
});
