import React, { useEffect, useLayoutEffect } from "react";
import { ScrollView, Text, View, StyleSheet } from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import Markdown from "react-native-markdown-display";

import { getLesson } from "@/content";
import { usePurchases } from "@/monetization/PurchasesContext";
import { useProgress } from "@/state/ProgressContext";
import { maybeShowInterstitialOnLessonOpen } from "@/monetization/interstitial";
import { BannerAdView } from "@/monetization/BannerAdView";
import { Button, Card, Pill, Screen } from "@/components/ui";
import { colors, spacing, typography } from "@/theme";
import type { RootStackParamList } from "@/navigation/types";

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function LessonScreen() {
  const nav = useNavigation<Nav>();
  const { params } = useRoute<RouteProp<RootStackParamList, "Lesson">>();
  const found = getLesson(params.lessonId);
  const { isPro } = usePurchases();
  const { isComplete, toggleComplete } = useProgress();

  const lesson = found?.lesson;
  const locked = lesson ? !lesson.free && !isPro : false;

  useLayoutEffect(() => {
    nav.setOptions({ title: lesson ? `${String(lesson.num).padStart(2, "0")}` : "" });
  }, [nav, lesson]);

  // Free-tier interstitial at a natural transition point (lesson open).
  useEffect(() => {
    if (lesson && !locked) maybeShowInterstitialOnLessonOpen(isPro);
  }, [lesson, locked, isPro]);

  if (!lesson) {
    return (
      <Screen>
        <Text style={[typography.body, { padding: spacing.lg }]}>Lesson not found.</Text>
      </Screen>
    );
  }

  const done = isComplete(lesson.id);

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxl }}>
        <Text style={typography.h1}>{lesson.title}</Text>
        {lesson.motto ? (
          <Text style={[styles.motto]}>&ldquo;{lesson.motto}&rdquo;</Text>
        ) : null}
        <View style={styles.tags}>
          <Pill label={lesson.type || "Learn"} tone="accent" />
          {lesson.languages.map((l) => (
            <Pill key={l} label={l} tone="muted" />
          ))}
          {lesson.time ? <Pill label={lesson.time} tone="muted" /> : null}
        </View>

        {lesson.objectives.length > 0 && (
          <Card style={{ marginTop: spacing.lg }}>
            <Text style={typography.label}>YOU WILL BE ABLE TO</Text>
            {lesson.objectives.map((o, i) => (
              <Text key={i} style={[typography.body, { marginTop: 6 }]}>
                ◦ {o}
              </Text>
            ))}
          </Card>
        )}

        {locked ? (
          <Card style={{ marginTop: spacing.lg, borderColor: colors.pro }}>
            <Text style={{ color: colors.pro, fontWeight: "800", fontSize: 16 }}>
              🔒 This lesson is part of Pro
            </Text>
            <Text style={[typography.muted, { marginTop: 6 }]}>
              Phases 0–2 are free. Unlock all lessons, every quiz, offline reading, and an
              ad-free experience with Pro.
            </Text>
            <Button
              title="Unlock with Pro"
              tone="pro"
              style={{ marginTop: spacing.md }}
              onPress={() => nav.navigate("Paywall", { reason: `lesson:${lesson.id}` })}
            />
          </Card>
        ) : (
          <>
            <View style={{ marginTop: spacing.lg }}>
              <Markdown style={markdownStyles}>{lesson.body || "_No content._"}</Markdown>
            </View>

            <View style={{ gap: spacing.sm, marginTop: spacing.lg }}>
              {lesson.quiz.length > 0 && (
                <Button
                  title={`Take the quiz (${lesson.quiz.length} questions)`}
                  onPress={() => nav.navigate("Quiz", { lessonId: lesson.id })}
                />
              )}
              <Button
                title={done ? "✓ Completed — tap to undo" : "Mark as complete"}
                tone={done ? "ghost" : "accent"}
                onPress={() => toggleComplete(lesson.id)}
              />
            </View>
          </>
        )}
      </ScrollView>
      <BannerAdView />
    </Screen>
  );
}

const styles = StyleSheet.create({
  motto: {
    fontStyle: "italic",
    color: colors.textMuted,
    marginTop: spacing.sm,
    fontSize: 15,
  },
  tags: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: spacing.md },
});

// react-native-markdown-display style map, themed to match the app.
const markdownStyles = {
  body: { color: colors.text, fontSize: 15, lineHeight: 23 },
  heading1: { color: colors.text, fontSize: 22, fontWeight: "800", marginTop: 18, marginBottom: 8 },
  heading2: { color: colors.text, fontSize: 19, fontWeight: "700", marginTop: 16, marginBottom: 6 },
  heading3: { color: colors.text, fontSize: 16, fontWeight: "700", marginTop: 12, marginBottom: 4 },
  link: { color: colors.accent },
  blockquote: {
    backgroundColor: colors.surface,
    borderLeftColor: colors.accent,
    borderLeftWidth: 3,
    paddingHorizontal: 12,
    paddingVertical: 6,
    color: colors.textMuted,
  },
  code_inline: {
    backgroundColor: colors.surfaceAlt,
    color: colors.success,
    borderRadius: 4,
    paddingHorizontal: 4,
  },
  code_block: {
    backgroundColor: colors.surface,
    color: colors.text,
    borderRadius: 8,
    padding: 12,
  },
  fence: {
    backgroundColor: colors.surface,
    color: colors.text,
    borderRadius: 8,
    padding: 12,
  },
  table: { borderColor: colors.border },
  th: { color: colors.text },
  td: { color: colors.text },
  bullet_list: { color: colors.text },
  ordered_list: { color: colors.text },
} as const;
