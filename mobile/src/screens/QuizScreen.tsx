import React, { useMemo, useState } from "react";
import { ScrollView, Text, View, Pressable, StyleSheet } from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { getLesson } from "@/content";
import { usePurchases } from "@/monetization/PurchasesContext";
import { useProgress } from "@/state/ProgressContext";
import { Button, Card, Screen } from "@/components/ui";
import { colors, radius, spacing, typography } from "@/theme";
import type { RootStackParamList } from "@/navigation/types";

type Nav = NativeStackNavigationProp<RootStackParamList>;

// Free users get the first question as a taste; the full quiz is a Pro feature.
const FREE_PREVIEW_QUESTIONS = 1;

export function QuizScreen() {
  const nav = useNavigation<Nav>();
  const { params } = useRoute<RouteProp<RootStackParamList, "Quiz">>();
  const found = getLesson(params.lessonId);
  const { isPro } = usePurchases();
  const { setQuizScore } = useProgress();

  const questions = found?.lesson.quiz ?? [];
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);

  const score = useMemo(() => {
    if (!questions.length) return 0;
    const correct = questions.reduce(
      (acc, q, i) => acc + (answers[i] === q.correct ? 1 : 0),
      0,
    );
    return correct / questions.length;
  }, [answers, questions]);

  if (!found || questions.length === 0) {
    return (
      <Screen>
        <Text style={[typography.body, { padding: spacing.lg }]}>
          No quiz for this lesson.
        </Text>
      </Screen>
    );
  }

  const visibleCount = isPro ? questions.length : FREE_PREVIEW_QUESTIONS;

  function submit() {
    setSubmitted(true);
    setQuizScore(found!.lesson.id, score);
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxl }}>
        <Text style={typography.h1}>{found.lesson.title}</Text>
        <Text style={[typography.muted, { marginTop: 4 }]}>
          {questions.length} questions · check your understanding
        </Text>

        {questions.slice(0, visibleCount).map((q, qi) => {
          const chosen = answers[qi];
          return (
            <Card key={qi} style={{ marginTop: spacing.lg }}>
              <Text style={[typography.body, { fontWeight: "700" }]}>
                {qi + 1}. {q.question}
              </Text>
              <View style={{ marginTop: spacing.sm, gap: spacing.sm }}>
                {q.options.map((opt, oi) => {
                  const isChosen = chosen === oi;
                  const isCorrect = q.correct === oi;
                  let border = colors.border;
                  let bg = colors.surfaceAlt;
                  if (submitted) {
                    if (isCorrect) {
                      border = colors.success;
                      bg = "#3ad29f22";
                    } else if (isChosen) {
                      border = colors.danger;
                      bg = "#ff547022";
                    }
                  } else if (isChosen) {
                    border = colors.accent;
                    bg = colors.accentSoft;
                  }
                  return (
                    <Pressable
                      key={oi}
                      disabled={submitted}
                      onPress={() => setAnswers((a) => ({ ...a, [qi]: oi }))}
                      style={[styles.option, { borderColor: border, backgroundColor: bg }]}
                    >
                      <Text style={typography.body}>{opt}</Text>
                    </Pressable>
                  );
                })}
              </View>
              {submitted ? (
                <Text style={[typography.muted, { marginTop: spacing.sm }]}>
                  {chosen === q.correct ? "✓ Correct. " : "✗ "}
                  {q.explanation}
                </Text>
              ) : null}
            </Card>
          );
        })}

        {!isPro && questions.length > FREE_PREVIEW_QUESTIONS && (
          <Card style={{ marginTop: spacing.lg, borderColor: colors.pro }}>
            <Text style={{ color: colors.pro, fontWeight: "800" }}>
              ★ {questions.length - FREE_PREVIEW_QUESTIONS} more questions in Pro
            </Text>
            <Text style={[typography.muted, { marginTop: 6 }]}>
              Unlock the full quiz bank for every lesson, plus saved scores and progress.
            </Text>
            <Button
              title="Unlock quizzes with Pro"
              tone="pro"
              style={{ marginTop: spacing.md }}
              onPress={() => nav.navigate("Paywall", { reason: "quiz" })}
            />
          </Card>
        )}

        {isPro &&
          (submitted ? (
            <Card style={{ marginTop: spacing.lg }}>
              <Text style={[typography.h2, { color: colors.accent }]}>
                Score: {Math.round(score * 100)}%
              </Text>
            </Card>
          ) : (
            <Button
              title="Submit answers"
              style={{ marginTop: spacing.lg }}
              disabled={Object.keys(answers).length < visibleCount}
              onPress={submit}
            />
          ))}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  option: {
    borderWidth: 1,
    borderRadius: radius.sm,
    padding: spacing.md,
  },
});
