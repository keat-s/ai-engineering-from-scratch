import {
  AdEventType,
  InterstitialAd,
} from "react-native-google-mobile-ads";

import { INTERSTITIAL_AD_UNIT_ID, INTERSTITIAL_EVERY_N_LESSONS } from "@/config";

/**
 * Lightweight interstitial manager. We preload one ad, show it at most once
 * every N free-lesson opens, and immediately preload the next. Interstitials
 * are only ever triggered by free users (the caller passes `isPro`), and only
 * at natural transition points (opening a lesson), never mid-reading — both
 * are AdMob policy requirements.
 */
let ad: InterstitialAd | null = null;
let loaded = false;
let opensSinceLastAd = 0;

function createAndLoad() {
  ad = InterstitialAd.createForAdRequest(INTERSTITIAL_AD_UNIT_ID, {
    requestNonPersonalizedAdsOnly: false,
  });
  loaded = false;
  const unsubLoaded = ad.addAdEventListener(AdEventType.LOADED, () => {
    loaded = true;
  });
  const unsubClosed = ad.addAdEventListener(AdEventType.CLOSED, () => {
    unsubLoaded();
    unsubClosed();
    // Preload the next one for a future transition.
    createAndLoad();
  });
  const unsubError = ad.addAdEventListener(AdEventType.ERROR, () => {
    loaded = false;
  });
  ad.load();
}

/** Preload the first interstitial — call once after ads are initialized. */
export function primeInterstitial() {
  if (!ad) createAndLoad();
}

/**
 * Count a lesson open and, every Nth time for a free user, show a preloaded
 * interstitial. No-ops for Pro users or when nothing is loaded yet.
 */
export function maybeShowInterstitialOnLessonOpen(isPro: boolean) {
  if (isPro) return;
  opensSinceLastAd += 1;
  if (opensSinceLastAd < INTERSTITIAL_EVERY_N_LESSONS) return;
  if (ad && loaded) {
    opensSinceLastAd = 0;
    try {
      ad.show();
    } catch {
      // showing can throw if not ready; reset and reload.
      createAndLoad();
    }
  }
}
