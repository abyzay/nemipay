import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AppButton } from '@/components/ui';
import { useAppTheme } from '@/hooks';

export interface WelcomeActionsProps {
  onLoginPress: () => void;
  onCreateAccountPress: () => void;
  onTermsPress?: () => void;
  onPrivacyPress?: () => void;
}

export function WelcomeActions({ onLoginPress, onCreateAccountPress }: WelcomeActionsProps) {
  const { tokens } = useAppTheme();

  return (
    <View
      style={[
        styles.container,
        {
          paddingHorizontal: tokens.layout.screenHorizontalPadding,
          paddingBottom: tokens.spacing.space4,
          gap: tokens.spacing.space2,
        },
      ]}
    >
      <AppButton
        variant="primary"
        label="Comenzar"
        onPress={onCreateAccountPress}
        testID="welcome-register-button"
        style={{ borderRadius: tokens.radius.radiusFull }}
      />

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Iniciar sesión"
        onPress={onLoginPress}
        testID="welcome-login-button"
        style={({ pressed }) => [
          styles.loginButton,
          {
            minHeight: tokens.layout.minTouchTarget,
            borderRadius: tokens.radius.radiusFull,
            backgroundColor: pressed ? tokens.colors.lavenderSoft : 'transparent',
          },
        ]}
      >
        <Text
          style={{
            fontFamily: tokens.typography.families.semiBold,
            fontSize: tokens.typography.scale.button.fontSize,
            lineHeight: tokens.typography.scale.button.lineHeight,
            color: tokens.colors.primary,
          }}
        >
          Iniciar sesión
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  loginButton: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
