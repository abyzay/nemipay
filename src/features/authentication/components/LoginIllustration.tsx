import React from 'react';
import {
  Image,
  StyleSheet,
  View,
  useWindowDimensions,
  type ImageSourcePropType,
} from 'react-native';
import { APP_ASSETS } from '@/constants/assets';

export interface AuthIllustrationProps {
  source: ImageSourcePropType;
  accessibilityLabel: string;
  heightRatio?: number;
  minHeight?: number;
  maxHeight?: number;
  testID?: string;
}

/**
 * Contenedor responsivo para ilustraciones 3D cuadradas (1:1) de autenticación.
 */
export function AuthIllustration({
  source,
  accessibilityLabel,
  heightRatio = 0.14,
  minHeight = 96,
  maxHeight = 132,
  testID,
}: AuthIllustrationProps) {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const maxByHeight = Math.round(
    Math.min(Math.max(windowHeight * heightRatio, minHeight), maxHeight)
  );
  const maxByWidth = Math.round(windowWidth - 80);
  const size = Math.min(maxByHeight, maxByWidth);

  return (
    <View style={styles.container}>
      <Image
        source={source}
        resizeMode="contain"
        accessible
        accessibilityRole="image"
        accessibilityLabel={accessibilityLabel}
        testID={testID}
        style={{ width: size, height: size }}
      />
    </View>
  );
}

export interface LoginIllustrationProps {
  testID?: string;
}

export function LoginIllustration({ testID }: LoginIllustrationProps) {
  return (
    <AuthIllustration
      source={APP_ASSETS.loginMerchant}
      accessibilityLabel="Comerciante de NemiPay dando la bienvenida"
      heightRatio={0.14}
      minHeight={96}
      maxHeight={128}
      testID={testID}
    />
  );
}

export interface RegisterIllustrationProps {
  testID?: string;
}

export function RegisterIllustration({ testID }: RegisterIllustrationProps) {
  return (
    <AuthIllustration
      source={APP_ASSETS.registerSecurity}
      accessibilityLabel="Escudo de seguridad para crear cuenta en NemiPay"
      heightRatio={0.11}
      minHeight={78}
      maxHeight={104}
      testID={testID}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
