import React, { useEffect, useState, useCallback } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Slot, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as WebBrowser from 'expo-web-browser';
import * as SplashScreen from 'expo-splash-screen';
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import { supabase } from '../lib/supabase';
import type { Session } from '@supabase/supabase-js';
import { useTheme } from '../constants/theme';

// Keep splash screen visible while loading fonts
SplashScreen.preventAutoHideAsync();

// Required for OAuth redirects to work in Expo Go
WebBrowser.maybeCompleteAuthSession();

export default function RootLayout() {
  const theme = useTheme();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Load Inter font family
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  useEffect(() => {
    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      if (!newSession) {
        router.replace('/(auth)/login');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!loading && fontsLoaded) {
      if (session) {
        const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://72.60.155.227:4000';
        fetch(`${API_URL}/api/v1/settings`, {
          headers: { 'Authorization': `Bearer ${session.access_token}` },
        })
          .then(r => r.json())
          .then(data => {
            if (data.settings?.onboarding_completed) {
              router.replace('/(main)');
            } else {
              router.replace('/(onboarding)');
            }
          })
          .catch(() => router.replace('/(main)'));
      } else {
        router.replace('/(auth)/login');
      }
    }
  }, [loading, session, fontsLoaded]);

  // Show loading while fonts are loading
  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.bg }}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <SafeAreaProvider onLayout={onLayoutRootView}>
      <StatusBar style="auto" />
      <Slot />
    </SafeAreaProvider>
  );
}
