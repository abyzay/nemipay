import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ScreenContainer } from '@/components/layout';
import {
  AppAvatar,
  AppBadge,
  AppBottomSheet,
  AppButton,
  AppCard,
  AppChip,
  AppDivider,
  AppHeader,
  AppIcon,
  AppInput,
  NemiPayLogo,
  type AppIconName,
} from '@/components/ui';
import { fetchMerchantProfile, updateMerchantProfile } from '@/features/authentication/services';
import type { MerchantProfilePatch } from '@/features/authentication/types';
import { paymentKeys } from '@/features/payments/queries/keys';
import { startShiftAnnouncement, stopShiftKeepAwake } from '@/features/payments/services/announce';
import { useAppTheme } from '@/hooks';
import { useUiStore } from '@/stores';

export interface ProfileScreenProps {
  onBackPress?: () => void;
  onLogoutPress: () => void | Promise<void>;
}

type ActiveSheet = 'data' | 'payment' | 'notifications' | 'help' | 'logout' | null;

const BANK_PRESETS: readonly string[] = [
  'BBVA',
  'Santander',
  'Banorte',
  'Citibanamex',
  'Nu',
  'Mercado Pago',
];

function getInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return 'NP';
  if (words.length === 1) return words[0]!.slice(0, 2).toUpperCase();
  return `${words[0]![0]}${words[1]![0]}`.toUpperCase();
}

function maskClabe(clabe: string): string {
  if (clabe.length < 4) return clabe;
  return `•••• ${clabe.slice(-4)}`;
}

interface ProfileMenuRowProps {
  icon: AppIconName;
  label: string;
  valueHint?: string;
  danger?: boolean;
  testID: string;
  onPress: () => void;
}

function ProfileMenuRow({
  icon,
  label,
  valueHint,
  danger = false,
  testID,
  onPress,
}: ProfileMenuRowProps) {
  const { tokens } = useAppTheme();
  const iconColor = danger ? tokens.colors.error : tokens.colors.primary;
  const labelColor = danger ? tokens.colors.error : tokens.colors.textPrimary;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      testID={testID}
      style={({ pressed }) => [
        styles.menuRow,
        {
          backgroundColor: pressed ? tokens.colors.lavenderSoft : 'transparent',
          paddingVertical: tokens.spacing.space4,
          paddingHorizontal: tokens.spacing.space1,
        },
      ]}
    >
      <View style={styles.menuRowLeft}>
        <View style={styles.menuIconWrap}>
          <AppIcon name={icon} size={22} strokeWidth={1.9} color={iconColor} />
        </View>
        <Text
          style={[
            styles.menuRowLabel,
            {
              fontFamily: tokens.typography.families.semiBold,
              color: labelColor,
            },
          ]}
        >
          {label}
        </Text>
      </View>

      <View style={styles.menuRowRight}>
        {valueHint ? (
          <Text
            numberOfLines={1}
            style={[
              styles.menuValueHint,
              {
                fontFamily: tokens.typography.families.medium,
                color: tokens.colors.textSecondary,
              },
            ]}
          >
            {valueHint}
          </Text>
        ) : null}
        <AppIcon
          name="chevron-right"
          size={18}
          color={danger ? tokens.colors.primary : tokens.colors.primary}
        />
      </View>
    </Pressable>
  );
}

export function ProfileScreen({ onBackPress, onLogoutPress }: ProfileScreenProps) {
  const { tokens } = useAppTheme();
  const queryClient = useQueryClient();
  const authenticatedUser = useUiStore((state) => state.authenticatedUser);
  const setAuthenticatedUser = useUiStore((state) => state.setAuthenticatedUser);
  const shiftActive = useUiStore((state) => state.shiftActive);
  const setShiftActive = useUiStore((state) => state.setShiftActive);

  const userId = authenticatedUser?.id ?? '';

  const merchantQuery = useQuery({
    queryKey: paymentKeys.merchant(userId),
    queryFn: () => fetchMerchantProfile(userId),
    enabled: Boolean(userId),
  });

  const updateProfileMutation = useMutation({
    retry: false,
    mutationFn: (patch: MerchantProfilePatch) => {
      if (!userId) {
        return Promise.reject(new Error('Sesión requerida.'));
      }
      return updateMerchantProfile(userId, patch);
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(paymentKeys.merchant(userId), updated);
      if (authenticatedUser) {
        setAuthenticatedUser({
          ...authenticatedUser,
          displayName: updated.name,
        });
      }
    },
  });

  const [activeSheet, setActiveSheet] = useState<ActiveSheet>(null);
  const [sheetError, setSheetError] = useState<string | null>(null);

  // Campos de "Mis datos"
  const [businessNameInput, setBusinessNameInput] = useState('');
  const [ownerNameInput, setOwnerNameInput] = useState('');
  const [phoneInput, setPhoneInput] = useState('');

  // Campos de "Métodos de pago (CLABE)"
  const [clabeInput, setClabeInput] = useState('');
  const [bankNameInput, setBankNameInput] = useState('');

  const merchant = merchantQuery.data;
  const merchantName = merchant?.name ?? authenticatedUser?.displayName ?? 'Mi Negocio';
  const ownerName = merchant?.ownerName?.trim() || null;
  const phone = merchant?.phone?.trim() || null;
  const clabe = merchant?.clabe?.trim() || null;
  const bankName = merchant?.bankName?.trim() || null;
  const email = authenticatedUser?.email ?? '';
  const notificationsEnabled = merchant?.notificationsEnabled ?? true;
  const voiceAnnouncementsEnabled = merchant?.voiceAnnouncementsEnabled ?? true;

  const displayTitle = ownerName ?? merchantName;
  const displaySubtitle = phone ?? email;

  const openDataSheet = () => {
    setSheetError(null);
    setBusinessNameInput(merchantName);
    setOwnerNameInput(ownerName ?? '');
    setPhoneInput(phone ?? '');
    setActiveSheet('data');
  };

  const openPaymentSheet = () => {
    setSheetError(null);
    setClabeInput(clabe ?? '');
    setBankNameInput(bankName ?? '');
    setActiveSheet('payment');
  };

  const openNotificationsSheet = () => {
    setSheetError(null);
    setActiveSheet('notifications');
  };

  const handleSaveData = async () => {
    const trimmedBusiness = businessNameInput.trim();
    if (trimmedBusiness.length < 1 || trimmedBusiness.length > 60) {
      setSheetError('Ingresa el nombre del negocio (1 a 60 caracteres).');
      return;
    }

    const trimmedOwner = ownerNameInput.trim();
    if (trimmedOwner.length > 60) {
      setSheetError('El nombre del titular debe tener máximo 60 caracteres.');
      return;
    }

    const trimmedPhone = phoneInput.trim();
    if (trimmedPhone.length > 0 && (trimmedPhone.length < 8 || trimmedPhone.length > 20)) {
      setSheetError('Ingresa un número de teléfono válido (8 a 20 caracteres).');
      return;
    }

    setSheetError(null);
    try {
      await updateProfileMutation.mutateAsync({
        name: trimmedBusiness,
        ownerName: trimmedOwner || null,
        phone: trimmedPhone || null,
      });
      setActiveSheet(null);
    } catch (error) {
      setSheetError(error instanceof Error ? error.message : 'No pudimos guardar tus datos.');
    }
  };

  const handleClabeChange = (text: string) => {
    setClabeInput(text.replace(/\D/g, '').slice(0, 18));
  };

  const handleSaveClabe = async () => {
    const digits = clabeInput.replace(/\D/g, '');
    if (digits.length !== 18) {
      setSheetError('La cuenta CLABE debe tener exactamente 18 dígitos.');
      return;
    }

    const trimmedBank = bankNameInput.trim();
    if (trimmedBank.length > 40) {
      setSheetError('El nombre del banco debe tener máximo 40 caracteres.');
      return;
    }

    setSheetError(null);
    try {
      await updateProfileMutation.mutateAsync({
        clabe: digits,
        bankName: trimmedBank || null,
      });
      setActiveSheet(null);
    } catch (error) {
      setSheetError(error instanceof Error ? error.message : 'No pudimos guardar tu cuenta CLABE.');
    }
  };

  const handleToggleNotificationPref = async (
    key: 'notificationsEnabled' | 'voiceAnnouncementsEnabled',
    value: boolean
  ) => {
    setSheetError(null);
    try {
      await updateProfileMutation.mutateAsync({ [key]: value });
    } catch (error) {
      setSheetError(
        error instanceof Error ? error.message : 'No pudimos actualizar tus preferencias.'
      );
    }
  };

  const handleToggleShift = async () => {
    if (shiftActive) {
      stopShiftKeepAwake();
      setShiftActive(false);
    } else {
      await startShiftAnnouncement();
      setShiftActive(true);
    }
  };

  return (
    <ScreenContainer edges={['top']} scrollable backdropTestID="profile-backdrop">
      <View style={styles.root}>
        <AppHeader
          title="Mi perfil"
          onBackPress={onBackPress}
          backTestID="profile-back-button"
          testID="profile-header"
          rightSlot={
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Configuración y notificaciones"
              onPress={openNotificationsSheet}
              testID="profile-settings-button"
              style={({ pressed }) => [
                styles.settingsBtn,
                {
                  borderRadius: tokens.radius.radiusFull,
                  backgroundColor: pressed ? tokens.colors.lavenderSoft : 'transparent',
                },
              ]}
            >
              <AppIcon name="settings" size={22} color={tokens.colors.primary} />
            </Pressable>
          }
        />

        <View style={[styles.heroSection, { marginTop: tokens.spacing.space4 }]}>
          <View
            style={[
              styles.avatarRing,
              {
                borderColor: tokens.colors.lavenderBorder,
                borderRadius: tokens.radius.radiusFull,
              },
            ]}
          >
            <AppAvatar initials={getInitials(displayTitle)} size={84} testID="profile-avatar" />
          </View>

          <Text
            testID="profile-merchant-name"
            style={[
              styles.displayTitle,
              {
                fontFamily: tokens.typography.families.bold,
                color: tokens.colors.textPrimary,
                marginTop: tokens.spacing.space3,
              },
            ]}
          >
            {displayTitle}
          </Text>

          {ownerName && ownerName.toLowerCase() !== merchantName.toLowerCase() ? (
            <Text
              testID="profile-business-subtitle"
              style={[
                styles.businessTag,
                {
                  fontFamily: tokens.typography.families.semiBold,
                  color: tokens.colors.primary,
                },
              ]}
            >
              {merchantName}
            </Text>
          ) : null}

          {displaySubtitle ? (
            <Text
              testID="profile-contact-subtitle"
              style={[
                styles.subtitleText,
                {
                  fontFamily: tokens.typography.families.medium,
                  color: tokens.colors.textSecondary,
                },
              ]}
            >
              {displaySubtitle}
            </Text>
          ) : null}

          {shiftActive ? (
            <View style={{ marginTop: tokens.spacing.space2 }}>
              <AppBadge
                label="Turno activo (pantalla y voz)"
                variant="success"
                icon="volume-2"
                testID="profile-shift-badge"
              />
            </View>
          ) : null}
        </View>

        <View style={[styles.menuList, { marginTop: tokens.spacing.space6 }]}>
          <ProfileMenuRow
            icon="user-round"
            label="Mis datos"
            valueHint={ownerName || phone ? undefined : 'Completar'}
            testID="profile-menu-data"
            onPress={openDataSheet}
          />
          <AppDivider />

          <ProfileMenuRow
            icon="credit-card"
            label="Métodos de pago"
            valueHint={clabe ? `CLABE ${maskClabe(clabe)}` : 'Agregar CLABE'}
            testID="profile-menu-payment"
            onPress={openPaymentSheet}
          />
          <AppDivider />

          <ProfileMenuRow
            icon="bell"
            label="Notificaciones"
            valueHint={shiftActive ? 'Turno activo' : notificationsEnabled ? 'Activas' : 'Pausadas'}
            testID="profile-menu-notifications"
            onPress={openNotificationsSheet}
          />
          <AppDivider />

          <ProfileMenuRow
            icon="circle-help"
            label="Ayuda"
            testID="profile-menu-help"
            onPress={() => {
              setSheetError(null);
              setActiveSheet('help');
            }}
          />
          <AppDivider />

          <ProfileMenuRow
            icon="trash-2"
            label="Cerrar sesión"
            danger
            testID="profile-logout-button"
            onPress={() => {
              setSheetError(null);
              setActiveSheet('logout');
            }}
          />
        </View>

        <View style={[styles.footerBrand, { paddingVertical: tokens.spacing.space6 }]}>
          <NemiPayLogo size="sm" testID="profile-footer-logo" />
        </View>
      </View>

      {/* Hoja: Mis datos */}
      <AppBottomSheet
        visible={activeSheet === 'data'}
        onClose={() => setActiveSheet(null)}
        title="Mis datos"
        closeButtonTestID="profile-data-close-button"
        testID="profile-data-modal"
      >
        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <View style={{ gap: tokens.spacing.space4 }}>
            <AppInput
              label="Nombre del negocio"
              leftIcon="store"
              value={businessNameInput}
              onChangeText={setBusinessNameInput}
              maxLength={60}
              placeholder="Ej. Tacos Nemi"
              testID="profile-data-business-input"
            />

            <AppInput
              label="Nombre del titular"
              leftIcon="user-round"
              value={ownerNameInput}
              onChangeText={setOwnerNameInput}
              maxLength={60}
              placeholder="Ej. María López"
              testID="profile-data-owner-input"
            />

            <AppInput
              label="Teléfono / Celular"
              leftIcon="call-outline"
              value={phoneInput}
              onChangeText={setPhoneInput}
              keyboardType="phone-pad"
              maxLength={20}
              placeholder="Ej. +52 55 1234 5678"
              testID="profile-data-phone-input"
            />

            <AppInput
              label="Correo electrónico"
              leftIcon="mail-outline"
              value={email}
              disabled
              helperText="Correo verificado de tu cuenta NemiPay"
              testID="profile-data-email-input"
            />
          </View>

          {sheetError ? (
            <Text
              testID="profile-sheet-error"
              style={[
                styles.sheetError,
                {
                  fontFamily: tokens.typography.families.medium,
                  color: tokens.colors.error,
                },
              ]}
            >
              {sheetError}
            </Text>
          ) : null}

          <View style={{ marginTop: tokens.spacing.space5, paddingBottom: tokens.spacing.space2 }}>
            <AppButton
              variant="primary"
              label={updateProfileMutation.isPending ? 'Guardando…' : 'Guardar cambios'}
              loading={updateProfileMutation.isPending}
              disabled={updateProfileMutation.isPending}
              onPress={() => void handleSaveData()}
              testID="profile-data-save-button"
            />
          </View>
        </ScrollView>
      </AppBottomSheet>

      {/* Hoja: Métodos de pago (Cuenta CLABE) */}
      <AppBottomSheet
        visible={activeSheet === 'payment'}
        onClose={() => setActiveSheet(null)}
        title="Cuenta CLABE"
        closeButtonTestID="profile-payment-close-button"
        testID="profile-payment-method-modal"
      >
        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <View style={{ gap: tokens.spacing.space4 }}>
            <Text
              style={[
                styles.sheetHint,
                {
                  fontFamily: tokens.typography.families.regular,
                  color: tokens.colors.textSecondary,
                },
              ]}
            >
              Registra la cuenta CLABE interbancaria de 18 dígitos donde deseas recibir tus
              depósitos.
            </Text>

            <AppInput
              label="Cuenta CLABE (18 dígitos)"
              leftIcon="banknote"
              value={clabeInput}
              onChangeText={handleClabeChange}
              keyboardType="number-pad"
              maxLength={18}
              placeholder="000000000000000000"
              helperText={`${clabeInput.length}/18 dígitos`}
              testID="profile-clabe-input"
            />

            <View style={{ gap: tokens.spacing.space2 }}>
              <AppInput
                label="Banco o institución (opcional)"
                leftIcon="business-outline"
                value={bankNameInput}
                onChangeText={setBankNameInput}
                maxLength={40}
                placeholder="Ej. BBVA, Nu, Santander"
                testID="profile-bank-input"
              />
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: tokens.spacing.space2 }}
              >
                {BANK_PRESETS.map((bank) => (
                  <AppChip
                    key={bank}
                    label={bank}
                    selected={bankNameInput.trim().toLowerCase() === bank.toLowerCase()}
                    onPress={() => setBankNameInput(bank)}
                    testID={`profile-bank-chip-${bank}`}
                  />
                ))}
              </ScrollView>
            </View>
          </View>

          {sheetError ? (
            <Text
              testID="profile-sheet-error"
              style={[
                styles.sheetError,
                {
                  fontFamily: tokens.typography.families.medium,
                  color: tokens.colors.error,
                },
              ]}
            >
              {sheetError}
            </Text>
          ) : null}

          <View style={{ marginTop: tokens.spacing.space5, paddingBottom: tokens.spacing.space2 }}>
            <AppButton
              variant="primary"
              label={updateProfileMutation.isPending ? 'Guardando…' : 'Guardar cuenta CLABE'}
              loading={updateProfileMutation.isPending}
              disabled={updateProfileMutation.isPending}
              onPress={() => void handleSaveClabe()}
              testID="profile-clabe-save-button"
            />
          </View>
        </ScrollView>
      </AppBottomSheet>

      {/* Hoja: Notificaciones y turno */}
      <AppBottomSheet
        visible={activeSheet === 'notifications'}
        onClose={() => setActiveSheet(null)}
        title="Notificaciones"
        closeButtonTestID="profile-notifications-close-button"
        testID="profile-notifications-modal"
      >
        <View style={{ gap: tokens.spacing.space4 }}>
          <AppCard variant="secondary" padding="md" style={{ gap: tokens.spacing.space3 }}>
            <View style={styles.switchRow}>
              <View style={styles.switchTextCol}>
                <Text
                  style={[
                    styles.switchTitle,
                    {
                      fontFamily: tokens.typography.families.semiBold,
                      color: tokens.colors.textPrimary,
                    },
                  ]}
                >
                  Alertas de cobros recibidos
                </Text>
                <Text
                  style={[
                    styles.switchSub,
                    {
                      fontFamily: tokens.typography.families.regular,
                      color: tokens.colors.textSecondary,
                    },
                  ]}
                >
                  Aviso inmediato al confirmarse un pago CoDi
                </Text>
              </View>
              <Switch
                value={notificationsEnabled}
                onValueChange={(next) =>
                  void handleToggleNotificationPref('notificationsEnabled', next)
                }
                trackColor={{ false: tokens.colors.gray[300], true: tokens.colors.primary }}
                thumbColor={tokens.colors.background}
                testID="profile-notifications-switch"
              />
            </View>

            <AppDivider />

            <View style={styles.switchRow}>
              <View style={styles.switchTextCol}>
                <Text
                  style={[
                    styles.switchTitle,
                    {
                      fontFamily: tokens.typography.families.semiBold,
                      color: tokens.colors.textPrimary,
                    },
                  ]}
                >
                  Anuncio por voz del monto
                </Text>
                <Text
                  style={[
                    styles.switchSub,
                    {
                      fontFamily: tokens.typography.families.regular,
                      color: tokens.colors.textSecondary,
                    },
                  ]}
                >
                  Lee en voz alta cada pago confirmado
                </Text>
              </View>
              <Switch
                value={voiceAnnouncementsEnabled}
                onValueChange={(next) =>
                  void handleToggleNotificationPref('voiceAnnouncementsEnabled', next)
                }
                trackColor={{ false: tokens.colors.gray[300], true: tokens.colors.primary }}
                thumbColor={tokens.colors.background}
                testID="profile-voice-switch"
              />
            </View>
          </AppCard>

          <AppButton
            variant={shiftActive ? 'outlined' : 'primary'}
            leftIcon="volume-2"
            label={
              shiftActive ? 'Terminar turno (voz y pantalla)' : 'Iniciar turno (voz y pantalla)'
            }
            onPress={() => void handleToggleShift()}
            testID="profile-shift-toggle-button"
          />

          {sheetError ? (
            <Text
              testID="profile-sheet-error"
              style={[
                styles.sheetError,
                {
                  fontFamily: tokens.typography.families.medium,
                  color: tokens.colors.error,
                },
              ]}
            >
              {sheetError}
            </Text>
          ) : null}
        </View>
      </AppBottomSheet>

      {/* Hoja: Ayuda */}
      <AppBottomSheet
        visible={activeSheet === 'help'}
        onClose={() => setActiveSheet(null)}
        title="Ayuda"
        closeButtonTestID="profile-help-close-button"
        testID="profile-help-modal"
      >
        <View style={{ gap: tokens.spacing.space3 }}>
          <AppCard variant="secondary" padding="md" style={{ gap: tokens.spacing.space2 }}>
            <Text
              style={[
                styles.helpItemTitle,
                {
                  fontFamily: tokens.typography.families.semiBold,
                  color: tokens.colors.textPrimary,
                },
              ]}
            >
              Cobros con CoDi (QR y POS)
            </Text>
            <Text
              style={[
                styles.helpItemText,
                {
                  fontFamily: tokens.typography.families.regular,
                  color: tokens.colors.textSecondary,
                },
              ]}
            >
              Tu cliente escanea el QR desde la app de su banco y el pago se confirma al instante en
              Movimientos.
            </Text>
          </AppCard>

          <AppCard variant="secondary" padding="md" style={{ gap: tokens.spacing.space2 }}>
            <Text
              style={[
                styles.helpItemTitle,
                {
                  fontFamily: tokens.typography.families.semiBold,
                  color: tokens.colors.textPrimary,
                },
              ]}
            >
              Cuenta CLABE de liquidación
            </Text>
            <Text
              style={[
                styles.helpItemText,
                {
                  fontFamily: tokens.typography.families.regular,
                  color: tokens.colors.textSecondary,
                },
              ]}
            >
              Asegúrate de ingresar los 18 dígitos de tu cuenta CLABE en Métodos de pago.
            </Text>
          </AppCard>

          <AppButton
            variant="primary"
            label="Entendido"
            onPress={() => setActiveSheet(null)}
            testID="profile-help-ok-button"
          />
        </View>
      </AppBottomSheet>

      {/* Hoja: Confirmar cerrar sesión */}
      <AppBottomSheet
        visible={activeSheet === 'logout'}
        onClose={() => setActiveSheet(null)}
        title="Cerrar sesión"
        closeButtonTestID="profile-logout-close-button"
        testID="profile-logout-modal"
      >
        <View style={{ gap: tokens.spacing.space4 }}>
          <Text
            style={[
              styles.sheetHint,
              {
                fontFamily: tokens.typography.families.regular,
                color: tokens.colors.textSecondary,
              },
            ]}
          >
            ¿Deseas cerrar tu sesión en este dispositivo? Podrás volver a entrar cuando quieras.
          </Text>

          <View style={{ gap: tokens.spacing.space2 + 2 }}>
            <AppButton
              variant="destructive"
              label="Sí, cerrar sesión"
              onPress={() => {
                setActiveSheet(null);
                void onLogoutPress();
              }}
              testID="profile-logout-confirm-button"
            />
            <AppButton
              variant="outlined"
              label="Cancelar"
              onPress={() => setActiveSheet(null)}
              testID="profile-logout-cancel-button"
            />
          </View>
        </View>
      </AppBottomSheet>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'space-between',
  },
  settingsBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroSection: {
    alignItems: 'center',
  },
  avatarRing: {
    padding: 4,
    borderWidth: 2,
  },
  displayTitle: {
    fontSize: 22,
    lineHeight: 28,
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  businessTag: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 2,
    textAlign: 'center',
  },
  subtitleText: {
    fontSize: 15,
    lineHeight: 20,
    marginTop: 2,
    textAlign: 'center',
  },
  menuList: {
    width: '100%',
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  menuRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
  },
  menuIconWrap: {
    width: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuRowLabel: {
    fontSize: 16,
    lineHeight: 22,
  },
  menuRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    maxWidth: '45%',
  },
  menuValueHint: {
    fontSize: 13,
    lineHeight: 18,
  },
  footerBrand: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetHint: {
    fontSize: 14,
    lineHeight: 20,
  },
  sheetError: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 12,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  switchTextCol: {
    flex: 1,
    gap: 2,
  },
  switchTitle: {
    fontSize: 15,
    lineHeight: 20,
  },
  switchSub: {
    fontSize: 12,
    lineHeight: 17,
  },
  helpItemTitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  helpItemText: {
    fontSize: 13,
    lineHeight: 18,
  },
});
