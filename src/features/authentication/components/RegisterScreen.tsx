import React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native';
import { ScreenContainer } from '@/components/layout';
import { AppButton, AppCheckbox, AppIcon, AppInput } from '@/components/ui';
import { useAppTheme } from '@/hooks';
import { registerSchema, type RegisterFormValues } from '../schemas';
import { AuthBackdrop } from './AuthBackdrop';
import { AuthHeader } from './AuthHeader';
import { AuthSocialSection } from './AuthSocialSection';
import { RegisterIllustration } from './LoginIllustration';

export interface RegisterScreenProps {
  onBackPress: () => void;
  onSubmit: (values: RegisterFormValues) => void;
  onGooglePress?: () => void;
  onTermsPress?: () => void;
  onPrivacyPress?: () => void;
  registrationDisabled?: boolean;
}

export function RegisterScreen({
  onBackPress,
  onSubmit,
  onGooglePress,
  onTermsPress,
  onPrivacyPress,
  registrationDisabled = false,
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
    <View style={[styles.root, { backgroundColor: tokens.colors.background }]}>
      <AuthBackdrop />
      <ScreenContainer scrollable style={styles.transparent}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.flex}
        >
          <View style={styles.layout}>
            <View>
              <AuthHeader onBackPress={onBackPress} />

              <View style={styles.heroGroup}>
                <RegisterIllustration testID="register-illustration" />

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
                    Crear tu cuenta
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
                    Es rápido y seguro
                  </Text>
                </View>
              </View>
            </View>

            <View
              style={[
                styles.formGroup,
                {
                  paddingVertical: tokens.spacing.space4,
                  gap: tokens.spacing.space3,
                },
              ]}
            >
              <Controller
                control={control}
                name="fullName"
                render={({ field: { onChange, onBlur, value } }) => (
                  <AppInput
                    variant="soft"
                    leftIcon="user-round"
                    placeholder="Nombre completo"
                    accessibilityLabel="Nombre completo"
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
                    variant="soft"
                    leftIcon="call-outline"
                    placeholder="Celular"
                    accessibilityLabel="Número de celular"
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
                            color: tokens.colors.textSecondary,
                          },
                        ]}
                      >
                        {'Al crear tu cuenta aceptas nuestros '}
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
                        {' y '}
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

            <View
              style={[
                styles.footerGroup,
                {
                  gap: tokens.spacing.space3,
                  paddingBottom: tokens.spacing.space3,
                },
              ]}
            >
              <AppButton
                variant="primary"
                label="Crear cuenta"
                disabled={registrationDisabled}
                onPress={registrationDisabled ? () => {} : handleSubmit(onSubmit)}
                testID="register-submit-button"
                style={{ borderRadius: tokens.radius.radiusFull }}
              />

              <AuthSocialSection
                onGooglePress={onGooglePress}
                googleTestID="register-google-button"
                disabled={registrationDisabled}
              />

              <View style={[styles.securityBadge, { gap: tokens.spacing.space2 }]}>
                <AppIcon
                  name="lock"
                  size={14}
                  color={tokens.colors.primary}
                  testID="register-security-lock-icon"
                />
                <Text
                  style={{
                    fontFamily: tokens.typography.families.medium,
                    fontSize: tokens.typography.scale.caption.fontSize,
                    lineHeight: tokens.typography.scale.caption.lineHeight,
                    color: tokens.colors.textSecondary,
                  }}
                >
                  Tus datos están protegidos.
                </Text>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </ScreenContainer>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  transparent: {
    backgroundColor: 'transparent',
  },
  flex: {
    flex: 1,
  },
  layout: {
    flex: 1,
    justifyContent: 'space-between',
  },
  heroGroup: {
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
  termsText: {
    fontSize: 13,
    lineHeight: 19,
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
});
