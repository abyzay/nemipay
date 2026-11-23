import React from 'react';
import { StyleSheet, View } from 'react-native';
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
    <ScreenContainer>
      <View style={styles.content}>
        <WelcomeHeader onNotificationsPress={onNotificationsPress} />
        <WelcomeHero />
        <WelcomeActions
          onLoginPress={onLoginPress}
          onCreateAccountPress={onCreateAccountPress}
          onTermsPress={onTermsPress}
          onPrivacyPress={onPrivacyPress}
        />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    justifyContent: 'space-between',
  },
});
