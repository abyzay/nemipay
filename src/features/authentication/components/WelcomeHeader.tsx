import React from 'react';
import { StyleSheet, View } from 'react-native';
import { NemiPayLogo } from '@/components/ui';
import { useAppTheme } from '@/hooks';

export interface WelcomeHeaderProps {
  onNotificationsPress?: () => void;
}

export function WelcomeHeader(_props: WelcomeHeaderProps) {
  const { tokens } = useAppTheme();

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: tokens.spacing.space8,
          paddingHorizontal: tokens.layout.screenHorizontalPadding,
        },
      ]}
    >
      <NemiPayLogo size="xl" layout="vertical" testID="welcome-logo" />
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
