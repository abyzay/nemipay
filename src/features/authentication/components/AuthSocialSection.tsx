import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useAppTheme } from '@/hooks';

export interface AuthSocialSectionProps {
  onGooglePress?: () => void;
  googleTestID?: string;
  disabled?: boolean;
}

function GoogleIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" accessibilityElementsHidden>
      <Path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <Path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <Path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <Path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </Svg>
  );
}

/**
 * Separador y botón social de Google compartido entre Login y Registro.
 */
export function AuthSocialSection({
  onGooglePress,
  googleTestID,
  disabled = false,
}: AuthSocialSectionProps) {
  const { tokens } = useAppTheme();

  return (
    <View style={[styles.container, { gap: tokens.spacing.space3 }]}>
      <View style={[styles.dividerRow, { gap: tokens.spacing.space3 }]}>
        <View style={[styles.line, { backgroundColor: tokens.colors.divider }]} />
        <Text
          style={{
            fontFamily: tokens.typography.families.regular,
            fontSize: tokens.typography.scale.bodySmall.fontSize,
            lineHeight: tokens.typography.scale.bodySmall.lineHeight,
            color: tokens.colors.textSecondary,
          }}
        >
          o continúa con
        </Text>
        <View style={[styles.line, { backgroundColor: tokens.colors.divider }]} />
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Continuar con Google"
        accessibilityState={{ disabled }}
        disabled={disabled}
        onPress={disabled ? undefined : onGooglePress}
        testID={googleTestID}
        style={({ pressed }) => [
          styles.googleButton,
          {
            height: tokens.layout.buttonHeight,
            borderRadius: tokens.radius.radiusFull,
            borderColor: tokens.colors.border,
            backgroundColor: pressed ? tokens.colors.surface : tokens.colors.background,
            opacity: disabled ? 0.5 : 1,
            gap: tokens.spacing.space3,
          },
        ]}
      >
        <GoogleIcon />
        <Text
          style={{
            fontFamily: tokens.typography.families.semiBold,
            fontSize: tokens.typography.scale.button.fontSize,
            lineHeight: tokens.typography.scale.button.lineHeight,
            color: tokens.colors.textPrimary,
          }}
        >
          Google
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  line: {
    flex: 1,
    height: 1,
  },
  googleButton: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
});
