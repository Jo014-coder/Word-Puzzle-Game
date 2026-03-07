import { QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { queryClient } from "@/lib/query-client";
import { GameProvider, useGame } from "@/contexts/GameContext";
import { LinearGradient } from "expo-linear-gradient";
import { BACKGROUNDS } from "@/constants/backgrounds";
import {
  useFonts,
  Inter_400Regular,
  Inter_600SemiBold,
  Inter_700Bold,
} from "@expo-google-fonts/inter";

SplashScreen.preventAutoHideAsync();

function ThemedBackground({ children }: { children: React.ReactNode }) {
  const { activeBackground } = useGame();
  const bg = BACKGROUNDS.find(b => b.id === activeBackground) ?? BACKGROUNDS[0];

  return (
    <LinearGradient
      colors={bg.colors as any}
      angle={bg.angle}
      useAngle={true}
      locations={bg.locations}
      style={{ flex: 1 }}
    >
      {children}
    </LinearGradient>
  );
}

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <KeyboardProvider>
            <GameProvider>
              <ThemedBackground>
                <RootLayoutNav />
              </ThemedBackground>
            </GameProvider>
          </KeyboardProvider>
        </GestureHandlerRootView>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
