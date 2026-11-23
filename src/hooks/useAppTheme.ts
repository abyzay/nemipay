import { useTheme } from 'react-native-paper';
import type { MD3Theme } from 'react-native-paper';
import { nemipayTheme, type NemipayTheme } from '@/theme';

export function useAppTheme(): {
  paperTheme: MD3Theme;
  tokens: NemipayTheme;
} {
  const paperTheme = useTheme<MD3Theme>();
  return {
    paperTheme,
    tokens: nemipayTheme,
  };
}
