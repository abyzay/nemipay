import React from 'react';
import { Image, StyleSheet, View, useWindowDimensions } from 'react-native';
import { APP_ASSETS } from '@/constants/assets';

export interface WelcomeIllustrationProps {
  testID?: string;
}

const IMAGE_ASPECT_RATIO = 620 / 576;

export function WelcomeIllustration({ testID }: WelcomeIllustrationProps) {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const maxByHeight = Math.round(Math.min(Math.max(windowHeight * 0.37, 210), 320));
  const maxByWidth = Math.round((windowWidth - 32) / IMAGE_ASPECT_RATIO);
  const imageHeight = Math.min(maxByHeight, maxByWidth);
  const imageWidth = Math.round(imageHeight * IMAGE_ASPECT_RATIO);

  return (
    <View style={styles.container}>
      <Image
        source={APP_ASSETS.welcomeQr}
        resizeMode="contain"
        accessible
        accessibilityRole="image"
        accessibilityLabel="Ilustración de cobro con código QR de NemiPay"
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
