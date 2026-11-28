import React from 'react';
import { StyleSheet } from 'react-native';
import { ScreenContainer } from '@/components/layout';
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
  return (
    <ScreenContainer contentContainerStyle={styles.content}>
      <WelcomeHeader onNotificationsPress={onNotificationsPress} />
      <WelcomeHero />
      <WelcomeActions
        onLoginPress={onLoginPress}
        onCreateAccountPress={onCreateAccountPress}
        onTermsPress={onTermsPress}
        onPrivacyPress={onPrivacyPress}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 0,
  },
});
