import { Stack } from 'expo-router';

/**
 * Contenedor reservado para la navegación principal por pestañas en etapas posteriores.
 */
export default function TabsLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
