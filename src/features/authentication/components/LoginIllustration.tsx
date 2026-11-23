import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { APP_ASSETS } from '@/constants/assets';

export interface LoginIllustrationProps {
  testID?: string;
}

export function LoginIllustration({ testID }: LoginIllustrationProps) {
  return (
    <View style={styles.container}>
      <Image
        source={APP_ASSETS.loginMerchant}
        resizeMode="contain"
        accessible
        accessibilityRole="image"
        accessibilityLabel="Comerciante de NemiPay dando la bienvenida"
        testID={testID}
        style={styles.image}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    maxWidth: 220,
    height: 175,
  },
});
