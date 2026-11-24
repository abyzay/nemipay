import React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { ScreenContainer } from '@/components/layout';
import { AppButton, AppInput } from '@/components/ui';
import { useAppTheme } from '@/hooks';
import { loginSchema, type LoginFormValues } from '../schemas';
import { AuthHeader } from './AuthHeader';
import { LoginIllustration } from './LoginIllustration';

export interface LoginScreenProps {
  onBackPress: () => void;
  onSubmit: (values: LoginFormValues) => void;
  onForgotPasswordPress?: () => void;
}

export function LoginScreen({ onBackPress, onSubmit, onForgotPasswordPress }: LoginScreenProps) {
  const { tokens } = useAppTheme();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    mode: 'onTouched',
    defaultValues: {
      identifier: '',
      password: '',
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

            <View style={[styles.headingGroup, { marginTop: tokens.spacing.space3 }]}>
              <Text
                style={[
                  styles.title,
                  {
                    fontFamily: tokens.typography.families.bold,
                    color: tokens.colors.textPrimary,
                  },
                ]}
              >
                ¡Qué gusto verte!
              </Text>
              <Text
                style={[
                  styles.subtitle,
                  {
                    fontFamily: tokens.typography.families.regular,
                    color: tokens.colors.textSecondary,
                    marginTop: tokens.spacing.space2,
                  },
                ]}
              >
                Ingresa a tu cuenta NemiPay
              </Text>
            </View>
          </View>

          <View style={[styles.illustrationGroup, { paddingVertical: tokens.spacing.space3 }]}>
            <LoginIllustration testID="login-illustration" />
          </View>

          <View
            style={[
              styles.formGroup,
              { gap: tokens.spacing.space4, paddingBottom: tokens.spacing.space4 },
            ]}
          >
            <Controller
              control={control}
              name="identifier"
              render={({ field: { onChange, onBlur, value } }) => (
                <AppInput
                  label="Usuario, celular o correo"
                  leftIcon="user-round"
                  placeholder="Ej. abyzay o 5512345678"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  textContentType="username"
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
                  label="Contraseña"
                  leftIcon="lock"
                  placeholder="Ingresa tu contraseña"
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

            <Pressable
              accessibilityRole="button"
              onPress={onForgotPasswordPress}
              testID="login-forgot-password-button"
              style={({ pressed }) => [styles.forgotButton, { opacity: pressed ? 0.7 : 1 }]}
            >
              <Text
                style={[
                  styles.forgotText,
                  {
                    fontFamily: tokens.typography.families.semiBold,
                    color: tokens.colors.primary,
                  },
                ]}
              >
                ¿Olvidaste tu contraseña?
              </Text>
            </Pressable>

            <AppButton
              variant="primary"
              label="Iniciar sesión"
              onPress={handleSubmit(onSubmit)}
              testID="login-submit-button"
            />
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
  headingGroup: {
    alignItems: 'center',
  },
  title: {
    fontSize: 30,
    lineHeight: 38,
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
  },
  illustrationGroup: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  formGroup: {
    width: '100%',
  },
  forgotButton: {
    alignSelf: 'center',
    paddingVertical: 4,
    paddingHorizontal: 12,
  },
  forgotText: {
    fontSize: 14,
    lineHeight: 20,
  },
});
