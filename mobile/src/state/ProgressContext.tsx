import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const STORAGE_KEY = "@aiefs/progress/v1";

interface ProgressData {
  /** lesson ids the user marked complete */
  completed: Record<string, boolean>;
  /** best quiz score per lesson id, 0..1 */
  quizScores: Record<string, number>;
}

interface ProgressState extends ProgressData {
  toggleComplete: (lessonId: string) => void;
  setQuizScore: (lessonId: string, score: number) => void;
  isComplete: (lessonId: string) => boolean;
  completedCount: number;
}

const empty: ProgressData = { completed: {}, quizScores: {} };
const ProgressContext = createContext<ProgressState | null>(null);

export function ProgressProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<ProgressData>(empty);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) setData({ ...empty, ...JSON.parse(raw) });
      } catch (err) {
        console.warn("[progress] load failed", err);
      }
    })();
  }, []);

  const persist = useCallback((next: ProgressData) => {
    setData(next);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch((err) =>
      console.warn("[progress] save failed", err),
    );
  }, []);

  const toggleComplete = useCallback(
    (lessonId: string) => {
      const completed = { ...data.completed };
      if (completed[lessonId]) delete completed[lessonId];
      else completed[lessonId] = true;
      persist({ ...data, completed });
    },
    [data, persist],
  );

  const setQuizScore = useCallback(
    (lessonId: string, score: number) => {
      const prev = data.quizScores[lessonId] ?? 0;
      persist({
        ...data,
        quizScores: { ...data.quizScores, [lessonId]: Math.max(prev, score) },
      });
    },
    [data, persist],
  );

  const value = useMemo<ProgressState>(
    () => ({
      ...data,
      toggleComplete,
      setQuizScore,
      isComplete: (id) => Boolean(data.completed[id]),
      completedCount: Object.keys(data.completed).length,
    }),
    [data, toggleComplete, setQuizScore],
  );

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}

export function useProgress(): ProgressState {
  const ctx = useContext(ProgressContext);
  if (!ctx) throw new Error("useProgress must be used within a ProgressProvider");
  return ctx;
}
