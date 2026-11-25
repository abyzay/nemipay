import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
  useFonts,
} from '@expo-google-fonts/plus-jakarta-sans';
import { router, Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { AppProviders } from '@/components/layout/AppProviders';
import { queryClient } from '@/config/queryClient';
import {
  getCurrentAccessToken,
  mapSupabaseUser,
  signOutSession,
} from '@/features/authentication/services';
import { setAuthTokenProvider, setSessionExpiredHandler } from '@/services/api';
import { supabase } from '@/services/supabase';
import { useUiStore } from '@/stores';
import { lightColors } from '@/theme';

void SplashScreen.preventAutoHideAsync();

function AuthSessionBootstrap() {
  const setAuthenticatedUser = useUiStore((state) => state.setAuthenticatedUser);
  const clearSession = useUiStore((state) => state.clearSession);

  useEffect(() => {
    setAuthTokenProvider(getCurrentAccessToken);
    setSessionExpiredHandler(async () => {
      try {
        await signOutSession();
      } finally {
        queryClient.clear();
        clearSession();
        router.replace('/(auth)/login');
      }
    });

    let active = true;

    void supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!active) return;
        const user = data.session?.user;
        if (user) {
          setAuthenticatedUser(mapSupabaseUser(user));
        } else {
          clearSession();
        }
      })
      .catch(() => {
        if (active) {
          clearSession();
        }
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      if (session?.user) {
        setAuthenticatedUser(mapSupabaseUser(session.user));
      } else {
        queryClient.clear();
        clearSession();
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
      setAuthTokenProvider(null);
      setSessionExpiredHandler(null);
    };
  }, [clearSession, setAuthenticatedUser]);

  return null;
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      void SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <AppProviders>
      <AuthSessionBootstrap />
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: lightColors.background },
          animation: 'fade',
        }}
      />
    </AppProviders>
  );
}
