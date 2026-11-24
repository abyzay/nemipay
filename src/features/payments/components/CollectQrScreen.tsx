import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { ScreenContainer } from '@/components/layout';
import { AppButton, AppCard, AppHeader, AppIcon, AppInput } from '@/components/ui';
import { getMockDashboardData } from '@/features/business/services';
import { useAppTheme } from '@/hooks';
import { formatCurrencyFromCents } from '@/utils/currency';
import { PaymentReceivedModal } from './PaymentReceivedModal';

export type CollectMode = 'dynamic' | 'business';

export interface CollectQrScreenProps {
  initialMode?: CollectMode;
  initialAmountCents?: number;
  initialConcept?: string;
  onBackPress: () => void;
}

function formatInitialAmount(amountCents?: number): string {
  if (!amountCents || amountCents <= 0) {
    return '250';
  }
  return (amountCents / 100).toFixed(2).replace(/\.00$/, '');
}

function formatCurrentTimeLabel(): string {
  const now = new Date();
  const hours24 = now.getHours();
  const minutes = now.getMinutes().toString().padStart(2, '0');
  const period = hours24 >= 12 ? 'p.m.' : 'a.m.';
  const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
  return `${hours12}:${minutes} ${period}`;
}

export function CollectQrScreen({
  initialMode = 'dynamic',
  initialAmountCents,
  initialConcept,
  onBackPress,
}: CollectQrScreenProps) {
  const { tokens } = useAppTheme();
  const dashboardData = useMemo(() => getMockDashboardData(), []);
  const [mode, setMode] = useState<CollectMode>(initialMode);
  const [amountInput, setAmountInput] = useState(() => formatInitialAmount(initialAmountCents));
  const [conceptInput, setConceptInput] = useState(
    () => initialConcept?.trim() || 'Venta en mostrador'
  );
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [confirmedTimeLabel, setConfirmedTimeLabel] = useState(() => formatCurrentTimeLabel());

  const parsedAmountCents = useMemo(() => {
    const cleaned = amountInput.replace(/[^0-9.]/g, '');
    const numeric = Number.parseFloat(cleaned);
    if (!Number.isFinite(numeric) || numeric <= 0) {
      return 0;
    }
    return Math.round(numeric * 100);
  }, [amountInput]);

  const qrPayload = useMemo(() => {
    if (mode === 'business') {
      return JSON.stringify({
        type: 'CODI_STATIC_MERCHANT',
        merchant: dashboardData.merchant.businessName,
        alias: dashboardData.merchant.codiAlias,
      });
    }

    return JSON.stringify({
      type: 'CODI_DYNAMIC_CHARGE',
      merchant: dashboardData.merchant.businessName,
      alias: dashboardData.merchant.codiAlias,
      amountCents: parsedAmountCents,
      concept: conceptInput.trim() || 'Cobro NemiPay',
    });
  }, [
    conceptInput,
    dashboardData.merchant.businessName,
    dashboardData.merchant.codiAlias,
    mode,
    parsedAmountCents,
  ]);

  return (
    <ScreenContainer scrollable>
      <AppHeader
        title="Recibir pago CoDi"
        onBackPress={onBackPress}
        backTestID="collect-back-button"
      />

      <View
        style={[
          styles.modeSwitch,
          {
            backgroundColor: tokens.colors.surfaceSecondary,
            borderRadius: tokens.radius.radiusFull,
            padding: tokens.spacing.space1,
            marginTop: tokens.spacing.space3,
          },
        ]}
      >
        {(
          [
            { id: 'dynamic', label: 'Cobro por monto' },
            { id: 'business', label: 'QR del negocio' },
          ] as const
        ).map((option) => {
          const selected = mode === option.id;
          return (
            <Pressable
              key={option.id}
              accessibilityRole="button"
              onPress={() => setMode(option.id)}
              testID={`collect-mode-${option.id}`}
              style={[
                styles.modeTab,
                selected ? tokens.shadows.card : undefined,
                {
                  borderRadius: tokens.radius.radiusFull,
                  backgroundColor: selected ? tokens.colors.primary : 'transparent',
                  paddingVertical: tokens.spacing.space2 + 2,
                },
              ]}
            >
              <Text
                style={[
                  styles.modeTabText,
                  {
                    fontFamily: tokens.typography.families.semiBold,
                    color: selected ? tokens.colors.textOnPrimary : tokens.colors.textSecondary,
                  },
                ]}
              >
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {mode === 'dynamic' ? (
        <AppCard style={{ marginTop: tokens.spacing.space4, gap: tokens.spacing.space4 }}>
          <AppInput
            label="Monto a cobrar (MXN)"
            prefix="$"
            value={amountInput}
            onChangeText={setAmountInput}
            keyboardType="decimal-pad"
            placeholder="0.00"
            testID="collect-amount-input"
          />

          <AppInput
            label="Concepto del cobro"
            leftIcon="receipt"
            value={conceptInput}
            onChangeText={setConceptInput}
            placeholder="Ej. Orden mesa 2"
            testID="collect-concept-input"
          />
        </AppCard>
      ) : null}

      <AppCard
        style={[styles.qrCard, { marginTop: tokens.spacing.space4, gap: tokens.spacing.space3 }]}
      >
        <Text
          style={[
            styles.merchantName,
            {
              fontFamily: tokens.typography.families.semiBold,
              color: tokens.colors.textPrimary,
            },
          ]}
        >
          {dashboardData.merchant.businessName}
        </Text>
        <Text
          style={[
            styles.aliasText,
            tokens.typography.tabularNums,
            {
              fontFamily: tokens.typography.families.medium,
              color: tokens.colors.primary,
            },
          ]}
        >
          {mode === 'business'
            ? `Código fijo CoDi · ${dashboardData.merchant.codiAlias}`
            : parsedAmountCents > 0
              ? `Cobro por ${formatCurrencyFromCents(parsedAmountCents)} MXN`
              : 'Ingresa un monto mayor a $0.00'}
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
          <QRCode
            value={qrPayload}
            size={188}
            color={tokens.colors.textPrimary}
            backgroundColor={tokens.colors.background}
          />
        </View>

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
          <AppIcon name="shield-check" size={18} color={tokens.colors.primary} />
          <Text
            style={[
              styles.noticeText,
              {
                fontFamily: tokens.typography.families.medium,
                color: tokens.colors.gray[700],
              },
            ]}
          >
            Tu cliente escanea este QR desde su app bancaria. NemiPay solo recibe pagos.
          </Text>
        </View>
      </AppCard>

      <View style={{ paddingVertical: tokens.spacing.space4, gap: tokens.spacing.space3 }}>
        <AppButton
          variant="outlined"
          label="Volver al panel"
          onPress={onBackPress}
          testID="collect-done-button"
        />

        {mode === 'dynamic' ? (
          <AppButton
            variant="primary"
            label="Probar pago recibido"
            onPress={() => {
              setConfirmedTimeLabel(formatCurrentTimeLabel());
              setPaymentModalVisible(true);
            }}
            testID="collect-test-payment-modal-button"
          />
        ) : null}
      </View>

      <PaymentReceivedModal
        visible={paymentModalVisible}
        amountCents={parsedAmountCents > 0 ? parsedAmountCents : 25000}
        timeLabel={confirmedTimeLabel}
        concept={conceptInput.trim() || undefined}
        onAccept={() => setPaymentModalVisible(false)}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  modeSwitch: {
    flexDirection: 'row',
  },
  modeTab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeTabText: {
    fontSize: 13,
    lineHeight: 18,
  },
  qrCard: {
    alignItems: 'center',
  },
  merchantName: {
    fontSize: 18,
    lineHeight: 26,
    textAlign: 'center',
  },
  aliasText: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  qrWrapper: {
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noticeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    borderWidth: 1,
  },
  noticeText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
  },
});
