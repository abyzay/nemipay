import React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { ScreenContainer } from '@/components/layout';
import { AppButton, AppInput, NemiPayLogo } from '@/components/ui';
import { useAppTheme } from '@/hooks';
import { loginSchema, type LoginFormValues } from '../schemas';
import { AuthHeader } from './AuthHeader';
import { AuthSocialSection } from './AuthSocialSection';
import { LoginIllustration } from './LoginIllustration';

export interface LoginScreenProps {
  onBackPress: () => void;
  onSubmit: (values: LoginFormValues) => void | Promise<void>;
  isSubmitting?: boolean;
  defaultIdentifier?: string;
  defaultPassword?: string;
  onForgotPasswordPress?: () => void;
  onGooglePress?: () => void;
  onRegisterPress?: () => void;
}

export function LoginScreen({
  onBackPress,
  onSubmit,
  isSubmitting = false,
  defaultIdentifier = '',
  defaultPassword = '',
  onForgotPasswordPress,
  onGooglePress,
  onRegisterPress,
}: LoginScreenProps) {
  const { tokens } = useAppTheme();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    mode: 'onTouched',
    defaultValues: {
      identifier: defaultIdentifier,
      password: defaultPassword,
    },
  });

  return (
    <ScreenContainer scrollable>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <View style={styles.layout}>
          <View>
            <AuthHeader onBackPress={onBackPress} />

            <View style={[styles.brandGroup, { gap: tokens.spacing.space2 }]}>
              <NemiPayLogo size="lg" layout="vertical" testID="auth-logo" />
              <LoginIllustration testID="login-illustration" />
            </View>

            <View style={[styles.headingGroup, { marginTop: tokens.spacing.space2 }]}>
              <Text
                style={[
                  styles.title,
                  {
                    fontFamily: tokens.typography.families.bold,
                    fontSize: 26,
                    lineHeight: 34,
                    color: tokens.colors.textPrimary,
                  },
                ]}
              >
                Inicia sesión
              </Text>
              <Text
                style={[
                  styles.subtitle,
                  {
                    fontFamily: tokens.typography.families.regular,
                    fontSize: tokens.typography.scale.body.fontSize,
                    lineHeight: tokens.typography.scale.body.lineHeight,
                    color: tokens.colors.textSecondary,
                    marginTop: tokens.spacing.space1,
                  },
                ]}
              >
                Bienvenido de nuevo
              </Text>
            </View>
          </View>

          <View
            style={[
              styles.formGroup,
              {
                gap: tokens.spacing.space3,
                paddingTop: tokens.spacing.space5,
                paddingBottom: tokens.spacing.space3,
              },
            ]}
          >
            <Controller
              control={control}
              name="identifier"
              render={({ field: { onChange, onBlur, value } }) => (
                <AppInput
                  variant="soft"
                  leftIcon="mail-outline"
                  placeholder="Correo electrónico"
                  accessibilityLabel="Correo electrónico"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  textContentType="emailAddress"
                  returnKeyType="next"
                  error={errors.identifier?.message}
                  testID="login-identifier-input"
                  errorTestID="login-identifier-error"
                />
              )}
            />

            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, onBlur, value } }) => (
                <AppInput
                  variant="soft"
                  leftIcon="lock"
                  placeholder="Contraseña"
                  accessibilityLabel="Contraseña"
                  isPassword
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  autoCapitalize="none"
                  autoCorrect={false}
                  textContentType="password"
                  returnKeyType="done"
                  onSubmitEditing={() => void handleSubmit(onSubmit)()}
                  error={errors.password?.message}
                  testID="login-password-input"
                  errorTestID="login-password-error"
                />
              )}
            />

            <View style={{ marginTop: tokens.spacing.space1 }}>
              <AppButton
                variant="primary"
                label={isSubmitting ? 'Entrando…' : 'Entrar'}
                loading={isSubmitting}
                disabled={isSubmitting}
                onPress={handleSubmit(onSubmit)}
                testID="login-submit-button"
                style={{ borderRadius: tokens.radius.radiusFull }}
              />
            </View>

            <Pressable
              accessibilityRole="button"
              onPress={onForgotPasswordPress}
              testID="login-forgot-password-button"
              style={({ pressed }) => [styles.forgotButton, { opacity: pressed ? 0.7 : 1 }]}
            >
              <Text
                style={{
                  fontFamily: tokens.typography.families.medium,
                  fontSize: tokens.typography.scale.bodySmall.fontSize,
                  lineHeight: tokens.typography.scale.bodySmall.lineHeight,
                  color: tokens.colors.textSecondary,
                }}
              >
                ¿Olvidaste tu contraseña?
              </Text>
            </Pressable>

            <AuthSocialSection onGooglePress={onGooglePress} googleTestID="login-google-button" />
          </View>

          <View style={[styles.footerRow, { paddingBottom: tokens.spacing.space3 }]}>
            <Text
              style={{
                fontFamily: tokens.typography.families.regular,
                fontSize: tokens.typography.scale.bodySmall.fontSize,
                lineHeight: tokens.typography.scale.bodySmall.lineHeight,
                color: tokens.colors.textSecondary,
              }}
            >
              {'¿No tienes cuenta? '}
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={onRegisterPress}
              testID="login-register-link"
              hitSlop={8}
              style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
            >
              <Text
                style={{
                  fontFamily: tokens.typography.families.semiBold,
                  fontSize: tokens.typography.scale.bodySmall.fontSize,
                  lineHeight: tokens.typography.scale.bodySmall.lineHeight,
                  color: tokens.colors.primary,
                }}
              >
                Regístrate
              </Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  layout: {
    flex: 1,
    justifyContent: 'space-between',
  },
  brandGroup: {
    alignItems: 'center',
  },
  headingGroup: {
    alignItems: 'center',
  },
  title: {
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
  },
  formGroup: {
    width: '100%',
  },
  forgotButton: {
    alignSelf: 'center',
    paddingVertical: 4,
    paddingHorizontal: 12,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
