import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme } from '@/hooks';

/**
 * Shell técnico mínimo para validar Expo Router, React Native Paper y el tema base.
 * Las pantallas funcionales se implementarán en etapas posteriores.
 */
export default function IndexRoute() {
  const { tokens } = useAppTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: tokens.colors.background }]}>
      <View
        style={[
          styles.card,
          {
            backgroundColor: tokens.colors.surface,
            borderColor: tokens.colors.border,
            borderRadius: tokens.radii.lg,
            padding: tokens.spacing.lg,
          },
        ]}
      >
        <Text variant="titleLarge" style={{ color: tokens.colors.primary }}>
          NemiPay
        </Text>
        <Text
          variant="bodyMedium"
          style={{ color: tokens.colors.textSecondary, marginTop: tokens.spacing.xs }}
        >
          Infraestructura lista
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    borderWidth: 1,
    alignItems: 'center',
  },
});
