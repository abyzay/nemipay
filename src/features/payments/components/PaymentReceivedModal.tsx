import React, { useEffect } from 'react';
import { Modal, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import ConfettiCannon from 'react-native-confetti-cannon';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { AmountDisplay, PaymentStatus } from '@/components/financial';
import { AppButton, AppCard, AppIcon } from '@/components/ui';
import { useAppTheme } from '@/hooks';
import type { CurrencyCode } from '@/types/common';

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
  const reducedMotion = useReducedMotion();
  const badgeScale = useSharedValue(visible ? 1 : 0.8);
  const badgeOpacity = useSharedValue(1);

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

  const confettiColors = [
    tokens.colors.primary,
    tokens.colors.success,
    tokens.colors.warning,
    tokens.colors.primaryLight,
    tokens.colors.lavender,
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onAccept}
      statusBarTranslucent
    >
      <View style={[styles.backdrop, { backgroundColor: tokens.colors.backdrop }]}>
        <AppCard
          variant="standard"
          testID="payment-received-modal"
          style={[
            styles.card,
            tokens.shadows.floating,
            {
              borderRadius: tokens.radius.radiusLarge,
              paddingHorizontal: tokens.spacing.space6,
              paddingVertical: tokens.spacing.space8,
            },
          ]}
        >
          <Animated.View style={[styles.celebrationContainer, badgeAnimatedStyle]}>
            {CELEBRATION_RAY_ANGLES.map((angle, index) => (
              <View
                key={angle}
                style={[styles.raySlot, { transform: [{ rotate: `${angle}deg` }] }]}
              >
                <View
                  style={[
                    styles.rayDash,
                    {
                      borderRadius: tokens.radius.radiusFull,
                      backgroundColor:
                        index % 2 === 0 ? tokens.colors.primary : tokens.colors.success,
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
                  borderRadius: tokens.radius.radiusFull,
                },
              ]}
            >
              <AppIcon
                name="check"
                size={42}
                strokeWidth={2.5}
                color={tokens.colors.textOnPrimary}
                testID="payment-received-check-icon"
              />
            </View>
          </Animated.View>

          <View style={{ marginTop: tokens.spacing.space4 }}>
            <PaymentStatus status="confirmed" label="Operación exitosa" />
          </View>

          <Text
            style={[
              styles.title,
              {
                fontFamily: tokens.typography.families.bold,
                color: tokens.colors.textPrimary,
                marginTop: tokens.spacing.space3,
              },
            ]}
          >
            ¡Pago recibido!
          </Text>

          <AmountDisplay
            amountCents={amountCents}
            currency={currency}
            size="display"
            tone="default"
            testID="payment-received-amount"
            style={{ marginTop: tokens.spacing.space2 }}
          />

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
            {concept ? `${concept} · ${timeLabel}` : timeLabel}
          </Text>

          <View style={[styles.buttonContainer, { marginTop: tokens.spacing.space8 }]}>
            <AppButton
              variant="primary"
              label="Aceptar"
              onPress={onAccept}
              testID="payment-received-accept-button"
            />
          </View>
        </AppCard>

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
  },
  card: {
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
  },
  celebrationContainer: {
    width: 132,
    height: 132,
    alignItems: 'center',
    justifyContent: 'center',
  },
  raySlot: {
    position: 'absolute',
    width: 132,
    height: 132,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  rayDash: {
    width: 4,
    height: 14,
  },
  checkCircle: {
    width: 82,
    height: 82,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    lineHeight: 32,
    textAlign: 'center',
  },
  timeLabel: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  buttonContainer: {
    width: '100%',
  },
});
