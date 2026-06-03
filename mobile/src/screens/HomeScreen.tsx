import React from "react";
import { FlatList, Text, View, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { phases, totals } from "@/content";
import { usePurchases } from "@/monetization/PurchasesContext";
import { useProgress } from "@/state/ProgressContext";
import { BannerAdView } from "@/monetization/BannerAdView";
import { Card, Pill, ProgressBar, Screen } from "@/components/ui";
import { colors, spacing, typography } from "@/theme";
import type { RootStackParamList } from "@/navigation/types";

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function HomeScreen() {
  const nav = useNavigation<Nav>();
  const { isPro } = usePurchases();
  const { isComplete } = useProgress();

  return (
    <Screen>
      <FlatList
        data={phases}
        keyExtractor={(p) => p.slug}
        contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }}
        ListHeaderComponent={
          <View style={{ marginBottom: spacing.sm }}>
            <Text style={typography.h1}>AI Engineering from Scratch</Text>
            <Text style={[typography.muted, { marginTop: 4 }]}>
              {totals.lessons} lessons · {totals.phases} phases · build it by hand
            </Text>
            {!isPro && (
              <Card
                style={{ marginTop: spacing.md, borderColor: colors.pro }}
                onPress={() => nav.navigate("Paywall", { reason: "home" })}
              >
                <Text style={{ color: colors.pro, fontWeight: "800" }}>★ Unlock everything</Text>
                <Text style={[typography.muted, { marginTop: 4 }]}>
                  Phases 0–2 are free. Go Pro for all {totals.lessons} lessons, every quiz,
                  offline access, and no ads.
                </Text>
              </Card>
            )}
          </View>
        }
        renderItem={({ item: phase }) => {
          const done = phase.lessons.filter((l) => isComplete(l.id)).length;
          const locked = !phase.free && !isPro;
          return (
            <Card onPress={() => nav.navigate("Phase", { phaseNum: phase.num })}>
              <View style={styles.row}>
                <Text style={styles.phaseNum}>{String(phase.num).padStart(2, "0")}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={typography.h2}>{phase.title}</Text>
                  <Text style={[typography.muted, { marginTop: 2 }]}>
                    {phase.lesson_count} lessons
                  </Text>
                </View>
                {phase.free ? <Pill label="FREE" tone="success" /> : null}
                {locked ? <Pill label="🔒 PRO" tone="pro" /> : null}
              </View>
              <View style={{ marginTop: spacing.md }}>
                <ProgressBar value={phase.lesson_count ? done / phase.lesson_count : 0} />
                <Text style={[typography.muted, { marginTop: 4 }]}>
                  {done}/{phase.lesson_count} complete
                </Text>
              </View>
            </Card>
          );
        }}
      />
      <BannerAdView />
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  phaseNum: {
    fontSize: 22,
    fontWeight: "800",
    color: colors.accent,
    width: 36,
  },
});
