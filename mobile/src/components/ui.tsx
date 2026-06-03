import React from "react";
import { Text, View, StyleSheet, ViewStyle, TextStyle, Pressable } from "react-native";

import { colors, radius, spacing } from "@/theme";

export function Pill({
  label,
  tone = "muted",
}: {
  label: string;
  tone?: "muted" | "accent" | "pro" | "success" | "locked";
}) {
  const bg = {
    muted: colors.surfaceAlt,
    accent: colors.accentSoft,
    pro: "#f5b33322",
    success: "#3ad29f22",
    locked: "#6b6b7b22",
  }[tone];
  const fg = {
    muted: colors.textMuted,
    accent: colors.accent,
    pro: colors.pro,
    success: colors.success,
    locked: colors.locked,
  }[tone];
  return (
    <View style={[styles.pill, { backgroundColor: bg }]}>
      <Text style={[styles.pillText, { color: fg }]}>{label}</Text>
    </View>
  );
}

export function Card({
  children,
  style,
  onPress,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
}) {
  const content = <View style={[styles.card, style]}>{children}</View>;
  if (!onPress) return content;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [{ opacity: pressed ? 0.85 : 1 }]}
    >
      {content}
    </Pressable>
  );
}

export function Button({
  title,
  onPress,
  tone = "accent",
  disabled,
  style,
}: {
  title: string;
  onPress?: () => void;
  tone?: "accent" | "pro" | "ghost";
  disabled?: boolean;
  style?: ViewStyle;
}) {
  const bg = tone === "ghost" ? "transparent" : tone === "pro" ? colors.pro : colors.accent;
  const fg = tone === "pro" ? "#1a1a1a" : tone === "ghost" ? colors.accent : "#fff";
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: bg,
          borderWidth: tone === "ghost" ? 1 : 0,
          borderColor: colors.accent,
          opacity: disabled ? 0.5 : pressed ? 0.85 : 1,
        },
        style,
      ]}
    >
      <Text style={[styles.buttonText, { color: fg }]}>{title}</Text>
    </Pressable>
  );
}

export function ProgressBar({ value }: { value: number }) {
  return (
    <View style={styles.track}>
      <View style={[styles.fill, { width: `${Math.round(value * 100)}%` }]} />
    </View>
  );
}

export function Screen({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return <View style={[styles.screen, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  pill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.pill,
    alignSelf: "flex-start",
  },
  pillText: { fontSize: 11, fontWeight: "700", letterSpacing: 0.3 } as TextStyle,
  button: {
    paddingVertical: 14,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: { fontSize: 15, fontWeight: "700" },
  track: {
    height: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceAlt,
    overflow: "hidden",
  },
  fill: { height: 6, backgroundColor: colors.accent, borderRadius: radius.pill },
});
