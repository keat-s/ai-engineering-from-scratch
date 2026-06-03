import React, { useMemo } from "react";
import { ScrollView, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { phases, totals } from "@/content";
import { useProgress } from "@/state/ProgressContext";
import { usePurchases } from "@/monetization/PurchasesContext";
import { BannerAdView } from "@/monetization/BannerAdView";
import { Button, Card, ProgressBar, Screen } from "@/components/ui";
import { colors, spacing, typography } from "@/theme";
import type { RootStackParamList } from "@/navigation/types";

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function ProgressScreen() {
  const nav = useNavigation<Nav>();
  const { completedCount, isComplete } = useProgress();
  const { isPro } = usePurchases();

  const perPhase = useMemo(
    () =>
      phases.map((p) => ({
        phase: p,
        done: p.lessons.filter((l) => isComplete(l.id)).length,
      })),
    [isComplete],
  );

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }}>
        <Text style={typography.h1}>Your progress</Text>
        <Card>
          <Text style={[typography.h2, { color: colors.accent }]}>
            {completedCount}/{totals.lessons}
          </Text>
          <Text style={typography.muted}>lessons completed</Text>
          <View style={{ marginTop: spacing.md }}>
            <ProgressBar value={totals.lessons ? completedCount / totals.lessons : 0} />
          </View>
        </Card>

        {!isPro && (
          <Button
            title="★ Go Pro — unlock everything"
            tone="pro"
            onPress={() => nav.navigate("Paywall", { reason: "progress" })}
          />
        )}

        {perPhase.map(({ phase, done }) => (
          <Card key={phase.slug} onPress={() => nav.navigate("Phase", { phaseNum: phase.num })}>
            <Text style={typography.body}>
              {String(phase.num).padStart(2, "0")} · {phase.title}
            </Text>
            <View style={{ marginTop: spacing.sm }}>
              <ProgressBar value={phase.lesson_count ? done / phase.lesson_count : 0} />
              <Text style={[typography.muted, { marginTop: 4 }]}>
                {done}/{phase.lesson_count}
              </Text>
            </View>
          </Card>
        ))}
        <View style={{ alignItems: "center", marginTop: spacing.md }}>
          <Button title="Settings & privacy" tone="ghost" onPress={() => nav.navigate("Settings")} />
        </View>
      </ScrollView>
      <BannerAdView />
    </Screen>
  );
}
