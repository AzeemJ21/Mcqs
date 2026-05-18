// Smoke test for the question parser. Mirrors lib/parsers/parseQuestions.ts.
// Run with: node scripts/testParser.mjs [optional-file-path]
import { readFile } from "node:fs/promises";

const OPTION_LABEL_RE =
  /^\s*(?:\(|\[)?\s*([A-Ha-h]|[1-8])\s*(?:\)|\]|\.|:|-)\s+(.+?)\s*$/;
const ANSWER_LINE_RE =
  /^\s*(?:answer|correct\s*answer|correct|ans|key)\s*[:\-]\s*(?:\(|\[)?\s*([A-Ha-h]|[1-8])\s*(?:\)|\])?\s*\.?\s*$/i;
const QUESTION_PREFIX_RE =
  /^\s*(?:Q\s*[:.\-)]\s*|Question\s*\d*\s*[:.\-)]\s*|\d+\s*[.)\-:]\s+)/i;
const EXP_RE = /^(explanation|reason)\s*[:\-]\s*/i;
const INLINE = [/\*\s*$/, /\[correct\]\s*$/i, /\(correct\)\s*$/i];
const N2L = { 1: "A", 2: "B", 3: "C", 4: "D", 5: "E", 6: "F", 7: "G", 8: "H" };
const norm = (r) => N2L[r] ?? String(r).toUpperCase();

const stripQ = (l) => l.replace(QUESTION_PREFIX_RE, "").trim();

function inlineMark(text) {
  for (const re of INLINE)
    if (re.test(text)) return { text: text.replace(re, "").trim(), marked: true };
  return { text: text.trim(), marked: false };
}

function isHeader(l) {
  if (!l || l.length > 80 || l.includes("?")) return false;
  if (OPTION_LABEL_RE.test(l) || ANSWER_LINE_RE.test(l) || QUESTION_PREFIX_RE.test(l))
    return false;
  const letters = l.replace(/[^A-Za-z]/g, "");
  return letters.length >= 3 && letters === letters.toUpperCase();
}

function isQStarter(l) {
  if (/\?\s*$/.test(l)) return true;
  if (/^\s*Q\s*[:.\-)]/i.test(l)) return true;
  if (/^\s*Question\b/i.test(l)) return true;
  return false;
}

function tokenize(raw) {
  const lines = raw.replace(/\r\n/g, "\n").split("\n").map((l) => l.trimEnd());
  const blocks = [];
  let cur = null;
  let buf = [];
  let capExp = false;
  let pendingFlush = false;
  const flush = () => {
    if (cur && (cur.q.length || cur.opts.length)) blocks.push(cur);
    cur = null;
    capExp = false;
    pendingFlush = false;
  };

  for (const raw of lines) {
    const t = raw.trim();
    if (!t) {
      capExp = false;
      if (cur && cur.sealed) pendingFlush = true;
      continue;
    }
    if (pendingFlush) flush();
    if (isHeader(t)) {
      flush();
      buf = [];
      continue;
    }
    const am = t.match(ANSWER_LINE_RE);
    if (am && cur) {
      cur.ans = norm(am[1]);
      cur.sealed = true;
      capExp = true;
      continue;
    }
    const om = t.match(OPTION_LABEL_RE);
    const explicitQ = isQStarter(t);

    if (explicitQ) {
      flush();
      cur = { q: [...buf.map(stripQ), stripQ(t)], opts: [] };
      buf = [];
      continue;
    }
    if (om) {
      const { text, marked } = inlineMark(om[2]);
      const label = norm(om[1]);
      if (cur) {
        cur.opts.push({ label, text, marked });
        if (marked) cur.sealed = true;
        capExp = false;
        continue;
      }
      if (buf.length > 0) {
        cur = { q: buf.map(stripQ), opts: [{ label, text, marked }] };
        if (marked) cur.sealed = true;
        buf = [];
        capExp = false;
        continue;
      }
      if (/^\s*\d+\s*[.)\-:]\s+/.test(t)) {
        cur = { q: [stripQ(t)], opts: [] };
        continue;
      }
      continue;
    }
    if (cur) {
      if (cur.opts.length === 0) cur.q.push(t);
      else if (capExp)
        cur.exp = (cur.exp ? cur.exp + " " : "") + t.replace(EXP_RE, "");
      else cur.opts[cur.opts.length - 1].text += " " + t;
    } else {
      buf.push(t);
    }
  }
  flush();
  return blocks;
}

function parse(raw) {
  const out = [];
  for (const b of tokenize(raw)) {
    const text = b.q.join(" ").replace(/\s+/g, " ").trim();
    if (!text || b.opts.length < 2) continue;
    const map = new Map();
    for (const o of b.opts) map.set(o.label, o);
    const labels = [...map.keys()].sort();
    const correct =
      b.ans && map.has(b.ans) ? b.ans : labels.find((l) => map.get(l).marked);
    if (!correct) continue;
    out.push({
      text,
      correct,
      options: labels.map((l) => ({ id: l, text: map.get(l).text })),
      explanation: b.exp,
    });
  }
  return out;
}

const samples = {
  "format1.txt": `1. What is the capital of France?
A) Paris
B) London
C) Berlin
D) Madrid
Answer: A
`,
  "format2.txt": `Q: What does CPU stand for?
a. Central Processing Unit
b. Computer Personal Unit
c. Central Peripheral Unit
d. Core Processing Unit
Correct Answer: a
`,
  "format3.txt": `The speed of light is approximately:
(A) 300,000 km/s *
(B) 150,000 km/s
(C) 450,000 km/s
(D) 200,000 km/s
`,
  "mixed.txt": `GENERAL KNOWLEDGE

1. Capital of France?
A) Paris
B) London
Answer: A

Q: 2 + 2 = ?
1) 3
2) 4
3) 5
4) 6
Key: 2

Who wrote Hamlet?
(A) Dickens
(B) Shakespeare *
(C) Twain
(D) Austen

Question 4. Which is largest?
a. Earth
b. Mars
c. Sun
d. Moon
Ans: c
Explanation: The Sun is by far the largest body in our solar system.
`,
};

let failures = 0;
const expected = {
  "format1.txt": 1,
  "format2.txt": 1,
  "format3.txt": 1,
  "mixed.txt": 4,
};

for (const [name, txt] of Object.entries(samples)) {
  const qs = parse(txt);
  const ok = qs.length === expected[name];
  console.log(
    `[${ok ? "PASS" : "FAIL"}] ${name}: expected ${expected[name]}, got ${qs.length}`
  );
  for (const q of qs) {
    console.log(
      `   Q: ${q.text}\n      correct=${q.correct} options=${q.options.map((o) => o.id).join(",")}${q.explanation ? `\n      explanation="${q.explanation}"` : ""}`
    );
  }
  if (!ok) failures++;
}

const filePath = process.argv[2];
if (filePath) {
  const data = await readFile(filePath, "utf-8");
  const qs = parse(data);
  console.log(`\n[file: ${filePath}] -> ${qs.length} question(s)`);
  for (const q of qs) {
    console.log(`  Q: ${q.text}\n     correct=${q.correct} options=${q.options.map((o) => `${o.id}:${o.text}`).join(" | ")}`);
  }
  if (qs.length === 0) failures++;
}

process.exit(failures > 0 ? 1 : 0);
