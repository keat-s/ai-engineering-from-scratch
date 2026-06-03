export interface QuizQuestion {
  stage: "pre" | "post" | string;
  question: string;
  options: string[];
  correct: number;
  explanation: string;
}

export interface Lesson {
  id: string;
  num: number;
  slug: string;
  title: string;
  motto: string;
  type: string;
  languages: string[];
  time: string;
  prerequisites: string;
  objectives: string[];
  body: string;
  quiz: QuizQuestion[];
  free: boolean;
  path: string;
}

export interface Phase {
  num: number;
  slug: string;
  title: string;
  free: boolean;
  lesson_count: number;
  lessons: Lesson[];
}

export interface Curriculum {
  schema_version: number;
  generated_for: string;
  free_phases: number[];
  totals: {
    phases: number;
    lessons: number;
    quizzes: number;
    free_lessons: number;
  };
  phases: Phase[];
}
