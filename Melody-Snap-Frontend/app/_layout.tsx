import { useCallback } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator } from 'react-native';
import { useFonts } from 'expo-font';
import { 
  Outfit_400Regular, 
  Outfit_600SemiBold, 
  Outfit_800ExtraBold 
} from '@expo-google-fonts/outfit';
import { ReenieBeanie_400Regular } from '@expo-google-fonts/reenie-beanie';
import { COLORS } from '../constants/theme';
import * as SplashScreen from 'expo-splash-screen';

// Prevent auto hide until fonts are loaded
SplashScreen.preventAutoHideAsync();

export default function Layout() {
  const [fontsLoaded] = useFonts({
    Outfit_400Regular,
    Outfit_600SemiBold,
    Outfit_800ExtraBold,
    ReenieBeanie_400Regular,
  });

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: COLORS.background },
          animation: 'fade',
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="capture" options={{ headerShown: false, animation: 'slide_from_bottom' }} />
        <Stack.Screen name="LoadingScreen" options={{ headerShown: false, animation: 'fade' }} />
      </Stack>
    </View>
  );
}
