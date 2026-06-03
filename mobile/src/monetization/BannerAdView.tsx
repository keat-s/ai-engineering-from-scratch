import React from "react";
import { View, StyleSheet } from "react-native";
import {
  BannerAd,
  BannerAdSize,
} from "react-native-google-mobile-ads";

import { BANNER_AD_UNIT_ID } from "@/config";
import { usePurchases } from "@/monetization/PurchasesContext";
import { colors } from "@/theme";

/**
 * Anchored banner shown to free users only. Renders nothing for Pro users,
 * which is the in-app reward for upgrading. Place at the bottom of content
 * screens (Home, Phase, Lesson) — never over interactive controls, per
 * AdMob policy.
 */
export function BannerAdView() {
  const { isPro, ready } = usePurchases();
  if (!ready || isPro) return null;

  return (
    <View style={styles.wrap}>
      <BannerAd
        unitId={BANNER_AD_UNIT_ID}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        requestOptions={{ requestNonPersonalizedAdsOnly: false }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.bg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    paddingVertical: 2,
  },
});
