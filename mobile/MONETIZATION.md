# Monetization & Store Playbook

Everything needed to turn this app into a revenue-generating product on the App
Store and Google Play. Two revenue lines:

1. **Ads** (free tier) — Google AdMob banner + interstitial.
2. **In-app purchases** (Pro) — auto-renewing subscription (monthly / annual)
   **and** a one-time lifetime unlock, both managed through RevenueCat.

Work top to bottom. The order matters: accounts → products → keys in the app →
privacy/consent → review → launch.

---

## 0. Accounts & one-time costs

| Account | Cost | Why |
|---|---|---|
| Apple Developer Program | **$99 / year** | Required to ship on iOS. |
| Google Play Developer | **$25 one-time** | Required to ship on Android. |
| Google AdMob | Free | Ad serving + payouts. |
| RevenueCat | Free up to ~$2.5k/mo tracked revenue, then a % | IAP/subscription infra. |

You also need a **payout bank account + tax forms** in each console (App Store
Connect → Agreements, Tax, and Banking; Play Console → Payments profile;
AdMob → Payments) or you will not get paid even if you earn.

### Store commission (what you actually keep)

- Apple & Google take **30%** of IAP revenue, dropping to **15%** for:
  - subscriptions after 12 months of a subscriber's tenure (Apple/Google), and
  - everyone enrolled in the **App Store Small Business Program** / **Play's
    reduced 15% tier** (under ~$1M/year — enroll, it's free money).
- Net subscription revenue ≈ price × 0.85 (after enrollment), minus
  RevenueCat's fee above the free tier.
- AdMob: Google's share is already baked into your reported eCPM; the number
  you see is roughly what you keep.

---

## 1. AdMob (ads)

### 1.1 Create the app and ad units

1. AdMob → **Apps → Add app**. Create **two** apps (one iOS, one Android) —
   you can do this before the apps are live ("not yet published").
2. For each app create:
   - **one Banner** unit, and
   - **one Interstitial** unit.
3. Collect six values:
   - iOS **App ID** and Android **App ID** (format `ca-app-pub-XXXX~YYYY`).
   - Banner unit id (iOS, Android).
   - Interstitial unit id (iOS, Android).

### 1.2 Wire them into the app

- **App IDs** go in `app.json` → `plugins → react-native-google-mobile-ads`
  (`androidAppId` / `iosAppId`). They are currently set to Google's official
  **test** App IDs — replace them.
- **Unit IDs** go in `app.json` → `expo.extra`
  (`admobBannerIosUnitId`, etc.). `src/config.ts` reads them.
- Set `expo.extra.useAdMobTestIds` to **`false`** only when you're ready for
  real ads. While `true`, the app serves Google test ads — *always develop with
  test ads*; clicking your own live ads gets your account **banned**.

```jsonc
// app.json (excerpt)
"plugins": [["react-native-google-mobile-ads", {
  "androidAppId": "ca-app-pub-REAL~ANDROID",
  "iosAppId":     "ca-app-pub-REAL~IOS"
}]],
"extra": {
  "admobBannerIosUnitId":       "ca-app-pub-REAL/BANNER_IOS",
  "admobBannerAndroidUnitId":   "ca-app-pub-REAL/BANNER_ANDROID",
  "admobInterstitialIosUnitId": "ca-app-pub-REAL/INT_IOS",
  "admobInterstitialAndroidUnitId": "ca-app-pub-REAL/INT_ANDROID",
  "useAdMobTestIds": false
}
```

### 1.3 Ad placement (already implemented — keep it policy-safe)

- **Banner** (`BannerAdView`) is anchored at the bottom of content screens and
  **renders nothing for Pro users**. Never place a banner over a button or
  scrolling content — accidental clicks are a policy violation.
- **Interstitial** (`interstitial.ts`) shows at a natural break — opening a
  lesson — and only **every 3rd open for free users**. Never show one mid-read,
  on app launch before content, or twice back-to-back.
- Register your test devices in AdMob so even live-ID builds serve test ads to
  your phone.

### 1.4 Mediation & fill (later, for higher eCPM)

Once you have traffic, add mediation networks (Meta Audience Network,
AppLovin, Unity Ads) in AdMob to raise fill rate and eCPM. Not needed for
launch.

---

## 2. RevenueCat + store products (Pro)

RevenueCat sits in front of StoreKit (Apple) and Play Billing (Google) so a
single `pro` entitlement works on both platforms, and restore / receipt
validation / family sharing are handled for you. The app reads this in
`src/monetization/PurchasesContext.tsx`.

### 2.1 Create products in the stores first

RevenueCat references products that must already exist in the stores.

**App Store Connect → your app → Subscriptions & In-App Purchases:**

| Product | Type | Suggested ID |
|---|---|---|
| Pro Monthly | Auto-Renewable Subscription | `aiefs_pro_monthly` |
| Pro Annual  | Auto-Renewable Subscription (same group) | `aiefs_pro_annual` |
| Pro Lifetime | **Non-Consumable** | `aiefs_pro_lifetime` |

> Put monthly + annual in **one subscription group** so users can switch tiers.
> Lifetime is a **non-consumable**, *not* a subscription.

**Play Console → Monetize → Products:** create the two **Subscriptions**
(with base plans monthly/annual) and one **In-app product** for lifetime, using
the *same IDs*.

Use the same product IDs that the app expects (`src/config.ts` → `PRODUCTS`).

### 2.2 RevenueCat dashboard

1. Add an **iOS app** (needs an App Store Connect shared secret / in-app
   purchase key) and an **Android app** (needs a Play service-account JSON with
   billing permission). RevenueCat's setup guide walks both.
2. **Products** → import the products you created.
3. **Entitlements** → create one called **`pro`** (must match
   `PRO_ENTITLEMENT_ID`) and attach all three products to it.
4. **Offerings** → create a `default` (current) offering with three packages:
   monthly, annual, lifetime. The paywall renders whatever packages the current
   offering returns, in order.
5. Copy the **public SDK keys** (one per platform) into `app.json` → `extra`
   (`revenueCatIosKey`, `revenueCatAndroidKey`). These are *public* keys — safe
   in the client, but still inject via EAS secrets rather than hardcoding.

### 2.3 Required store metadata for IAP review

- Apple requires the paywall to disclose: price, billing period, auto-renewal,
  and **links to Terms of Use (EULA) and Privacy Policy**. The paywall screen
  has placeholder links — point them at real URLs before submitting.
- A **Restore Purchases** button is mandatory (present in Paywall + Settings).
- Apple's standard EULA is acceptable; link to
  `https://www.apple.com/legal/internet-services/itunes/dev/stdeula/` if you
  don't have your own.

---

## 3. Privacy, consent & tracking (do NOT skip — #1 rejection cause)

### 3.1 iOS App Tracking Transparency (ATT)

Showing personalized ads via the IDFA requires the ATT prompt. It's wired in
`ads.ts` (`expo-tracking-transparency`) and the usage string is in `app.json`
(`NSUserTrackingUsageDescription`). If the user declines, AdMob automatically
serves **non-personalized** ads — still revenue, just lower eCPM.

### 3.2 GDPR / UMP consent (EEA, UK, Switzerland)

`ads.ts` calls AdMob's **User Messaging Platform** to gather consent before
requesting ads. In AdMob → **Privacy & messaging**, publish a **GDPR** consent
message and a **US states** (CCPA) message, and list your ad partners. The
Settings screen exposes "Ad & data privacy choices" (`showPrivacyOptions`) so
users can change consent later — required.

### 3.3 Store privacy declarations

- **Apple App Privacy ("nutrition label")** in App Store Connect: declare what
  AdMob and RevenueCat collect. AdMob typically = *Identifiers (Device ID),
  Usage Data, Diagnostics*, linked to the user and **used for tracking** (if
  ATT-authorized). RevenueCat = *Purchases, Identifiers*.
- **Google Play Data Safety** form: the analogous declaration. AdMob's
  collection of the Advertising ID must be disclosed; `app.json` already
  declares the `AD_ID` permission Android 13+ requires.

### 3.4 Privacy policy (mandatory)

Both stores **require a public privacy policy URL** for any app with ads or
IAP. A ready-to-host template is in [`PRIVACY_POLICY.md`](./PRIVACY_POLICY.md).
Host it (e.g. at `aiengineeringfromscratch.com/privacy`) and put the URL in
both store listings and the in-app links.

### 3.5 Audience / COPPA

This curriculum targets adult/professional learners, so set the content rating
to a general/teen audience and **not** "child-directed." Don't set
`tagForChildDirectedTreatment` (it's `false` in `ads.ts`) — child-directed apps
have far stricter ad rules.

---

## 4. Pricing strategy

A defensible default for a developer-education app (adjust per market with
RevenueCat experiments):

| Package | Price (USD) | Notes |
|---|---|---|
| Monthly | **$6.99 / mo** | Impulse entry; highest churn. |
| Annual | **$39.99 / yr** (~$3.33/mo, "save 52%") | Anchor + best LTV. Default-highlighted. |
| Lifetime | **$79.99 once** | For ad-haters / one-time payers; caps LTV but converts skeptics. |

Tactics:
- **Anchor on annual.** Show monthly next to it so annual looks cheap.
- Consider a **7-day free trial** on the annual plan (configure as an
  introductory offer in the store + RevenueCat) — typically lifts conversion.
- Let RevenueCat **localize prices** per storefront (it does this automatically
  from store price tiers — never hardcode "$").
- A/B test price and trial length with **RevenueCat Experiments** once you have
  installs.

The free tier (Phases 0–2, ad-supported) is the funnel: it's genuinely useful,
so it ranks/retains, and the paywall appears at the natural wall (Phase 3,
locked lessons, the quiz preview).

---

## 5. Store listing & ASO (App Store Optimization)

You need, per store:

- **App name + subtitle** with a keyword (e.g. "Learn AI Engineering").
- **Keywords** (iOS): `AI, machine learning, LLM, deep learning, neural
  network, transformer, ML course, AI course, coding`.
- **Screenshots** (required sizes per device) — show a lesson, a quiz, the
  progress screen, and the paywall value prop.
- **Description** leading with the outcome ("Build AI from scratch — 503
  lessons, offline").
- **App icon** (1024×1024). Add `assets/icon.png` + `assets/splash.png` and
  reference them in `app.json` (currently only background colors are set, so
  Expo defaults are used).
- **Category:** Education. **Content rating:** complete the questionnaire.

---

## 6. Analytics & growth (after launch)

- RevenueCat dashboard = subscription MRR, churn, LTV, trial conversion (built
  in).
- AdMob dashboard = impressions, eCPM, ad revenue.
- Add lightweight product analytics (e.g. Firebase/Amplitude/PostHog) to see
  the funnel: install → lesson read → paywall view → purchase.
- Drive installs from the existing web site
  (`aiengineeringfromscratch.com`), the repo README, and the GitHub stars
  audience — that organic top-of-funnel is the cheapest acquisition you have.

---

## 7. Back-of-envelope revenue

Illustrative, not a promise — plug in your own numbers:

```
Ads (free users):
  10,000 monthly active free users
  × ~30 ad impressions / user / month
  × $8 eCPM / 1000                       ≈  $2,400 / mo

Subscriptions:
  10,000 free users × 3% convert = 300 payers
  blended ~$4/mo net (after store cut)   ≈  $1,200 / mo recurring

Lifetime:
  ~20 lifetime buyers/mo × $80 × 0.85    ≈  $1,360 one-time-ish / mo
```

Levers, biggest first: **conversion rate** (paywall copy, trial), **eCPM**
(mediation), **MAU** (ASO + the web funnel), **price**.

---

## 8. Launch checklist

- [ ] `python3 scripts/build_mobile_content.py` run; `curriculum.json` current.
- [ ] Apple + Google developer accounts active; banking/tax submitted.
- [ ] AdMob apps + units created; App IDs in plugin, unit IDs in `extra`;
      `useAdMobTestIds: false`.
- [ ] Store products created (monthly, annual, lifetime) with matching IDs.
- [ ] RevenueCat: `pro` entitlement + `default` offering with 3 packages;
      public keys in `extra`.
- [ ] ATT string + UMP GDPR/CCPA messages published.
- [ ] App Privacy (Apple) + Data Safety (Google) forms completed.
- [ ] Privacy policy + Terms URLs hosted and linked (paywall, listing).
- [ ] Restore Purchases works on a real device.
- [ ] Tested a real purchase in **sandbox** (Apple sandbox tester / Play
      license tester) — sub, lifetime, restore, and Pro removes ads.
- [ ] Icon + screenshots + description uploaded.
- [ ] `eas build --profile production` for both platforms; `eas submit`.

---

## File map (where each piece lives in code)

| Concern | File |
|---|---|
| Ad unit / RevenueCat key resolution | `src/config.ts` |
| Consent → ATT → SDK init | `src/monetization/ads.ts` |
| Banner (hidden for Pro) | `src/monetization/BannerAdView.tsx` |
| Interstitial throttling | `src/monetization/interstitial.ts` |
| `isPro`, offerings, purchase, restore | `src/monetization/PurchasesContext.tsx` |
| Paywall UI | `src/screens/PaywallScreen.tsx` |
| Free/Pro gating per lesson | `src/screens/LessonScreen.tsx`, `QuizScreen.tsx` |
| Free-phase source of truth | `scripts/build_mobile_content.py` (`FREE_PHASES`) |
| Plugin config, bundle ids, ATT string | `app.json` |
