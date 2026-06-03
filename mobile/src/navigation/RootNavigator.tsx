import React from "react";
import { Text } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";

import { colors } from "@/theme";
import type { RootStackParamList, TabParamList } from "@/navigation/types";
import { HomeScreen } from "@/screens/HomeScreen";
import { PhaseScreen } from "@/screens/PhaseScreen";
import { LessonScreen } from "@/screens/LessonScreen";
import { QuizScreen } from "@/screens/QuizScreen";
import { ProgressScreen } from "@/screens/ProgressScreen";
import { PaywallScreen } from "@/screens/PaywallScreen";
import { SettingsScreen } from "@/screens/SettingsScreen";

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

const screenHeader = {
  headerStyle: { backgroundColor: colors.bg },
  headerTintColor: colors.text,
  headerTitleStyle: { fontWeight: "800" as const },
  contentStyle: { backgroundColor: colors.bg },
};

function tabIcon(symbol: string) {
  return ({ color }: { color: string }) => (
    <Text style={{ color, fontSize: 18 }}>{symbol}</Text>
  );
}

function Tabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        ...screenHeader,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textMuted,
      }}
    >
      <Tab.Screen
        name="Learn"
        component={HomeScreen}
        options={{ title: "Learn", tabBarIcon: tabIcon("◆") }}
      />
      <Tab.Screen
        name="Progress"
        component={ProgressScreen}
        options={{ title: "Progress", tabBarIcon: tabIcon("▣") }}
      />
      <Tab.Screen
        name="Pro"
        component={PaywallScreen}
        options={{ title: "Pro", tabBarIcon: tabIcon("★") }}
      />
    </Tab.Navigator>
  );
}

export function RootNavigator() {
  return (
    <Stack.Navigator screenOptions={screenHeader}>
      <Stack.Screen name="Tabs" component={Tabs} options={{ headerShown: false }} />
      <Stack.Screen name="Phase" component={PhaseScreen} options={{ title: "Phase" }} />
      <Stack.Screen name="Lesson" component={LessonScreen} options={{ title: "" }} />
      <Stack.Screen name="Quiz" component={QuizScreen} options={{ title: "Quiz" }} />
      <Stack.Screen
        name="Paywall"
        component={PaywallScreen}
        options={{ title: "Go Pro", presentation: "modal" }}
      />
      <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: "Settings" }} />
    </Stack.Navigator>
  );
}
