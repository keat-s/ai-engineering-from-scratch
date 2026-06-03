import React from "react";
import { ScrollView, Text, View, Linking } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { usePurchases } from "@/monetization/PurchasesContext";
import { showPrivacyOptions } from "@/monetization/ads";
import { totals } from "@/content";
import { Button, Card, Screen } from "@/components/ui";
import { spacing, typography } from "@/theme";
import type { RootStackParamList } from "@/navigation/types";

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function SettingsScreen() {
  const nav = useNavigation<Nav>();
  const { isPro, restore } = usePurchases();

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }}>
        <Card>
          <Text style={typography.h2}>{isPro ? "Pro member ★" : "Free plan"}</Text>
          <Text style={[typography.muted, { marginTop: 4 }]}>
            {isPro
              ? "All content unlocked, ads off."
              : `Phases 0–2 free. ${totals.lessons - totals.free_lessons} more lessons in Pro.`}
          </Text>
          {!isPro && (
            <Button
              title="Go Pro"
              tone="pro"
              style={{ marginTop: spacing.md }}
              onPress={() => nav.navigate("Paywall", { reason: "settings" })}
            />
          )}
        </Card>

        <Card>
          <Text style={typography.label}>PURCHASES</Text>
          <Button
            title="Restore purchases"
            tone="ghost"
            style={{ marginTop: spacing.sm }}
            onPress={restore}
          />
        </Card>

        <Card>
          <Text style={typography.label}>PRIVACY</Text>
          <Button
            title="Ad & data privacy choices"
            tone="ghost"
            style={{ marginTop: spacing.sm }}
            onPress={showPrivacyOptions}
          />
          <Button
            title="Privacy policy"
            tone="ghost"
            style={{ marginTop: spacing.sm }}
            onPress={() => Linking.openURL("https://aiengineeringfromscratch.com/privacy")}
          />
        </Card>

        <View style={{ alignItems: "center", marginTop: spacing.md }}>
          <Text style={typography.muted}>AI Engineering from Scratch · v1.0.0</Text>
          <Text style={[typography.muted, { fontSize: 11, marginTop: 2 }]}>
            {totals.lessons} lessons · {totals.phases} phases · MIT-licensed content
          </Text>
        </View>
      </ScrollView>
    </Screen>
  );
}
