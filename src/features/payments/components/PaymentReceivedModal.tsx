import React, { useEffect } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { AmountDisplay } from '@/components/financial';
import { AppIcon } from '@/components/ui';
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

  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="fade"
      onRequestClose={onAccept}
      statusBarTranslucent
    >
      <View
        testID="payment-received-modal"
        style={[styles.fullscreen, { backgroundColor: tokens.colors.success }]}
      >
        <View style={styles.content}>
          <Animated.View style={[styles.celebrationContainer, badgeAnimatedStyle]}>
            {CELEBRATION_RAY_ANGLES.map((angle) => (
              <View
                key={angle}
                style={[styles.raySlot, { transform: [{ rotate: `${angle}deg` }] }]}
              >
                <View
                  style={[
                    styles.rayDash,
                    {
                      borderRadius: tokens.radius.radiusFull,
                      backgroundColor: 'rgba(255, 255, 255, 0.72)',
                    },
                  ]}
                />
              </View>
            ))}

            <View
              style={[
                styles.checkCircle,
                {
                  backgroundColor: tokens.colors.textOnPrimary,
                  borderRadius: tokens.radius.radiusFull,
                },
              ]}
            >
              <AppIcon
                name="check"
                size={48}
                strokeWidth={2.8}
                color={tokens.colors.success}
                testID="payment-received-check-icon"
              />
            </View>
          </Animated.View>

          <Text
            style={[
              styles.title,
              {
                fontFamily: tokens.typography.families.bold,
                color: tokens.colors.textOnPrimary,
                marginTop: tokens.spacing.space5,
              },
            ]}
          >
            ¡Pago recibido!
          </Text>

          <AmountDisplay
            amountCents={amountCents}
            currency={currency}
            size="display"
            tone="onPrimary"
            testID="payment-received-amount"
            style={{ marginTop: tokens.spacing.space2, fontSize: 44, lineHeight: 52 }}
          />

          <Text
            testID="payment-received-time"
            style={[
              styles.timeLabel,
              {
                fontFamily: tokens.typography.families.medium,
                color: 'rgba(255, 255, 255, 0.92)',
                marginTop: tokens.spacing.space2,
              },
            ]}
          >
            {concept ? `${concept} · ${timeLabel}` : timeLabel}
          </Text>
        </View>

        <View style={styles.footer}>
          <Pressable
            accessibilityRole="button"
            onPress={onAccept}
            testID="payment-received-accept-button"
            style={({ pressed }) => [
              styles.acceptButton,
              {
                backgroundColor: tokens.colors.textOnPrimary,
                borderRadius: tokens.radius.radiusFull,
                opacity: pressed ? 0.9 : 1,
              },
            ]}
          >
            <Text
              style={[
                styles.acceptLabel,
                {
                  fontFamily: tokens.typography.families.bold,
                  color: tokens.colors.success,
                },
              ]}
            >
              Listo
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fullscreen: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 48,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  celebrationContainer: {
    width: 148,
    height: 148,
    alignItems: 'center',
    justifyContent: 'center',
  },
  raySlot: {
    position: 'absolute',
    width: 148,
    height: 148,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  rayDash: {
    width: 4,
    height: 16,
  },
  checkCircle: {
    width: 96,
    height: 96,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    lineHeight: 36,
    textAlign: 'center',
  },
  timeLabel: {
    fontSize: 16,
    lineHeight: 22,
    textAlign: 'center',
  },
  footer: {
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
  },
  acceptButton: {
    width: '100%',
    minHeight: 54,
    alignItems: 'center',
    justifyContent: 'center',
  },
  acceptLabel: {
    fontSize: 17,
    lineHeight: 22,
  },
});
