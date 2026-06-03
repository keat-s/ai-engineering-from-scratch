import type { Curriculum, Lesson, Phase } from "@/types";

// The bundled, offline-first curriculum payload. Regenerate with
// `python3 scripts/build_mobile_content.py` (or `npm run content`).
import raw from "../../assets/content/curriculum.json";

export const curriculum = raw as unknown as Curriculum;

export const phases: Phase[] = curriculum.phases;

const lessonById = new Map<string, { lesson: Lesson; phase: Phase }>();
for (const phase of phases) {
  for (const lesson of phase.lessons) {
    lessonById.set(lesson.id, { lesson, phase });
  }
}

export function getPhase(num: number): Phase | undefined {
  return phases.find((p) => p.num === num);
}

export function getLesson(id: string): { lesson: Lesson; phase: Phase } | undefined {
  return lessonById.get(id);
}

export function allLessons(): Lesson[] {
  return phases.flatMap((p) => p.lessons);
}

export const totals = curriculum.totals;
export const freePhaseNums = new Set(curriculum.free_phases);
