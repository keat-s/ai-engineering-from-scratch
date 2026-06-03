import React from "react";
import { ScrollView, Text, View, ActivityIndicator, Alert } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { PurchasesPackage } from "react-native-purchases";

import { usePurchases } from "@/monetization/PurchasesContext";
import { totals } from "@/content";
import { Button, Card, Pill, Screen } from "@/components/ui";
import { colors, spacing, typography } from "@/theme";
import type { RootStackParamList } from "@/navigation/types";

type Nav = NativeStackNavigationProp<RootStackParamList>;

const BENEFITS = [
  `All ${totals.lessons} lessons across 20 phases`,
  "Every quiz, with saved scores",
  "Completely ad-free",
  "Offline reading — learn on the train",
  "One purchase, both iPhone and Android",
];

export function PaywallScreen() {
  const nav = useNavigation<Nav>();
  const { isPro, offering, purchasing, ready, purchase, restore } = usePurchases();

  async function buy(pkg: PurchasesPackage) {
    const ok = await purchase(pkg);
    if (ok) {
      Alert.alert("Welcome to Pro", "Everything is unlocked. Enjoy!");
      if (nav.canGoBack()) nav.goBack();
    }
  }

  async function onRestore() {
    const ok = await restore();
    Alert.alert(
      ok ? "Restored" : "Nothing to restore",
      ok ? "Your Pro access is active." : "We couldn't find a previous purchase on this account.",
    );
  }

  if (isPro) {
    return (
      <Screen>
        <View style={{ padding: spacing.xl, alignItems: "center", gap: spacing.md }}>
          <Text style={{ fontSize: 48 }}>★</Text>
          <Text style={typography.h1}>You're Pro</Text>
          <Text style={[typography.muted, { textAlign: "center" }]}>
            Thank you for supporting the project. Every lesson, quiz, and offline download is
            unlocked, and ads are off.
          </Text>
        </View>
      </Screen>
    );
  }

  const packages = offering?.availablePackages ?? [];

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }}>
        <Pill label="AI ENGINEERING FROM SCRATCH" tone="accent" />
        <Text style={typography.h1}>Go Pro</Text>
        <Text style={typography.muted}>Build all of it. No limits, no ads.</Text>

        <Card>
          {BENEFITS.map((b) => (
            <Text key={b} style={[typography.body, { marginVertical: 4 }]}>
              ✓ {b}
            </Text>
          ))}
        </Card>

        {!ready ? (
          <ActivityIndicator color={colors.accent} style={{ marginTop: spacing.lg }} />
        ) : packages.length === 0 ? (
          <Card>
            <Text style={typography.body}>Store products aren't available right now.</Text>
            <Text style={[typography.muted, { marginTop: 6 }]}>
              Pricing loads from the App Store / Play Store on a real build. In Expo Go (no
              native billing), the paywall shows the offer but can't transact. See
              mobile/MONETIZATION.md to finish store setup.
            </Text>
          </Card>
        ) : (
          packages.map((pkg) => (
            <Button
              key={pkg.identifier}
              tone="pro"
              disabled={purchasing}
              title={`${pkg.product.title.replace(/\(.*\)/, "").trim()} — ${pkg.product.priceString}`}
              onPress={() => buy(pkg)}
            />
          ))
        )}

        <Button title="Restore purchases" tone="ghost" onPress={onRestore} disabled={purchasing} />

        <Text style={[typography.muted, { marginTop: spacing.md, fontSize: 11 }]}>
          Subscriptions renew automatically until cancelled; manage or cancel in your App Store /
          Play Store account. The lifetime option is a one-time purchase. Payment is charged to
          your store account at confirmation.
        </Text>
        <View style={{ flexDirection: "row", gap: spacing.lg, marginTop: spacing.xs }}>
          <Text style={[typography.muted, { fontSize: 11, color: colors.accent }]}>
            Terms of Use
          </Text>
          <Text style={[typography.muted, { fontSize: 11, color: colors.accent }]}>
            Privacy Policy
          </Text>
        </View>
      </ScrollView>
    </Screen>
  );
}
