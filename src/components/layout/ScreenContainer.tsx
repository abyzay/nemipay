import React from 'react';
import { ScrollView, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';
import { useAppTheme } from '@/hooks';
import { ScreenBackdrop } from './ScreenBackdrop';

export interface ScreenContainerProps {
  children: React.ReactNode;
  scrollable?: boolean;
  edges?: Edge[];
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
  showBackdrop?: boolean;
  backdropTestID?: string;
}

export function ScreenContainer({
  children,
  scrollable = false,
  edges = ['top', 'bottom'],
  style,
  contentContainerStyle,
  showBackdrop = true,
  backdropTestID,
}: ScreenContainerProps) {
  const { tokens } = useAppTheme();

  return (
    <View style={[styles.root, { backgroundColor: tokens.colors.background }, style]}>
      {showBackdrop ? <ScreenBackdrop testID={backdropTestID} /> : null}
      <SafeAreaView edges={edges} style={styles.safeArea}>
        {scrollable ? (
          <ScrollView
            bounces={false}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[
              styles.scrollContent,
              { paddingHorizontal: tokens.layout.screenHorizontalPadding },
              contentContainerStyle,
            ]}
          >
            {children}
          </ScrollView>
        ) : (
          <View
            style={[
              styles.staticContent,
              { paddingHorizontal: tokens.layout.screenHorizontalPadding },
              contentContainerStyle,
            ]}
          >
            {children}
          </View>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    position: 'relative',
  },
  safeArea: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scrollContent: {
    flexGrow: 1,
  },
  staticContent: {
    flex: 1,
  },
});
