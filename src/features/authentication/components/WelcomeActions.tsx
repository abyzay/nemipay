import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AppButton } from '@/components/ui';
import { useAppTheme } from '@/hooks';

export interface WelcomeActionsProps {
  onLoginPress: () => void;
  onCreateAccountPress: () => void;
  onTermsPress?: () => void;
  onPrivacyPress?: () => void;
}

export function WelcomeActions({
  onLoginPress,
  onCreateAccountPress,
  onTermsPress,
  onPrivacyPress,
}: WelcomeActionsProps) {
  const { tokens } = useAppTheme();

  return (
    <View
      style={[
        styles.container,
        {
          paddingBottom: tokens.spacing.xs,
          gap: tokens.spacing.xs + 2,
        },
      ]}
    >
      <AppButton
        variant="primary"
        label="Iniciar sesión"
        onPress={onLoginPress}
        testID="welcome-login-button"
      />

      <AppButton
        variant="outlined"
        label="Crear cuenta"
        onPress={onCreateAccountPress}
        testID="welcome-register-button"
      />

      <Text
        style={[
          styles.legalText,
          {
            fontFamily: tokens.typography.families.regular,
            color: tokens.colors.textSecondary,
            marginTop: tokens.spacing.xxs,
          },
        ]}
      >
        {'Al continuar, aceptas nuestros\n'}
        <Text
          accessibilityRole="link"
          onPress={onTermsPress}
          style={{
            fontFamily: tokens.typography.families.medium,
            color: tokens.colors.textPrimary,
          }}
        >
          Términos
        </Text>
        {' y '}
        <Text
          accessibilityRole="link"
          onPress={onPrivacyPress}
          style={{
            fontFamily: tokens.typography.families.medium,
            color: tokens.colors.textPrimary,
          }}
        >
          Aviso de privacidad.
        </Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  legalText: {
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
  },
});
