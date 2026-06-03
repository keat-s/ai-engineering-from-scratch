#!/usr/bin/env python3
"""Build the bundled content payload consumed by the mobile app.

Walks every `phases/NN-slug/MM-slug/` lesson directory and emits a single JSON
document the Expo / React Native app ships in its asset bundle so the whole
curriculum works offline. For each lesson we capture metadata (title, motto,
type, languages, time, objectives), the full lesson markdown body, and any
quiz questions.

Free / Pro gating lives here as the single source of truth: phases listed in
FREE_PHASES are unlocked for everyone (ad-supported); every other phase is a
Pro entitlement. The app reads the `free` flag per phase rather than
hard-coding phase numbers in two places.

Usage:
    python3 scripts/build_mobile_content.py            # write mobile/assets/content/curriculum.json
    python3 scripts/build_mobile_content.py --stdout   # write to stdout, touch nothing
    python3 scripts/build_mobile_content.py --pretty    # human-readable indentation

Stdlib only. Python 3.10+.
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path
from typing import Iterable

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _lib import parse_frontmatter as _parse_frontmatter  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
PHASES_DIR = ROOT / "phases"
DEFAULT_OUT = ROOT / "mobile" / "assets" / "content" / "curriculum.json"

# Phases everyone can read for free (ad-supported). Everything else is Pro.
# Keep this in sync with the paywall copy in mobile/MONETIZATION.md.
FREE_PHASES = {0, 1, 2}

PHASE_DIR_RE = re.compile(r"^([0-9]{2})-([a-z0-9][a-z0-9-]*)$")
LESSON_DIR_RE = re.compile(r"^([0-9]{2})-([a-z0-9][a-z0-9-]*)$")
H1_RE = re.compile(r"^#\s+(.+?)\s*$", re.MULTILINE)
MOTTO_RE = re.compile(r"^>\s*(.+?)\s*$", re.MULTILINE)
META_RE = re.compile(r"^\*\*(Type|Languages|Prerequisites|Time)\:\*\*\s*(.+?)\s*$", re.MULTILINE)
OBJECTIVES_RE = re.compile(
    r"^##\s+Learning Objectives\s*$\n(.*?)(?=^##\s)", re.MULTILINE | re.DOTALL
)

# Title-casing fixups, kept identical to scripts/build_catalog.py so phase
# titles render the same on web and mobile.
TITLE_FIXUPS = {
    "ai": "AI", "ml": "ML", "llm": "LLM", "llms": "LLMs", "nlp": "NLP",
    "rl": "RL", "mcp": "MCP", "rag": "RAG", "api": "API", "rlhf": "RLHF",
    "dpo": "DPO", "lora": "LoRA", "cnn": "CNN", "rnn": "RNN", "rnns": "RNNs",
    "cnns": "CNNs", "gpt": "GPT", "tfidf": "TF-IDF", "pos": "POS", "ner": "NER",
    "asr": "ASR", "tts": "TTS", "ios": "iOS", "lats": "LATS", "rewoo": "ReWoo",
    "htn": "HTN", "sft": "SFT",
}


def slug_to_title(slug: str) -> str:
    return " ".join(TITLE_FIXUPS.get(w, w.capitalize()) for w in slug.split("-"))


def parse_meta_block(text: str) -> dict[str, object]:
    """Pull the **Type:** / **Languages:** / **Time:** header fields."""
    out: dict[str, object] = {}
    for key, value in META_RE.findall(text):
        if key == "Languages":
            out["languages"] = [v.strip() for v in value.split(",") if v.strip()]
        else:
            out[key.lower()] = value.strip()
    return out


def parse_objectives(text: str) -> list[str]:
    match = OBJECTIVES_RE.search(text)
    if not match:
        return []
    bullets = []
    for line in match.group(1).splitlines():
        line = line.strip()
        if line.startswith(("- ", "* ")):
            bullets.append(line[2:].strip())
    return bullets


def parse_motto(text: str) -> str:
    match = MOTTO_RE.search(text)
    return match.group(1).strip() if match else ""


def load_quiz(quiz_path: Path) -> list[dict[str, object]]:
    if not quiz_path.is_file():
        return []
    try:
        data = json.loads(quiz_path.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, UnicodeDecodeError):
        return []
    questions = data.get("questions", []) if isinstance(data, dict) else []
    cleaned: list[dict[str, object]] = []
    for q in questions:
        if not isinstance(q, dict):
            continue
        cleaned.append({
            "stage": q.get("stage", "post"),
            "question": q.get("question", ""),
            "options": q.get("options", []),
            "correct": q.get("correct", 0),
            "explanation": q.get("explanation", ""),
        })
    return cleaned


def build_lesson(lesson_dir: Path, phase_num: int, free: bool) -> dict[str, object] | None:
    match = LESSON_DIR_RE.match(lesson_dir.name)
    if not match:
        return None
    docs_path = lesson_dir / "docs" / "en.md"
    quiz_path = lesson_dir / "quiz.json"
    text = ""
    if docs_path.is_file():
        try:
            text = docs_path.read_text(encoding="utf-8")
        except UnicodeDecodeError:
            text = ""
    quiz = load_quiz(quiz_path)
    if not text and not quiz:
        return None

    h1 = H1_RE.search(text)
    title = h1.group(1).strip() if h1 else slug_to_title(match.group(2))
    meta = parse_meta_block(text)
    return {
        "id": f"{phase_num:02d}-{match.group(1)}",
        "num": int(match.group(1)),
        "slug": lesson_dir.name,
        "title": title,
        "motto": parse_motto(text),
        "type": meta.get("type", "Learn"),
        "languages": meta.get("languages", []),
        "time": meta.get("time", ""),
        "prerequisites": meta.get("prerequisites", ""),
        "objectives": parse_objectives(text),
        "body": text,
        "quiz": quiz,
        "free": free,
        "path": lesson_dir.relative_to(ROOT).as_posix(),
    }


def iter_phase_dirs() -> Iterable[Path]:
    if not PHASES_DIR.is_dir():
        return
    for path in sorted(PHASES_DIR.iterdir()):
        if path.is_dir() and PHASE_DIR_RE.match(path.name):
            yield path


def build_phase(phase_dir: Path) -> dict[str, object]:
    match = PHASE_DIR_RE.match(phase_dir.name)
    assert match is not None
    num = int(match.group(1))
    free = num in FREE_PHASES
    lessons: list[dict[str, object]] = []
    for lesson_dir in sorted(phase_dir.iterdir()):
        if lesson_dir.is_dir():
            entry = build_lesson(lesson_dir, num, free)
            if entry is not None:
                lessons.append(entry)
    return {
        "num": num,
        "slug": phase_dir.name,
        "title": slug_to_title(match.group(2).replace(f"{match.group(1)}-", "")),
        "free": free,
        "lesson_count": len(lessons),
        "lessons": lessons,
    }


def build_content() -> dict[str, object]:
    phases = [build_phase(p) for p in iter_phase_dirs()]
    total_lessons = sum(p["lesson_count"] for p in phases)
    total_quizzes = sum(
        1 for p in phases for l in p["lessons"] if l["quiz"]
    )
    return {
        "schema_version": 1,
        "generated_for": "ai-engineering-from-scratch mobile app",
        "free_phases": sorted(FREE_PHASES),
        "totals": {
            "phases": len(phases),
            "lessons": total_lessons,
            "quizzes": total_quizzes,
            "free_lessons": sum(p["lesson_count"] for p in phases if p["free"]),
        },
        "phases": phases,
    }


def main(argv: list[str]) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--out", type=Path, default=DEFAULT_OUT)
    parser.add_argument("--stdout", action="store_true")
    parser.add_argument("--pretty", action="store_true", help="indent output")
    args = parser.parse_args(argv)

    content = build_content()
    payload = json.dumps(content, ensure_ascii=False, indent=2 if args.pretty else None)
    if not args.pretty:
        payload += "\n"

    if args.stdout:
        sys.stdout.write(payload)
        return 0

    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text(payload, encoding="utf-8")
    t = content["totals"]
    rel = args.out.relative_to(ROOT) if args.out.is_relative_to(ROOT) else args.out
    sys.stdout.write(f"mobile content: {rel}\n")
    sys.stdout.write(
        f"  phases={t['phases']} lessons={t['lessons']} quizzes={t['quizzes']} "
        f"free_lessons={t['free_lessons']} ({args.out.stat().st_size / 1024 / 1024:.1f} MB)\n"
    )
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
