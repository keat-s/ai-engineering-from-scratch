import { Platform } from "react-native";
import mobileAds, {
  AdsConsent,
  AdsConsentStatus,
  MaxAdContentRating,
} from "react-native-google-mobile-ads";
import {
  getTrackingPermissionsAsync,
  requestTrackingPermissionsAsync,
} from "expo-tracking-transparency";

let initialized = false;

/**
 * One-time AdMob bootstrap. The ordering matters for store compliance:
 *
 *   1. UMP consent (GDPR/CCPA) — gather consent BEFORE requesting ads in the EEA/UK.
 *   2. App Tracking Transparency (iOS 14.5+) — must prompt before using the IDFA.
 *   3. Configure request settings, then start the Google Mobile Ads SDK.
 *
 * Call this once at app launch (it no-ops on repeat calls). It is safe to call
 * for Pro users too — we simply never render an ad view for them.
 */
export async function initAds(): Promise<void> {
  if (initialized) return;
  initialized = true;

  try {
    // 1. Privacy consent (Google User Messaging Platform).
    await AdsConsent.requestInfoUpdate();
    const { status } = await AdsConsent.getConsentInfo();
    if (
      status === AdsConsentStatus.REQUIRED ||
      status === AdsConsentStatus.UNKNOWN
    ) {
      await AdsConsent.loadAndShowConsentFormIfRequired();
    }

    // 2. iOS App Tracking Transparency prompt (non-personalized ads if declined).
    if (Platform.OS === "ios") {
      const current = await getTrackingPermissionsAsync();
      if (current.status === "undetermined") {
        await requestTrackingPermissionsAsync();
      }
    }

    // 3. Request configuration + SDK start.
    await mobileAds().setRequestConfiguration({
      maxAdContentRating: MaxAdContentRating.PG,
      tagForChildDirectedTreatment: false,
      tagForUnderAgeOfConsent: false,
    });
    await mobileAds().initialize();
  } catch (err) {
    console.warn("[ads] initialization failed", err);
  }
}

/** Re-open the privacy consent form (wired to a Settings row for compliance). */
export async function showPrivacyOptions(): Promise<void> {
  try {
    await AdsConsent.showPrivacyOptionsForm();
  } catch (err) {
    console.warn("[ads] privacy options failed", err);
  }
}
