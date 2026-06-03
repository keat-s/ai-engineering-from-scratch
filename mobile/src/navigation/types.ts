export type RootStackParamList = {
  Tabs: undefined;
  Phase: { phaseNum: number };
  Lesson: { lessonId: string };
  Quiz: { lessonId: string };
  Paywall: { reason?: string } | undefined;
  Settings: undefined;
};

export type TabParamList = {
  Learn: undefined;
  Progress: undefined;
  Pro: undefined;
};
