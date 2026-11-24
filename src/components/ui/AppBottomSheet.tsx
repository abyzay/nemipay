import React, { useEffect } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '@/hooks';
import { AppIcon } from './AppIcon';

export interface AppBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  closeAccessibilityLabel?: string;
  closeButtonTestID?: string;
  contentStyle?: StyleProp<ViewStyle>;
  testID?: string;
}

export function AppBottomSheet({
  visible,
  onClose,
  title,
  children,
  closeAccessibilityLabel = 'Cerrar',
  closeButtonTestID,
  contentStyle,
  testID,
}: AppBottomSheetProps) {
  const { tokens } = useAppTheme();
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();
  const translateY = useSharedValue(36);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (!visible) {
      translateY.value = 36;
      opacity.value = 0;
      return;
    }

    if (reducedMotion) {
      translateY.value = 0;
      opacity.value = 1;
      return;
    }

    opacity.value = withTiming(1, { duration: tokens.animation.transition });
    translateY.value = withSpring(0, { damping: 22, stiffness: 260, mass: 0.9 });
  }, [opacity, reducedMotion, tokens.animation.transition, translateY, visible]);

  const sheetAnimatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={[styles.backdrop, { backgroundColor: tokens.colors.backdrop }]}
      >
        <Pressable
          accessibilityLabel={closeAccessibilityLabel}
          style={StyleSheet.absoluteFill}
          onPress={onClose}
        />

        <Animated.View
          testID={testID}
          style={[
            styles.sheet,
            tokens.shadows.floating,
            sheetAnimatedStyle,
            {
              backgroundColor: tokens.colors.background,
              borderTopLeftRadius: tokens.radius.radiusSheet,
              borderTopRightRadius: tokens.radius.radiusSheet,
              paddingHorizontal: tokens.spacing.space6,
              paddingTop: tokens.spacing.space3,
              paddingBottom: Math.max(insets.bottom, tokens.spacing.space6),
            },
            contentStyle,
          ]}
        >
          <View style={styles.handleRow}>
            <View
              style={[
                styles.handle,
                {
                  backgroundColor: tokens.colors.gray[300],
                  borderRadius: tokens.radius.radiusFull,
                },
              ]}
            />
          </View>

          {title ? (
            <View style={[styles.header, { marginBottom: tokens.spacing.space4 }]}>
              <Text
                style={[
                  styles.title,
                  {
                    fontFamily: tokens.typography.families.semiBold,
                    color: tokens.colors.textPrimary,
                  },
                ]}
              >
                {title}
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={closeAccessibilityLabel}
                onPress={onClose}
                hitSlop={8}
                testID={closeButtonTestID}
                style={({ pressed }) => [
                  styles.closeButton,
                  {
                    borderRadius: tokens.radius.radiusFull,
                    backgroundColor: pressed ? tokens.colors.surfaceSecondary : 'transparent',
                  },
                ]}
              >
                <AppIcon name="close" size={20} color={tokens.colors.textSecondary} />
              </Pressable>
            </View>
          ) : null}

          {children}
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    width: '100%',
    maxHeight: '90%',
  },
  handleRow: {
    alignItems: 'center',
    marginBottom: 14,
  },
  handle: {
    width: 36,
    height: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 18,
    lineHeight: 26,
    flex: 1,
  },
  closeButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: -6,
  },
});
