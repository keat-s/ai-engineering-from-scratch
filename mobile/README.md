# AI Engineering from Scratch — Mobile App

A cross-platform (iOS + Android) learning app built from this repository's
503-lesson curriculum. Read lessons and take quizzes on the go, fully offline.

- **Free tier** — Phases 0–2 (52 lessons: setup, math foundations, ML
  fundamentals), ad-supported.
- **Pro tier** — all 20 phases / 503 lessons, every quiz, offline access, and
  **no ads**. Sold as a monthly or annual subscription *or* a one-time lifetime
  unlock (your choice at the paywall).

Built with **Expo / React Native**, **Google AdMob** (banner + interstitial),
and **RevenueCat** (subscriptions + lifetime IAP, cross-platform).

> The full money/store playbook — AdMob, RevenueCat, App Store Connect, Play
> Console, ATT & consent, pricing, ASO, compliance — lives in
> [`MONETIZATION.md`](./MONETIZATION.md). Read that before you ship.

---

## Stack

| Concern | Library |
|---|---|
| Framework | Expo SDK 52 / React Native 0.76 |
| Navigation | React Navigation (native-stack + bottom-tabs) |
| Ads | `react-native-google-mobile-ads` (AdMob) |
| Purchases | `react-native-purchases` (RevenueCat) |
| Privacy consent | AdMob UMP + `expo-tracking-transparency` (iOS ATT) |
| Markdown | `react-native-markdown-display` |
| Local progress | `@react-native-async-storage/async-storage` |

## Project layout

```
mobile/
├── App.tsx                 # providers + navigation + ad bootstrap
├── app.json                # Expo config: bundle ids, AdMob app ids, ATT strings, plugins
├── eas.json                # EAS build/submit profiles
├── assets/content/
│   └── curriculum.json     # GENERATED bundle of all lessons + quizzes (offline)
└── src/
    ├── config.ts           # AdMob unit ids + RevenueCat keys (from app.json `extra`)
    ├── content/            # loads curriculum.json, lookup helpers
    ├── monetization/
    │   ├── ads.ts          # consent (UMP) -> ATT -> SDK init
    │   ├── BannerAdView.tsx# banner (hidden for Pro)
    │   ├── interstitial.ts # interstitial manager (free users, throttled)
    │   └── PurchasesContext.tsx # RevenueCat: isPro, offerings, purchase, restore
    ├── state/ProgressContext.tsx # completed lessons + quiz scores
    ├── navigation/         # stack + tabs
    └── screens/            # Home, Phase, Lesson, Quiz, Progress, Paywall, Settings
```

## Content pipeline

The app ships the whole curriculum offline. The bundle is generated from the
repo's `phases/**/docs/en.md` + `quiz.json` files:

```bash
# from the repo root
python3 scripts/build_mobile_content.py        # -> mobile/assets/content/curriculum.json
```

Free vs. Pro is decided **once**, in that script (`FREE_PHASES = {0, 1, 2}`),
and flows into the app as a `free` flag per phase/lesson — there is no
hard-coded phase list in the UI. Re-run the script whenever lessons change.

## Run it locally

```bash
cd mobile
npm install

# JS-only smoke test (no native ads/IAP) in Expo Go:
npx expo start
```

> **Expo Go caveat:** AdMob and RevenueCat are native modules. In Expo Go the
> app runs in "free mode" — no ads render and the paywall shows the offer but
> can't transact. To exercise ads + purchases you need a **development build**:

```bash
npm install -g eas-cli
eas login
eas build --profile development --platform ios      # or android
# install the build on a device/simulator, then:
npx expo start --dev-client
```

`npx expo install` is the safest way to add/upgrade native deps — it pins
versions to your Expo SDK.

## Configure monetization (summary)

All IDs/keys are injected via `app.json` → `expo.extra` (use EAS secrets for
real keys; never commit them). While `useAdMobTestIds: true`, the app always
serves Google **test** ads so you can't get an invalid-traffic strike.

1. **AdMob** — create an app + a banner unit + an interstitial unit per
   platform. Put the **App IDs** in the `react-native-google-mobile-ads` plugin
   block and the **unit IDs** in `extra`. Flip `useAdMobTestIds` to `false`.
2. **RevenueCat** — create the `pro` entitlement, attach the monthly/annual/
   lifetime products, put the public SDK keys in `extra`.
3. **Stores** — create the matching products in App Store Connect and Play
   Console.

Step-by-step instructions, including ATT/consent, store review gotchas,
pricing, and a launch checklist, are in **[`MONETIZATION.md`](./MONETIZATION.md)**.

## Build for the stores

```bash
eas build --profile production --platform ios
eas build --profile production --platform android
eas submit  --profile production --platform ios      # uploads to App Store Connect
eas submit  --profile production --platform android  # uploads to Play Console
```

## License

The curriculum content is MIT-licensed (see the repo `LICENSE`). The app code
here is part of the same repository and license.
