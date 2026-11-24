import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { ScreenContainer } from '@/components/layout';
import { AppButton, AppIcon, SurfaceCard } from '@/components/ui';
import { getMockDashboardData } from '@/features/business/services';
import { useAppTheme } from '@/hooks';
import { formatCurrencyFromCents } from '@/utils/currency';
import { PaymentReceivedModal } from './PaymentReceivedModal';

export type CollectMode = 'dynamic' | 'business';

export interface CollectQrScreenProps {
  initialMode?: CollectMode;
  onBackPress: () => void;
}

function formatCurrentTimeLabel(): string {
  const now = new Date();
  const hours24 = now.getHours();
  const minutes = now.getMinutes().toString().padStart(2, '0');
  const period = hours24 >= 12 ? 'p.m.' : 'a.m.';
  const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
  return `${hours12}:${minutes} ${period}`;
}

export function CollectQrScreen({ initialMode = 'dynamic', onBackPress }: CollectQrScreenProps) {
  const { tokens } = useAppTheme();
  const dashboardData = useMemo(() => getMockDashboardData(), []);
  const [mode, setMode] = useState<CollectMode>(initialMode);
  const [amountInput, setAmountInput] = useState('250');
  const [conceptInput, setConceptInput] = useState('Venta en mostrador');
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
      <View style={[styles.header, { paddingTop: tokens.spacing.xs }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Regresar al inicio"
          onPress={onBackPress}
          testID="collect-back-button"
          style={({ pressed }) => [
            styles.backButton,
            {
              borderRadius: tokens.radii.full,
              backgroundColor: pressed ? tokens.colors.secondary : 'transparent',
            },
          ]}
        >
          <AppIcon name="chevron-back" size={24} color={tokens.colors.textPrimary} />
        </Pressable>

        <Text
          style={[
            styles.headerTitle,
            {
              fontFamily: tokens.typography.families.bold,
              color: tokens.colors.textPrimary,
            },
          ]}
        >
          Recibir pago CoDi
        </Text>

        <View style={styles.headerSpacer} />
      </View>

      <View
        style={[
          styles.modeSwitch,
          {
            backgroundColor: tokens.colors.surface,
            borderColor: tokens.colors.border,
            borderRadius: tokens.radii.full,
            padding: tokens.spacing.xxs,
            marginTop: tokens.spacing.sm,
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
                {
                  borderRadius: tokens.radii.full,
                  backgroundColor: selected ? tokens.colors.primary : 'transparent',
                  paddingVertical: tokens.spacing.xs + 2,
                },
              ]}
            >
              <Text
                style={[
                  styles.modeTabText,
                  {
                    fontFamily: tokens.typography.families.semiBold,
                    color: selected ? tokens.colors.onPrimary : tokens.colors.textSecondary,
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
        <SurfaceCard style={{ marginTop: tokens.spacing.md, gap: tokens.spacing.sm }}>
          <Text
            style={[
              styles.fieldLabel,
              {
                fontFamily: tokens.typography.families.semiBold,
                color: tokens.colors.textSecondary,
              },
            ]}
          >
            Monto a cobrar (MXN)
          </Text>
          <View
            style={[
              styles.amountRow,
              {
                borderColor: tokens.colors.border,
                backgroundColor: tokens.colors.background,
                borderRadius: tokens.radii.md,
                paddingHorizontal: tokens.spacing.sm,
              },
            ]}
          >
            <Text
              style={[
                styles.currencySymbol,
                {
                  fontFamily: tokens.typography.families.bold,
                  color: tokens.colors.primary,
                },
              ]}
            >
              $
            </Text>
            <TextInput
              value={amountInput}
              onChangeText={setAmountInput}
              keyboardType="decimal-pad"
              placeholder="0.00"
              placeholderTextColor={tokens.colors.textSecondary}
              testID="collect-amount-input"
              style={[
                styles.amountInput,
                {
                  fontFamily: tokens.typography.families.bold,
                  color: tokens.colors.textPrimary,
                },
              ]}
            />
          </View>

          <Text
            style={[
              styles.fieldLabel,
              {
                fontFamily: tokens.typography.families.semiBold,
                color: tokens.colors.textSecondary,
              },
            ]}
          >
            Concepto del cobro
          </Text>
          <TextInput
            value={conceptInput}
            onChangeText={setConceptInput}
            placeholder="Ej. Orden mesa 2"
            placeholderTextColor={tokens.colors.textSecondary}
            testID="collect-concept-input"
            style={[
              styles.conceptInput,
              {
                borderColor: tokens.colors.border,
                backgroundColor: tokens.colors.background,
                borderRadius: tokens.radii.md,
                paddingHorizontal: tokens.spacing.sm,
                fontFamily: tokens.typography.families.medium,
                color: tokens.colors.textPrimary,
              },
            ]}
          />
        </SurfaceCard>
      ) : null}

      <SurfaceCard
        style={[styles.qrCard, { marginTop: tokens.spacing.md, gap: tokens.spacing.sm }]}
      >
        <Text
          style={[
            styles.merchantName,
            {
              fontFamily: tokens.typography.families.bold,
              color: tokens.colors.textPrimary,
            },
          ]}
        >
          {dashboardData.merchant.businessName}
        </Text>
        <Text
          style={[
            styles.aliasText,
            {
              fontFamily: tokens.typography.families.medium,
              color: tokens.colors.textSecondary,
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
              backgroundColor: tokens.colors.surface,
              borderColor: tokens.colors.border,
              borderRadius: tokens.radii.lg,
              padding: tokens.spacing.md,
            },
          ]}
        >
          <QRCode
            value={qrPayload}
            size={188}
            color={tokens.colors.textPrimary}
            backgroundColor={tokens.colors.surface}
          />
        </View>

        <View
          style={[
            styles.noticeBanner,
            {
              backgroundColor: tokens.colors.secondary,
              borderRadius: tokens.radii.md,
              padding: tokens.spacing.sm,
              gap: tokens.spacing.xs,
            },
          ]}
        >
          <AppIcon name="shield-checkmark-outline" size={18} color={tokens.colors.primaryDark} />
          <Text
            style={[
              styles.noticeText,
              {
                fontFamily: tokens.typography.families.medium,
                color: tokens.colors.onSecondary,
              },
            ]}
          >
            Tu cliente escanea este QR desde su app bancaria. NemiPay solo recibe pagos.
          </Text>
        </View>
      </SurfaceCard>

      <View style={{ paddingVertical: tokens.spacing.md, gap: tokens.spacing.sm }}>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 48,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 18,
    lineHeight: 24,
  },
  headerSpacer: {
    width: 44,
  },
  modeSwitch: {
    flexDirection: 'row',
    borderWidth: 1,
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
  fieldLabel: {
    fontSize: 13,
    lineHeight: 18,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    minHeight: 50,
    gap: 6,
  },
  currencySymbol: {
    fontSize: 22,
    lineHeight: 28,
  },
  amountInput: {
    flex: 1,
    fontSize: 22,
    lineHeight: 28,
    paddingVertical: 8,
  },
  conceptInput: {
    borderWidth: 1,
    minHeight: 46,
    fontSize: 15,
    lineHeight: 20,
    paddingVertical: 10,
  },
  qrCard: {
    alignItems: 'center',
  },
  merchantName: {
    fontSize: 18,
    lineHeight: 24,
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
  },
  noticeText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
  },
});
