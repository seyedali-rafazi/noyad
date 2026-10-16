import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';

SplashScreen.preventAutoHideAsync().catch(() => {});

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

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, fontError]);

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
            presentation: 'modal',
            headerShown: false,
          }}
        />
      </Stack>
    </SafeAreaProvider>
  );
}
