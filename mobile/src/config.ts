import Constants from "expo-constants";
import { Platform } from "react-native";
import { TestIds } from "react-native-google-mobile-ads";

/**
 * Central place for monetization configuration. Real IDs/keys are injected
 * through `app.json` -> `expo.extra` (or EAS secrets), never hard-coded in
 * source. While `useAdMobTestIds` is true the app always serves Google's
 * test ads so we never risk an invalid-traffic strike during development.
 *
 * Read the matching setup steps in mobile/MONETIZATION.md.
 */
const extra = (Constants.expoConfig?.extra ?? {}) as Record<string, string | boolean>;

function pick(ios: unknown, android: unknown): string {
  return String((Platform.OS === "ios" ? ios : android) ?? "");
}

export const USE_AD_TEST_IDS: boolean =
  extra.useAdMobTestIds === undefined ? true : Boolean(extra.useAdMobTestIds);

/** RevenueCat public SDK key for the current platform. */
export const REVENUECAT_API_KEY: string = pick(
  extra.revenueCatIosKey,
  extra.revenueCatAndroidKey,
);

/** Banner ad unit — falls back to Google's test unit when configured to. */
export const BANNER_AD_UNIT_ID: string = USE_AD_TEST_IDS
  ? TestIds.BANNER
  : pick(extra.admobBannerIosUnitId, extra.admobBannerAndroidUnitId) || TestIds.BANNER;

/** Interstitial ad unit — falls back to Google's test unit when configured to. */
export const INTERSTITIAL_AD_UNIT_ID: string = USE_AD_TEST_IDS
  ? TestIds.INTERSTITIAL
  : pick(extra.admobInterstitialIosUnitId, extra.admobInterstitialAndroidUnitId) ||
    TestIds.INTERSTITIAL;

/**
 * RevenueCat entitlement identifier that grants full access. Configure an
 * entitlement with this exact id in the RevenueCat dashboard and attach both
 * the subscription and the lifetime products to it.
 */
export const PRO_ENTITLEMENT_ID = "pro";

/** Product identifiers offered on the paywall (mirror these in the stores + RevenueCat). */
export const PRODUCTS = {
  monthly: "aiefs_pro_monthly",
  annual: "aiefs_pro_annual",
  lifetime: "aiefs_pro_lifetime",
} as const;

/** Show an interstitial after this many lesson opens by a free user. */
export const INTERSTITIAL_EVERY_N_LESSONS = 3;
