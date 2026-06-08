// Renders faithful mockups of the app's key screens to PNG using the EXACT
// theme tokens from mobile/src/theme.ts and real content from the bundled
// curriculum.json. Layout mirrors the React Native screens 1:1 (header, cards,
// pills, progress bars, bottom tab bar, banner ad strip, paywall).
const fs = require("fs");
const path = require("path");
const { Resvg } = require("@resvg/resvg-js");

const ROOT = path.resolve(__dirname, "..", "..");
const OUT = path.join(ROOT, "mobile/assets/mockups");
fs.mkdirSync(OUT, { recursive: true });

const curriculum = JSON.parse(
  fs.readFileSync(path.join(ROOT, "mobile/assets/content/curriculum.json"), "utf8")
);

// --- theme tokens (mirror src/theme.ts) ---
const C = {
  bg: "#0b0b0f", surface: "#15151c", surfaceAlt: "#1d1d27", border: "#2a2a36",
  text: "#fafaf5", textMuted: "#a0a0b0", accent: "#3553ff", pro: "#f5b333",
  success: "#3ad29f", danger: "#ff5470", locked: "#6b6b7b",
};
const SANS = "Liberation Sans, sans-serif";
const MONO = "Liberation Mono, monospace";

const W = 390, H = 844, SCALE = 2;

// --- tiny SVG helpers ---
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
function trunc(s, n) { s = String(s); return s.length > n ? s.slice(0, n - 1) + "…" : s; }
function rrect(x, y, w, h, r, fill, opts = {}) {
  const stroke = opts.stroke ? ` stroke="${opts.stroke}" stroke-width="${opts.sw || 1}"` : "";
  const op = opts.opacity != null ? ` fill-opacity="${opts.opacity}"` : "";
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" ry="${r}" fill="${fill}"${op}${stroke}/>`;
}
function text(x, y, s, opts = {}) {
  const size = opts.size || 14;
  const fill = opts.fill || C.text;
  const weight = opts.weight || "400";
  const family = opts.mono ? MONO : SANS;
  const anchor = opts.anchor ? ` text-anchor="${opts.anchor}"` : "";
  const ls = opts.ls ? ` letter-spacing="${opts.ls}"` : "";
  const style = opts.italic ? ` font-style="italic"` : "";
  return `<text x="${x}" y="${y}" font-family="${family}" font-size="${size}" font-weight="${weight}" fill="${fill}"${anchor}${ls}${style}>${esc(s)}</text>`;
}
function pill(x, y, label, fg, bg) {
  const w = 13 + label.length * 6.6;
  return rrect(x, y, w, 19, 9.5, bg, { opacity: 0.16 }) +
    text(x + w / 2, y + 13.5, label, { size: 10.5, fill: fg, weight: "700", anchor: "middle", ls: 0.3 }) +
    `<!--w:${w}-->`;
}
function pillWidth(label) { return 13 + label.length * 6.6; }
function progress(x, y, w, frac, color = C.accent) {
  return rrect(x, y, w, 6, 3, C.surfaceAlt) + rrect(x, y, Math.max(0, w * frac), 6, 3, color);
}

function statusBar() {
  return text(24, 30, "9:41", { size: 13, weight: "700", fill: C.text }) +
    text(W - 24, 30, "5G  100%", { size: 11, fill: C.textMuted, anchor: "end" });
}
function tabBar(active) {
  const y = H - 64;
  const tabs = [["◆", "Learn"], ["▣", "Progress"], ["★", "Pro"]];
  let s = rrect(0, y, W, 64, 0, C.surface) + `<line x1="0" y1="${y}" x2="${W}" y2="${y}" stroke="${C.border}" stroke-width="1"/>`;
  tabs.forEach(([ic, label], i) => {
    const cx = W / (tabs.length * 2) * (i * 2 + 1);
    const col = i === active ? C.accent : C.textMuted;
    s += text(cx, y + 26, ic, { size: 18, fill: col, anchor: "middle" });
    s += text(cx, y + 46, label, { size: 11, fill: col, anchor: "middle", weight: i === active ? "700" : "400" });
  });
  return s;
}
function bannerAd(yTop) {
  const y = yTop;
  return rrect(0, y, W, 52, 0, "#0e0e14") +
    `<line x1="0" y1="${y}" x2="${W}" y2="${y}" stroke="${C.border}" stroke-width="1"/>` +
    rrect(70, y + 9, W - 140, 34, 4, C.surfaceAlt, { stroke: C.border }) +
    text(W / 2, y + 25, "AdMob banner — free tier", { size: 11, fill: C.textMuted, anchor: "middle" }) +
    text(W / 2, y + 38, "(hidden for Pro users)", { size: 9, fill: C.locked, anchor: "middle" }) +
    text(20, y + 30, "Ad", { size: 9, fill: C.locked });
}
function header(title, opts = {}) {
  let s = "";
  if (opts.back) s += text(20, 60, "‹", { size: 30, fill: C.text, weight: "700" });
  s += text(opts.back ? 44 : 24, 58, title, { size: opts.size || 17, weight: "800", fill: C.text });
  return s;
}

function frame(inner) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">` +
    rrect(0, 0, W, H, 0, C.bg) + statusBar() + inner + `</svg>`;
}

function render(name, svg) {
  const r = new Resvg(svg, {
    fitTo: { mode: "width", value: W * SCALE },
    font: { loadSystemFonts: true, defaultFontFamily: "Liberation Sans" },
    background: C.bg,
  });
  const png = r.render().asPng();
  const file = path.join(OUT, name);
  fs.writeFileSync(file, png);
  console.log("wrote", path.relative(ROOT, file), `(${(png.length / 1024).toFixed(0)} KB)`);
}

// ============================ SCREEN 1: LEARN / HOME ============================
{
  let s = header("AI Engineering from Scratch", { size: 18 });
  s += text(24, 78, `${curriculum.totals.lessons} lessons · ${curriculum.totals.phases} phases · build it by hand`, { size: 12, fill: C.textMuted });

  // Pro upsell card
  let y = 96;
  s += rrect(20, y, W - 40, 66, 12, C.surface, { stroke: C.pro });
  s += text(36, y + 26, "★ Unlock everything", { size: 14, fill: C.pro, weight: "800" });
  s += text(36, y + 46, "Phases 0–2 are free. Go Pro for all 503 lessons,", { size: 11.5, fill: C.textMuted });
  s += text(36, y + 60, "every quiz, offline access, and no ads.", { size: 11.5, fill: C.textMuted });

  // Phase cards
  y += 82;
  const phases = curriculum.phases.slice(0, 4);
  const fakeDone = [9, 7, 0, 0];
  phases.forEach((p, i) => {
    const ch = 96;
    s += rrect(20, y, W - 40, ch, 12, C.surface, { stroke: C.border });
    s += text(34, y + 32, String(p.num).padStart(2, "0"), { size: 22, fill: C.accent, weight: "800", mono: true });
    s += text(78, y + 26, trunc(p.title, 24), { size: 17, fill: C.text, weight: "700" });
    s += text(78, y + 45, `${p.lesson_count} lessons`, { size: 12, fill: C.textMuted });
    const badge = p.free ? ["FREE", C.success] : ["🔒 PRO", C.pro];
    const bw = pillWidth(badge[0]);
    s += pill(W - 40 - bw - 4, y + 16, badge[0], badge[1], badge[1]);
    const frac = p.lesson_count ? fakeDone[i] / p.lesson_count : 0;
    s += progress(34, y + 64, W - 68, frac);
    s += text(34, y + 84, `${fakeDone[i]}/${p.lesson_count} complete`, { size: 11, fill: C.textMuted });
    y += ch + 12;
  });

  s += bannerAd(H - 64 - 52);
  s += tabBar(0);
  render("01-learn-home.png", frame(s));
}

// ============================ SCREEN 2: LESSON (unlocked) ============================
{
  const phase = curriculum.phases[1]; // Math Foundations (free)
  const lesson = phase.lessons[0]; // Linear Algebra Intuition
  let s = header(String(lesson.num).padStart(2, "0"), { back: true });
  let y = 96;
  s += text(24, y, trunc(lesson.title, 28), { size: 24, weight: "800", fill: C.text });
  y += 26;
  s += text(24, y, "“" + trunc(lesson.motto, 46) + "”", { size: 14, fill: C.textMuted, italic: true });
  y += 26;
  // tag pills
  let px = 24;
  for (const [lab, col] of [[lesson.type || "Learn", C.accent], ...lesson.languages.slice(0, 2).map((l) => [l, C.textMuted]), [lesson.time, C.textMuted]]) {
    if (!lab) continue;
    s += pill(px, y, lab, col, col); px += pillWidth(lab) + 8;
  }
  y += 34;
  // objectives card
  const objs = lesson.objectives.slice(0, 3);
  const oh = 30 + objs.length * 30;
  s += rrect(20, y, W - 40, oh, 12, C.surface, { stroke: C.border });
  s += text(36, y + 24, "YOU WILL BE ABLE TO", { size: 11, fill: C.textMuted, weight: "700", ls: 0.5 });
  objs.forEach((o, i) => { s += text(36, y + 48 + i * 28, "◦ " + trunc(o, 44), { size: 12.5, fill: C.text }); });
  y += oh + 16;
  // body snippet (markdown rendered look)
  s += text(24, y, "The Concept", { size: 19, weight: "700", fill: C.text }); y += 24;
  const para = "A vector is just a list of numbers. But those numbers mean something — they're coordinates in space. In AI, vectors represent everything: a word becomes 768 numbers, an image becomes pixels.";
  const words = para.split(" "); let line = ""; const lines = [];
  for (const w of words) { if ((line + w).length > 48) { lines.push(line); line = ""; } line += w + " "; }
  if (line.trim()) lines.push(line);
  lines.slice(0, 4).forEach((l, i) => { s += text(24, y + i * 22, l.trim(), { size: 14, fill: C.text }); });
  y += lines.slice(0, 4).length * 22 + 8;
  // code block
  s += rrect(20, y, W - 40, 52, 8, C.surface, { stroke: C.border });
  s += text(34, y + 22, "def dot(a, b):", { size: 12.5, fill: C.success, mono: true });
  s += text(34, y + 40, "    return sum(x*y for x,y in zip(a,b))", { size: 12.5, fill: C.text, mono: true });
  y += 68;
  // buttons
  s += rrect(20, y, W - 40, 48, 12, C.accent);
  s += text(W / 2, y + 30, "Take the quiz (5 questions)", { size: 15, fill: "#fff", weight: "700", anchor: "middle" });
  y += 56;
  s += rrect(20, y, W - 40, 48, 12, "transparent", { stroke: C.accent });
  s += text(W / 2, y + 30, "Mark as complete", { size: 15, fill: C.accent, weight: "700", anchor: "middle" });

  s += bannerAd(H - 52);
  render("02-lesson.png", frame(s));
}

// ============================ SCREEN 3: LESSON LOCKED (Pro gate) ============================
{
  const phase = curriculum.phases[7]; // a Pro phase
  const lesson = phase.lessons[0];
  let s = header(String(lesson.num).padStart(2, "0"), { back: true });
  let y = 96;
  s += text(24, y, trunc(lesson.title, 26), { size: 24, weight: "800", fill: C.text }); y += 26;
  if (lesson.motto) { s += text(24, y, "“" + trunc(lesson.motto, 46) + "”", { size: 14, fill: C.textMuted, italic: true }); y += 26; }
  let px = 24;
  for (const [lab, col] of [[lesson.type || "Learn", C.accent], [lesson.time || "~60 min", C.textMuted]]) {
    s += pill(px, y, lab, col, col); px += pillWidth(lab) + 8;
  }
  y += 40;
  // lock card
  const ch = 168;
  s += rrect(20, y, W - 40, ch, 12, C.surface, { stroke: C.pro });
  s += text(W / 2, y + 60, "🔒", { size: 40, anchor: "middle" });
  s += text(W / 2, y + 92, "This lesson is part of Pro", { size: 16, fill: C.pro, weight: "800", anchor: "middle" });
  s += text(W / 2, y + 114, "Phases 0–2 are free. Unlock all lessons,", { size: 12, fill: C.textMuted, anchor: "middle" });
  s += text(W / 2, y + 130, "quizzes, offline reading, and no ads.", { size: 12, fill: C.textMuted, anchor: "middle" });
  s += rrect(36, y + ch - 4, W - 72, 0, 0, "transparent");
  y += ch + 12;
  s += rrect(20, y, W - 40, 48, 12, C.pro);
  s += text(W / 2, y + 30, "Unlock with Pro", { size: 15, fill: "#1a1a1a", weight: "800", anchor: "middle" });

  s += bannerAd(H - 52);
  render("03-lesson-locked.png", frame(s));
}

// ============================ SCREEN 4: QUIZ ============================
{
  const lesson = curriculum.phases[1].lessons[0];
  const q = lesson.quiz[0];
  let s = header("Quiz", { back: true });
  let y = 92;
  s += text(24, y, trunc(lesson.title, 28), { size: 22, weight: "800", fill: C.text }); y += 22;
  s += text(24, y, `${lesson.quiz.length} questions · check your understanding`, { size: 12, fill: C.textMuted });
  y += 24;
  // question card
  const opts = q.options.slice(0, 4);
  const ch = 70 + opts.length * 50;
  s += rrect(20, y, W - 40, ch, 12, C.surface, { stroke: C.border });
  // wrap question
  const qw = ("1. " + q.question).split(" "); let line = ""; const qlines = [];
  for (const w of qw) { if ((line + w).length > 40) { qlines.push(line); line = ""; } line += w + " "; }
  if (line.trim()) qlines.push(line);
  qlines.slice(0, 2).forEach((l, i) => s += text(36, y + 26 + i * 18, l.trim(), { size: 13.5, fill: C.text, weight: "700" }));
  let oy = y + 26 + Math.min(qlines.length, 2) * 18 + 6;
  opts.forEach((opt, i) => {
    const sel = i === 1;
    s += rrect(36, oy, W - 72, 40, 8, sel ? C.accent : C.surfaceAlt, { opacity: sel ? 0.13 : 1, stroke: sel ? C.accent : C.border });
    s += text(48, oy + 25, trunc(opt, 40), { size: 12.5, fill: C.text });
    oy += 50;
  });
  y += ch + 14;
  // pro upsell
  s += rrect(20, y, W - 40, 84, 12, C.surface, { stroke: C.pro });
  s += text(36, y + 26, `★ ${lesson.quiz.length - 1} more questions in Pro`, { size: 13.5, fill: C.pro, weight: "800" });
  s += text(36, y + 46, "Unlock the full quiz bank for every lesson,", { size: 11.5, fill: C.textMuted });
  s += text(36, y + 60, "plus saved scores and progress.", { size: 11.5, fill: C.textMuted });
  y += 96;
  s += rrect(20, y, W - 40, 46, 12, C.pro);
  s += text(W / 2, y + 29, "Unlock quizzes with Pro", { size: 14, fill: "#1a1a1a", weight: "800", anchor: "middle" });
  render("04-quiz.png", frame(s));
}

// ============================ SCREEN 5: PAYWALL ============================
{
  let s = "";
  let y = 66;
  s += pill(24, y, "AI ENGINEERING FROM SCRATCH", C.accent, C.accent); y += 50;
  s += text(24, y, "Go Pro", { size: 30, weight: "800", fill: C.text }); y += 26;
  s += text(24, y, "Build all of it. No limits, no ads.", { size: 13, fill: C.textMuted }); y += 24;
  const benefits = ["All 503 lessons across 20 phases", "Every quiz, with saved scores", "Completely ad-free", "Offline reading — learn on the train", "One purchase, iPhone and Android"];
  const bh = 20 + benefits.length * 26;
  s += rrect(20, y, W - 40, bh, 12, C.surface, { stroke: C.border });
  benefits.forEach((b, i) => s += text(36, y + 28 + i * 26, "✓ " + b, { size: 13.5, fill: C.text }));
  y += bh + 16;
  const prices = [["Annual · best value", "$39.99 / yr", true], ["Monthly", "$6.99 / mo", false], ["Lifetime · one-time", "$79.99", false]];
  prices.forEach(([label, price, hl]) => {
    s += rrect(20, y, W - 40, 50, 12, hl ? C.pro : "transparent", { stroke: hl ? C.pro : C.border, sw: hl ? 1 : 1.5 });
    s += text(36, y + 31, label, { size: 14, fill: hl ? "#1a1a1a" : C.text, weight: "700" });
    s += text(W - 36, y + 31, price, { size: 14, fill: hl ? "#1a1a1a" : C.text, weight: "800", anchor: "end" });
    y += 60;
  });
  s += text(W / 2, y + 8, "Restore purchases", { size: 13, fill: C.accent, anchor: "middle", weight: "700" }); y += 28;
  s += text(W / 2, y + 8, "Subscriptions renew until cancelled. Manage in", { size: 9.5, fill: C.locked, anchor: "middle" });
  s += text(W / 2, y + 22, "your store account. Lifetime is one-time.", { size: 9.5, fill: C.locked, anchor: "middle" });
  render("05-paywall.png", frame(s));
}

// ============================ SCREEN 6: PROGRESS ============================
{
  let s = header("Your progress", { size: 24 });
  let y = 88;
  s += rrect(20, y, W - 40, 92, 12, C.surface, { stroke: C.border });
  s += text(36, y + 36, "16/503", { size: 26, fill: C.accent, weight: "800", mono: true });
  s += text(36, y + 56, "lessons completed", { size: 12, fill: C.textMuted });
  s += progress(36, y + 70, W - 72, 16 / 503);
  y += 104;
  s += rrect(20, y, W - 40, 48, 12, C.pro);
  s += text(W / 2, y + 30, "★ Go Pro — unlock everything", { size: 15, fill: "#1a1a1a", weight: "800", anchor: "middle" });
  y += 60;
  const phases = curriculum.phases.slice(0, 5);
  const done = [9, 7, 0, 0, 0];
  phases.forEach((p, i) => {
    s += rrect(20, y, W - 40, 64, 12, C.surface, { stroke: C.border });
    s += text(34, y + 26, `${String(p.num).padStart(2, "0")} · ${trunc(p.title, 28)}`, { size: 13.5, fill: C.text });
    s += progress(34, y + 38, W - 68, p.lesson_count ? done[i] / p.lesson_count : 0);
    s += text(34, y + 58, `${done[i]}/${p.lesson_count}`, { size: 11, fill: C.textMuted });
    y += 76;
  });
  s += bannerAd(H - 64 - 52);
  s += tabBar(1);
  render("06-progress.png", frame(s));
}

console.log("done");
