import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { ScreenContainer } from '@/components/layout';
import { useAppTheme } from '@/hooks';
import { WelcomeActions } from './WelcomeActions';
import { WelcomeHeader } from './WelcomeHeader';
import { WelcomeHero } from './WelcomeHero';

export interface WelcomeScreenProps {
  onLoginPress: () => void;
  onCreateAccountPress: () => void;
  onNotificationsPress?: () => void;
  onTermsPress?: () => void;
  onPrivacyPress?: () => void;
}

export function WelcomeScreen({
  onLoginPress,
  onCreateAccountPress,
  onNotificationsPress,
  onTermsPress,
  onPrivacyPress,
}: WelcomeScreenProps) {
  const { tokens } = useAppTheme();

  return (
    <View style={[styles.root, { backgroundColor: tokens.colors.background }]}>
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        <Svg
          width="100%"
          height="100%"
          viewBox="0 0 390 844"
          preserveAspectRatio="none"
          accessibilityElementsHidden
          importantForAccessibility="no"
        >
          {/* Top-right organic lavender accent blob */}
          <Path
            d="M274 0H390V174C346 184 300 165 282 126C265 90 250 38 274 0Z"
            fill={tokens.colors.lavender}
            fillOpacity={0.7}
          />
          {/* Left soft organic lavender cloud behind carousel stage */}
          <Path
            d="M0 442C44 410 112 414 156 456C198 496 206 568 176 618C144 666 56 670 0 644V442Z"
            fill={tokens.colors.lavenderSoft}
          />
          {/* Right soft organic lavender blob behind carousel stage */}
          <Path
            d="M390 368C340 352 276 376 244 426C210 478 214 558 256 608C296 654 352 664 390 642V368Z"
            fill={tokens.colors.lavender}
            fillOpacity={0.62}
          />
          {/* Subtle bottom-center mist blending into CTA stage */}
          <Path
            d="M0 572C94 532 288 532 390 576V694C294 676 96 676 0 694V572Z"
            fill={tokens.colors.lavenderSoft}
            fillOpacity={0.65}
          />
        </Svg>
      </View>

      <ScreenContainer style={styles.transparent} contentContainerStyle={styles.content}>
        <WelcomeHeader onNotificationsPress={onNotificationsPress} />
        <WelcomeHero />
        <WelcomeActions
          onLoginPress={onLoginPress}
          onCreateAccountPress={onCreateAccountPress}
          onTermsPress={onTermsPress}
          onPrivacyPress={onPrivacyPress}
        />
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
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 0,
  },
});
