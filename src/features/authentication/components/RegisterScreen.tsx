import React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native';
import { ScreenContainer } from '@/components/layout';
import { AppButton, AppCheckbox, AppIcon, AppInput } from '@/components/ui';
import { useAppTheme } from '@/hooks';
import { registerSchema, type RegisterFormValues } from '../schemas';
import { AuthHeader } from './AuthHeader';

export interface RegisterScreenProps {
  onBackPress: () => void;
  onSubmit: (values: RegisterFormValues) => void;
  onTermsPress?: () => void;
  onPrivacyPress?: () => void;
}

export function RegisterScreen({
  onBackPress,
  onSubmit,
  onTermsPress,
  onPrivacyPress,
}: RegisterScreenProps) {
  const { tokens } = useAppTheme();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    mode: 'onTouched',
    defaultValues: {
      fullName: '',
      phone: '',
      email: '',
      password: '',
      acceptTerms: false,
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

            <View style={[styles.headingGroup, { marginTop: tokens.spacing.space5 }]}>
              <Text
                style={[
                  styles.title,
                  {
                    fontFamily: tokens.typography.families.bold,
                    color: tokens.colors.textPrimary,
                  },
                ]}
              >
                Crea tu cuenta
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
                Comienza a cobrar y pagar con QR
              </Text>
            </View>
          </View>

          <View
            style={[
              styles.formGroup,
              {
                paddingVertical: tokens.spacing.space6,
                gap: tokens.spacing.space4,
              },
            ]}
          >
            <Controller
              control={control}
              name="fullName"
              render={({ field: { onChange, onBlur, value } }) => (
                <AppInput
                  label="Nombre completo"
                  leftIcon="user-round"
                  placeholder="Ej. Sofía López"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  autoCapitalize="words"
                  autoCorrect={false}
                  textContentType="name"
                  returnKeyType="next"
                  error={errors.fullName?.message}
                  testID="register-fullname-input"
                  errorTestID="register-fullname-error"
                />
              )}
            />

            <Controller
              control={control}
              name="phone"
              render={({ field: { onChange, onBlur, value } }) => (
                <AppInput
                  label="Número de celular"
                  leftIcon="call-outline"
                  placeholder="10 dígitos"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  keyboardType="phone-pad"
                  maxLength={14}
                  textContentType="telephoneNumber"
                  returnKeyType="next"
                  error={errors.phone?.message}
                  testID="register-phone-input"
                  errorTestID="register-phone-error"
                />
              )}
            />

            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <AppInput
                  label="Correo electrónico"
                  leftIcon="mail-outline"
                  placeholder="correo@negocio.mx"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  textContentType="emailAddress"
                  returnKeyType="next"
                  error={errors.email?.message}
                  testID="register-email-input"
                  errorTestID="register-email-error"
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
                  placeholder="Mínimo 8 caracteres"
                  isPassword
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  autoCapitalize="none"
                  autoCorrect={false}
                  textContentType="newPassword"
                  returnKeyType="done"
                  error={errors.password?.message}
                  testID="register-password-input"
                  errorTestID="register-password-error"
                />
              )}
            />

            <View style={{ marginTop: tokens.spacing.space1 }}>
              <Controller
                control={control}
                name="acceptTerms"
                render={({ field: { onChange, value } }) => (
                  <AppCheckbox
                    checked={value}
                    onToggle={onChange}
                    accessibilityLabel="Acepto los Términos y el Aviso de privacidad"
                    error={errors.acceptTerms?.message}
                    testID="register-terms-checkbox"
                    errorTestID="register-terms-error"
                  >
                    <Text
                      style={[
                        styles.termsText,
                        {
                          fontFamily: tokens.typography.families.regular,
                          color: tokens.colors.textPrimary,
                        },
                      ]}
                    >
                      {'Acepto los '}
                      <Text
                        accessibilityRole="link"
                        onPress={onTermsPress}
                        style={{
                          fontFamily: tokens.typography.families.semiBold,
                          color: tokens.colors.primary,
                        }}
                      >
                        Términos
                      </Text>
                      {' y el\n'}
                      <Text
                        accessibilityRole="link"
                        onPress={onPrivacyPress}
                        style={{
                          fontFamily: tokens.typography.families.semiBold,
                          color: tokens.colors.primary,
                        }}
                      >
                        Aviso de privacidad.
                      </Text>
                    </Text>
                  </AppCheckbox>
                )}
              />
            </View>
          </View>

          <View style={[styles.footerGroup, { paddingBottom: tokens.spacing.space4 }]}>
            <AppButton
              variant="primary"
              label="Crear cuenta"
              onPress={handleSubmit(onSubmit)}
              testID="register-submit-button"
            />

            <View
              style={[
                styles.securityBadge,
                { marginTop: tokens.spacing.space4, gap: tokens.spacing.space2 },
              ]}
            >
              <AppIcon
                name="lock"
                size={16}
                color={tokens.colors.primary}
                testID="register-security-lock-icon"
              />
              <Text
                style={[
                  styles.securityText,
                  {
                    fontFamily: tokens.typography.families.medium,
                    color: tokens.colors.textSecondary,
                  },
                ]}
              >
                Tus datos están protegidos.
              </Text>
            </View>
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
  formGroup: {
    width: '100%',
  },
  termsText: {
    fontSize: 14,
    lineHeight: 20,
  },
  footerGroup: {
    width: '100%',
    alignItems: 'center',
  },
  securityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  securityText: {
    fontSize: 13,
    lineHeight: 18,
  },
});
