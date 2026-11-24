import React, { useEffect, useState } from 'react';
import { Animated, Modal, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import ConfettiCannon from 'react-native-confetti-cannon';
import { AppButton, AppIcon, SurfaceCard } from '@/components/ui';
import { useAppTheme } from '@/hooks';
import type { CurrencyCode } from '@/types/common';
import { formatCurrencyFromCents } from '@/utils/currency';

export interface PaymentReceivedModalProps {
  visible: boolean;
  amountCents: number;
  currency?: CurrencyCode;
  timeLabel: string;
  concept?: string;
  onAccept: () => void;
}

const CELEBRATION_RAY_ANGLES = [0, 45, 90, 135, 180, 225, 270, 315] as const;

export function PaymentReceivedModal({
  visible,
  amountCents,
  currency = 'MXN',
  timeLabel,
  concept,
  onAccept,
}: PaymentReceivedModalProps) {
  const { tokens } = useAppTheme();
  const { width: windowWidth } = useWindowDimensions();
  const [badgeScale] = useState(() => new Animated.Value(0.6));
  const [badgeOpacity] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (!visible) {
      badgeScale.setValue(0.6);
      badgeOpacity.setValue(0);
      return;
    }

    Animated.parallel([
      Animated.spring(badgeScale, {
        toValue: 1,
        friction: 6,
        tension: 90,
        useNativeDriver: true,
      }),
      Animated.timing(badgeOpacity, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start();
  }, [badgeOpacity, badgeScale, visible]);

  const confettiColors = [
    tokens.colors.primary,
    tokens.colors.success,
    tokens.colors.warning,
    tokens.colors.secondary,
    tokens.colors.primaryDark,
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onAccept}
      statusBarTranslucent
    >
      <View style={[styles.backdrop, { backgroundColor: tokens.colors.primaryDark }]}>
        <SurfaceCard
          testID="payment-received-modal"
          style={[
            styles.card,
            tokens.elevations.md,
            {
              borderRadius: tokens.radii.xl,
              paddingHorizontal: tokens.spacing.lg,
              paddingVertical: tokens.spacing.xl,
            },
          ]}
        >
          <Animated.View
            style={[
              styles.celebrationContainer,
              {
                opacity: badgeOpacity,
                transform: [{ scale: badgeScale }],
              },
            ]}
          >
            {CELEBRATION_RAY_ANGLES.map((angle, index) => (
              <View
                key={angle}
                style={[styles.raySlot, { transform: [{ rotate: `${angle}deg` }] }]}
              >
                <View
                  style={[
                    styles.rayDash,
                    {
                      borderRadius: tokens.radii.full,
                      backgroundColor:
                        index % 2 === 0 ? tokens.colors.primary : tokens.colors.warning,
                    },
                  ]}
                />
              </View>
            ))}

            <View
              style={[
                styles.checkCircle,
                {
                  backgroundColor: tokens.colors.success,
                  borderRadius: tokens.radii.full,
                },
              ]}
            >
              <AppIcon
                name="checkmark"
                size={46}
                color={tokens.colors.onPrimary}
                testID="payment-received-check-icon"
              />
            </View>
          </Animated.View>

          <Text
            style={[
              styles.title,
              {
                fontFamily: tokens.typography.families.bold,
                color: tokens.colors.textPrimary,
                marginTop: tokens.spacing.lg,
              },
            ]}
          >
            ¡Pago recibido!
          </Text>

          <Text
            testID="payment-received-amount"
            style={[
              styles.amount,
              {
                fontFamily: tokens.typography.families.bold,
                color: tokens.colors.textPrimary,
                marginTop: tokens.spacing.xs,
              },
            ]}
          >
            {formatCurrencyFromCents(amountCents, { currency })}
          </Text>

          <Text
            testID="payment-received-time"
            style={[
              styles.timeLabel,
              {
                fontFamily: tokens.typography.families.regular,
                color: tokens.colors.textSecondary,
                marginTop: tokens.spacing.xxs,
              },
            ]}
          >
            {concept ? `${concept} · ${timeLabel}` : timeLabel}
          </Text>

          <View style={[styles.buttonContainer, { marginTop: tokens.spacing.xl }]}>
            <AppButton
              variant="primary"
              label="Aceptar"
              onPress={onAccept}
              testID="payment-received-accept-button"
            />
          </View>
        </SurfaceCard>

        {visible ? (
          <View pointerEvents="none" style={StyleSheet.absoluteFill}>
            <ConfettiCannon
              count={90}
              origin={{ x: windowWidth / 2, y: -10 }}
              explosionSpeed={360}
              fallSpeed={2500}
              fadeOut
              autoStart
              colors={confettiColors}
              testID="payment-received-confetti"
            />
          </View>
        ) : null}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    opacity: 0.98,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
  },
  celebrationContainer: {
    width: 140,
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
  },
  raySlot: {
    position: 'absolute',
    width: 140,
    height: 140,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  rayDash: {
    width: 5,
    height: 16,
  },
  checkCircle: {
    width: 84,
    height: 84,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    lineHeight: 30,
    textAlign: 'center',
  },
  amount: {
    fontSize: 38,
    lineHeight: 46,
    letterSpacing: -0.8,
    textAlign: 'center',
  },
  timeLabel: {
    fontSize: 15,
    lineHeight: 20,
    textAlign: 'center',
  },
  buttonContainer: {
    width: '100%',
  },
});
