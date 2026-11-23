import React from 'react';
import { Image, StyleSheet, View, useWindowDimensions } from 'react-native';
import { APP_ASSETS } from '@/constants/assets';

export interface LoginIllustrationProps {
  testID?: string;
}

const IMAGE_ASPECT_RATIO = 560 / 400;

export function LoginIllustration({ testID }: LoginIllustrationProps) {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const maxByHeight = Math.round(Math.min(Math.max(windowHeight * 0.28, 165), 235));
  const maxByWidth = Math.round((windowWidth - 40) / IMAGE_ASPECT_RATIO);
  const imageHeight = Math.min(maxByHeight, maxByWidth);
  const imageWidth = Math.round(imageHeight * IMAGE_ASPECT_RATIO);

  return (
    <View style={styles.container}>
      <Image
        source={APP_ASSETS.loginMerchant}
        resizeMode="contain"
        accessible
        accessibilityRole="image"
        accessibilityLabel="Comerciante de NemiPay dando la bienvenida"
        testID={testID}
        style={{ width: imageWidth, height: imageHeight }}
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
});
