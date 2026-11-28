import React, { useEffect, useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PaymentReceipt, type PaymentReceiptDetail } from '@/components/financial';
import { ScreenBackdrop } from '@/components/layout';
import { AppBadge, AppButton, AppCard, AppHeader, AppIcon } from '@/components/ui';
import { formatReceiptDateTime } from '@/features/movements/services';
import { useAppTheme } from '@/hooks';
import type { CurrencyCode } from '@/types/common';
import { formatCurrencyFromCents } from '@/utils/currency';
import type { Charge } from '../types';

export interface PaymentReceivedModalProps {
  visible: boolean;
  amountCents: number;
  currency?: CurrencyCode;
  timeLabel: string;
  concept?: string;
  charge?: Charge;
  merchantName?: string;
  onAccept: () => void;
}

const CELEBRATION_RAYS = [
  { angle: 0, colorKey: 'primary' },
  { angle: 45, colorKey: 'warning' },
  { angle: 90, colorKey: 'success' },
  { angle: 135, colorKey: 'primary' },
  { angle: 180, colorKey: 'warning' },
  { angle: 225, colorKey: 'success' },
  { angle: 270, colorKey: 'primary' },
  { angle: 315, colorKey: 'warning' },
] as const;

export function PaymentReceivedModal({
  visible,
  amountCents,
  currency = 'MXN',
  timeLabel,
  concept,
  charge,
  merchantName,
  onAccept,
}: PaymentReceivedModalProps) {
  const { tokens } = useAppTheme();
  const reducedMotion = useReducedMotion();
  const badgeScale = useSharedValue(visible ? 1 : 0.8);
  const badgeOpacity = useSharedValue(1);
  const [showReceipt, setShowReceipt] = useState(false);
  const isReceiptVisible = visible && showReceipt;

  useEffect(() => {
    if (!visible) {
      badgeScale.value = 0.8;
      return;
    }

    if (reducedMotion) {
      badgeScale.value = 1;
      badgeOpacity.value = 1;
      return;
    }

    badgeScale.value = 0.8;
    badgeOpacity.value = 1;
    badgeScale.value = withSpring(1, { damping: 12, stiffness: 180 });
  }, [badgeOpacity, badgeScale, reducedMotion, visible]);

  const badgeAnimatedStyle = useAnimatedStyle(() => ({
    opacity: badgeOpacity.value,
    transform: [{ scale: badgeScale.value }],
  }));

  const resolvedConcept = charge?.concept ?? concept ?? 'Cobro NemiPay';
  const resolvedPaidDate = formatReceiptDateTime(charge?.paidAt ?? charge?.createdAt);

  const handleAccept = () => {
    setShowReceipt(false);
    onAccept();
  };

  const receiptDetails: PaymentReceiptDetail[] = [];
  if (merchantName?.trim()) {
    receiptDetails.push({ label: 'Comercio', value: merchantName.trim() });
  }
  receiptDetails.push({ label: 'Concepto', value: resolvedConcept });
  receiptDetails.push({ label: 'Método', value: 'CoDi (QR)' });
  receiptDetails.push({
    label: 'Fecha y hora',
    value: resolvedPaidDate || timeLabel,
  });
  if (charge?.id) {
    receiptDetails.push({
      label: 'Folio',
      value: charge.id.slice(0, 8).toUpperCase(),
    });
  }
  if (charge?.peyReference) {
    receiptDetails.push({
      label: 'Referencia CoDi',
      value: charge.peyReference,
    });
  }
  if (charge?.peyTransactionId) {
    receiptDetails.push({
      label: 'ID de transacción',
      value: charge.peyTransactionId,
    });
  }

  const rayColorMap = {
    primary: tokens.colors.primary,
    warning: tokens.colors.warning,
    success: tokens.colors.success,
  } as const;

  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="fade"
      onRequestClose={isReceiptVisible ? () => setShowReceipt(false) : handleAccept}
      statusBarTranslucent
    >
      <View
        testID="payment-received-modal"
        style={[styles.root, { backgroundColor: tokens.colors.background }]}
      >
        <ScreenBackdrop />

        <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
          {isReceiptVisible ? (
            <View style={[styles.receiptScreen, { paddingHorizontal: tokens.spacing.space6 }]}>
              <AppHeader
                title="Comprobante de pago"
                onBackPress={() => setShowReceipt(false)}
                backTestID="payment-receipt-back-button"
                testID="payment-receipt-header"
              />

              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{
                  paddingTop: tokens.spacing.space4,
                  paddingBottom: tokens.spacing.space6,
                  gap: tokens.spacing.space4,
                }}
              >
                <PaymentReceipt
                  title={resolvedConcept}
                  amountCents={amountCents}
                  currency={currency}
                  status="confirmed"
                  statusLabel={charge?.paidAfterExpiry ? 'Pagado (tardío)' : 'Pago confirmado'}
                  details={receiptDetails}
                  testID="payment-receipt-card"
                />

                {charge?.items && charge.items.length > 0 ? (
                  <AppCard
                    variant="secondary"
                    padding="md"
                    style={{ gap: tokens.spacing.space2 }}
                    testID="payment-receipt-items"
                  >
                    <Text
                      style={[
                        styles.itemsHeading,
                        {
                          fontFamily: tokens.typography.families.semiBold,
                          color: tokens.colors.textPrimary,
                        },
                      ]}
                    >
                      Detalle de artículos
                    </Text>
                    {charge.items.map((item) => (
                      <View key={item.productId} style={styles.itemRow}>
                        <Text
                          style={[
                            styles.itemName,
                            {
                              fontFamily: tokens.typography.families.regular,
                              color: tokens.colors.textSecondary,
                            },
                          ]}
                        >
                          {`${item.quantity}× ${item.name}`}
                        </Text>
                        <Text
                          style={[
                            styles.itemPrice,
                            tokens.typography.tabularNums,
                            {
                              fontFamily: tokens.typography.families.semiBold,
                              color: tokens.colors.textPrimary,
                            },
                          ]}
                        >
                          {formatCurrencyFromCents(item.priceCents * item.quantity, { currency })}
                        </Text>
                      </View>
                    ))}
                  </AppCard>
                ) : null}
              </ScrollView>

              <View style={[styles.receiptFooter, { paddingBottom: tokens.spacing.space4 }]}>
                <AppButton
                  variant="primary"
                  size="lg"
                  label="Aceptar"
                  onPress={handleAccept}
                  style={{ borderRadius: tokens.radius.radiusFull }}
                  testID="payment-receipt-accept-button"
                />
              </View>
            </View>
          ) : (
            <View
              style={[
                styles.celebrationLayout,
                {
                  paddingHorizontal: tokens.spacing.space6,
                  paddingVertical: tokens.spacing.space6,
                },
              ]}
            >
              <View style={styles.content}>
                <Animated.View style={[styles.celebrationContainer, badgeAnimatedStyle]}>
                  {CELEBRATION_RAYS.map((ray) => (
                    <View
                      key={ray.angle}
                      style={[styles.raySlot, { transform: [{ rotate: `${ray.angle}deg` }] }]}
                    >
                      <View
                        style={[
                          styles.rayDash,
                          {
                            borderRadius: tokens.radius.radiusFull,
                            backgroundColor: rayColorMap[ray.colorKey],
                          },
                        ]}
                      />
                    </View>
                  ))}

                  <View
                    style={[
                      styles.outerHalo,
                      {
                        backgroundColor: 'rgba(22, 163, 106, 0.08)',
                        borderRadius: tokens.radius.radiusFull,
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.checkCircle,
                        {
                          backgroundColor: tokens.colors.successLight,
                          borderRadius: tokens.radius.radiusFull,
                        },
                      ]}
                    >
                      <AppIcon
                        name="check"
                        size={44}
                        strokeWidth={2.8}
                        color={tokens.colors.success}
                        testID="payment-received-check-icon"
                      />
                    </View>
                  </View>
                </Animated.View>

                <Text
                  style={[
                    styles.title,
                    {
                      fontFamily: tokens.typography.families.bold,
                      color: tokens.colors.textPrimary,
                      marginTop: tokens.spacing.space5,
                    },
                  ]}
                >
                  ¡Pago recibido!
                </Text>

                <View style={[styles.amountRow, { marginTop: tokens.spacing.space2 }]}>
                  <Text
                    testID="payment-received-amount"
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    style={[
                      styles.amountValue,
                      tokens.typography.tabularNums,
                      {
                        fontFamily: tokens.typography.families.bold,
                        color: tokens.colors.success,
                      },
                    ]}
                  >
                    {formatCurrencyFromCents(amountCents, { currency })}
                  </Text>
                  <Text
                    style={[
                      styles.currencyText,
                      {
                        fontFamily: tokens.typography.families.semiBold,
                        color: tokens.colors.success,
                      },
                    ]}
                  >
                    {currency}
                  </Text>
                </View>

                <Text
                  testID="payment-received-concept"
                  numberOfLines={2}
                  style={[
                    styles.conceptText,
                    {
                      fontFamily: tokens.typography.families.semiBold,
                      color: tokens.colors.textPrimary,
                      marginTop: tokens.spacing.space3,
                    },
                  ]}
                >
                  {resolvedConcept}
                </Text>

                <Text
                  testID="payment-received-time"
                  style={[
                    styles.timeLabel,
                    {
                      fontFamily: tokens.typography.families.regular,
                      color: tokens.colors.textSecondary,
                      marginTop: tokens.spacing.space1,
                    },
                  ]}
                >
                  {timeLabel}
                </Text>

                {charge?.paidAfterExpiry ? (
                  <View style={{ marginTop: tokens.spacing.space3 }}>
                    <AppBadge
                      label="Confirmado tras vencimiento"
                      variant="warning"
                      icon="clock"
                      testID="payment-received-late-badge"
                    />
                  </View>
                ) : null}
              </View>

              <View style={[styles.footer, { gap: tokens.spacing.space3 }]}>
                <AppButton
                  variant="primary"
                  size="lg"
                  leftIcon="receipt"
                  label="Ver comprobante"
                  onPress={() => setShowReceipt(true)}
                  style={{ borderRadius: tokens.radius.radiusFull }}
                  testID="payment-received-receipt-button"
                />

                <AppButton
                  variant="secondary"
                  size="lg"
                  label="Aceptar"
                  onPress={handleAccept}
                  style={{ borderRadius: tokens.radius.radiusFull }}
                  testID="payment-received-accept-button"
                />
              </View>
            </View>
          )}
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    position: 'relative',
  },
  safeArea: {
    flex: 1,
  },
  celebrationLayout: {
    flex: 1,
    justifyContent: 'space-between',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  celebrationContainer: {
    width: 158,
    height: 158,
    alignItems: 'center',
    justifyContent: 'center',
  },
  raySlot: {
    position: 'absolute',
    width: 158,
    height: 158,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  rayDash: {
    width: 4,
    height: 14,
  },
  outerHalo: {
    width: 112,
    height: 112,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkCircle: {
    width: 92,
    height: 92,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    lineHeight: 34,
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    gap: 8,
    maxWidth: '100%',
  },
  amountValue: {
    fontSize: 40,
    lineHeight: 48,
    letterSpacing: -0.8,
    flexShrink: 1,
  },
  currencyText: {
    fontSize: 18,
    lineHeight: 24,
  },
  conceptText: {
    fontSize: 16,
    lineHeight: 22,
    textAlign: 'center',
  },
  timeLabel: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  footer: {
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
  },
  receiptScreen: {
    flex: 1,
  },
  receiptFooter: {
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
    paddingTop: 8,
  },
  itemsHeading: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 2,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  itemName: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  itemPrice: {
    fontSize: 14,
    lineHeight: 20,
  },
});
