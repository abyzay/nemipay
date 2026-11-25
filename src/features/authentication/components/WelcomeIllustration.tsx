import React from 'react';
import {
  Image,
  StyleSheet,
  View,
  useWindowDimensions,
  type ImageSourcePropType,
} from 'react-native';
import { APP_ASSETS } from '@/constants/assets';
import { useAppTheme } from '@/hooks';

export interface WelcomeIllustrationProps {
  source?: ImageSourcePropType;
  accessibilityLabel?: string;
  testID?: string;
}

const IMAGE_ASPECT_RATIO = 1;

export function WelcomeIllustration({
  source = APP_ASSETS.welcomeQr,
  accessibilityLabel = 'Ilustración de cobro con código QR de NemiPay',
  testID,
}: WelcomeIllustrationProps) {
  const { tokens } = useAppTheme();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();

  const maxByHeight = Math.round(Math.min(Math.max(windowHeight * 0.34, 200), 290));
  const maxByWidth = Math.round(
    (windowWidth - tokens.layout.screenHorizontalPadding * 2) / IMAGE_ASPECT_RATIO
  );
  const imageHeight = Math.min(maxByHeight, maxByWidth);
  const imageWidth = Math.round(imageHeight * IMAGE_ASPECT_RATIO);

  return (
    <View style={styles.container}>
      <Image
        source={source}
        resizeMode="contain"
        accessible
        accessibilityRole="image"
        accessibilityLabel={accessibilityLabel}
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
