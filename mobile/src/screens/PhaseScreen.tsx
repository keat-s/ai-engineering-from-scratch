import React, { useLayoutEffect } from "react";
import { FlatList, Text, View, StyleSheet } from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { getPhase } from "@/content";
import { usePurchases } from "@/monetization/PurchasesContext";
import { useProgress } from "@/state/ProgressContext";
import { BannerAdView } from "@/monetization/BannerAdView";
import { Card, Pill, Screen } from "@/components/ui";
import { colors, spacing, typography } from "@/theme";
import type { RootStackParamList } from "@/navigation/types";

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function PhaseScreen() {
  const nav = useNavigation<Nav>();
  const { params } = useRoute<RouteProp<RootStackParamList, "Phase">>();
  const phase = getPhase(params.phaseNum);
  const { isPro } = usePurchases();
  const { isComplete } = useProgress();

  useLayoutEffect(() => {
    nav.setOptions({ title: phase ? `Phase ${phase.num}` : "Phase" });
  }, [nav, phase]);

  if (!phase) {
    return (
      <Screen>
        <Text style={[typography.body, { padding: spacing.lg }]}>Phase not found.</Text>
      </Screen>
    );
  }

  return (
    <Screen>
      <FlatList
        data={phase.lessons}
        keyExtractor={(l) => l.id}
        contentContainerStyle={{ padding: spacing.lg, gap: spacing.sm }}
        ListHeaderComponent={
          <View style={{ marginBottom: spacing.sm }}>
            <Text style={typography.h1}>{phase.title}</Text>
            <Text style={[typography.muted, { marginTop: 4 }]}>
              {phase.lesson_count} lessons{phase.free ? " · free" : " · Pro"}
            </Text>
          </View>
        }
        renderItem={({ item: lesson }) => {
          const locked = !lesson.free && !isPro;
          const done = isComplete(lesson.id);
          return (
            <Card onPress={() => nav.navigate("Lesson", { lessonId: lesson.id })}>
              <View style={styles.row}>
                <Text style={styles.num}>{String(lesson.num).padStart(2, "0")}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={typography.body}>
                    {done ? "✓ " : ""}
                    {lesson.title}
                  </Text>
                  {lesson.motto ? (
                    <Text style={[typography.muted, { marginTop: 2 }]} numberOfLines={1}>
                      {lesson.motto}
                    </Text>
                  ) : null}
                  <View style={styles.tags}>
                    <Pill label={lesson.type || "Learn"} tone="accent" />
                    {lesson.quiz.length ? (
                      <Pill label={`${lesson.quiz.length} quiz`} tone="muted" />
                    ) : null}
                    {lesson.time ? <Pill label={lesson.time} tone="muted" /> : null}
                  </View>
                </View>
                {locked ? <Pill label="🔒" tone="pro" /> : null}
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
  row: { flexDirection: "row", alignItems: "flex-start", gap: spacing.md },
  num: { fontSize: 16, fontWeight: "800", color: colors.accent, width: 26, marginTop: 1 },
  tags: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: spacing.sm },
});
