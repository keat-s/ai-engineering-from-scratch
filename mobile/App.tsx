import React, { useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { NavigationContainer, DarkTheme } from "@react-navigation/native";

import { colors } from "@/theme";
import { initAds } from "@/monetization/ads";
import { primeInterstitial } from "@/monetization/interstitial";
import { PurchasesProvider } from "@/monetization/PurchasesContext";
import { ProgressProvider } from "@/state/ProgressContext";
import { RootNavigator } from "@/navigation/RootNavigator";

const navTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: colors.bg,
    card: colors.surface,
    text: colors.text,
    border: colors.border,
    primary: colors.accent,
  },
};

export default function App() {
  useEffect(() => {
    // Consent -> ATT -> SDK start, then preload the first interstitial.
    (async () => {
      await initAds();
      primeInterstitial();
    })();
  }, []);

  return (
    <SafeAreaProvider>
      <PurchasesProvider>
        <ProgressProvider>
          <NavigationContainer theme={navTheme}>
            <StatusBar style="light" />
            <RootNavigator />
          </NavigationContainer>
        </ProgressProvider>
      </PurchasesProvider>
    </SafeAreaProvider>
  );
}
