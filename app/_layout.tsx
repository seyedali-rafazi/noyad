import React, { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { initializeDatabase, applyMigrations } from '../src/core/database';
import { usePlannerStore } from '../src/features/planner/plannerStore';
import { useAiSettingsStore } from '../src/core/ai/aiSettingsStore';

SplashScreen.preventAutoHideAsync().catch(() => {});

if (Platform.OS === 'web' && typeof document !== 'undefined') {
  const styleId = 'global-custom-focus-reset';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      *:focus, *:focus-visible, *:active {
        outline: none !important;
        box-shadow: none !important;
        -webkit-tap-highlight-color: transparent !important;
      }
      button, a, input, select, textarea, [role="button"], [role="tab"] {
        outline: none !important;
      }
    `;
    document.head.appendChild(style);
  }
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    'Vazirmatn': require('../assets/fonts/Vazirmatn-Regular.ttf'),
    'Vazirmatn-Regular': require('../assets/fonts/Vazirmatn-Regular.ttf'),
    'Vazirmatn-Medium': require('../assets/fonts/Vazirmatn-Medium.ttf'),
    'Vazirmatn-SemiBold': require('../assets/fonts/Vazirmatn-SemiBold.ttf'),
    'Vazirmatn-Bold': require('../assets/fonts/Vazirmatn-Bold.ttf'),
    'Vazirmatn-Light': require('../assets/fonts/Vazirmatn-Light.ttf'),
    'Vazirmatn-ExtraBold': require('../assets/fonts/Vazirmatn-ExtraBold.ttf'),
    'Vazirmatn-Black': require('../assets/fonts/Vazirmatn-Black.ttf'),
  });

  const [dbReady, setDbReady] = useState(false);

  useEffect(() => {
    async function bootstrapDatabase() {
      try {
        initializeDatabase();
        await applyMigrations();
        await Promise.all([
          usePlannerStore.getState().initializeFromDatabase(),
          useAiSettingsStore.getState().loadKeys(),
        ]);
      } catch (err) {
        console.warn('Database bootstrap warning:', err);
      } finally {
        setDbReady(true);
      }
    }

    bootstrapDatabase();
  }, []);

  useEffect(() => {
    if ((fontsLoaded || fontError) && dbReady) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, fontError, dbReady]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="settings"
          options={{
            presentation: 'transparentModal',
            animation: 'none',
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="calendar"
          options={{
            presentation: 'transparentModal',
            animation: 'none',
            headerShown: false,
          }}
        />
      </Stack>
    </SafeAreaProvider>
  );
}
