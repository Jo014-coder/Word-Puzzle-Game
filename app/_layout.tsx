import { QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { ImageBackground } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { LinearGradient } from "expo-linear-gradient";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { queryClient } from "@/lib/query-client";
import { GameProvider, useGame } from "@/contexts/GameContext";
import { BACKGROUNDS } from "@/constants/backgrounds";
import AdOverlay from "@/components/AdOverlay";
import {
  useFonts,
  Inter_400Regular,
  Inter_600SemiBold,
  Inter_700Bold,
} from "@expo-google-fonts/inter";

SplashScreen.preventAutoHideAsync();

function ThemedBackground({ children }: { children: React.ReactNode }) {
  const { activeBackground, adPhase, dismissAd, completeRewardedAd } = useGame();
  const bg = BACKGROUNDS.find(b => b.id === activeBackground) ?? BACKGROUNDS[0];

  const adOverlays = (
    <>
      {adPhase === 'interstitial' && (
        <AdOverlay type="interstitial" onComplete={dismissAd} onDismiss={dismissAd} />
      )}
      {adPhase === 'rewarded' && (
        <AdOverlay type="rewarded" onComplete={completeRewardedAd} onDismiss={dismissAd} />
      )}
    </>
  );

  if (bg.imageSource) {
    return (
      <ImageBackground
        key={bg.id}
        source={bg.imageSource}
        style={{ flex: 1 }}
        resizeMode="cover"
      >
        {children}
        {adOverlays}
      </ImageBackground>
    );
  }

  return (
    <LinearGradient
      key={bg.id}
      colors={bg.colors as any}
      angle={bg.angle}
      useAngle={true}
      locations={bg.locations}
      style={{ flex: 1 }}
    >
      {children}
      {adOverlays}
    </LinearGradient>
  );
}

function RootLayoutNav() {
  return (
    <ThemedBackground>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: 'transparent' },
        }}
      >
        <Stack.Screen name="index" />
      </Stack>
    </ThemedBackground>
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
              <RootLayoutNav />
            </GameProvider>
          </KeyboardProvider>
        </GestureHandlerRootView>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
