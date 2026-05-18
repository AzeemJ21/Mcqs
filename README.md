# MCQ Platform

A full-stack Next.js 14 application that turns DOCX, PDF, or TXT files of multiple-choice questions into interactive quizzes with scoring and review.

## Stack

- **Next.js 14** (App Router) + **TypeScript**
- **Tailwind CSS** + custom dark design system
- **Framer Motion** for transitions
- **Zustand** for client state
- **react-dropzone** for uploads
- **mammoth** (DOCX) and **pdf-parse** (PDF) for extraction
- **shadcn/ui-style** primitives built on Radix UI

## Quick start

```bash
npm install
npm run dev
```

Then visit [http://localhost:3000](http://localhost:3000), drop in `public/sample-questions.txt`, and try the quiz.

## Project structure

```
app/
  layout.tsx               Root layout (fonts, providers)
  page.tsx                 Home / upload page
  quiz/[id]/page.tsx       Active quiz page
  results/[id]/page.tsx    Score + review page
  api/
    upload/route.ts        POST file -> parsed quiz JSON
    quiz/[id]/route.ts     GET stored quiz JSON
components/
  upload/                  Drop zone, format badges
  quiz/                    Question card, options, header, timer, progress
  results/                 Score card, review list, share button
  ui/                      Button, Card, Dialog, Toast (shadcn-style)
lib/
  parsers/                 parseDocx, parsePdf, parseTxt, parseQuestions (regex engine)
  store/quizStore.ts       Zustand store
  quizStorage.ts           In-memory quiz registry
  types.ts, utils.ts
public/
  sample-questions.txt     Try-it-now sample
```

## Supported file formats

The parser is intentionally flexible. It recognises three common MCQ formats and several answer-line styles.

### Format 1 — Numbered question, lettered options, explicit answer

```
1. What is the capital of France?
A) Paris
B) London
C) Berlin
D) Madrid
Answer: A
```

### Format 2 — `Q:` prefix and lower-case options

```
Q: What does CPU stand for?
a. Central Processing Unit
b. Computer Personal Unit
c. Central Peripheral Unit
d. Core Processing Unit
Correct Answer: a
```

### Format 3 — Inline correct-answer marker

```
The speed of light is approximately:
(A) 300,000 km/s *
(B) 150,000 km/s
(C) 450,000 km/s
(D) 200,000 km/s
```

The asterisk (`*`) at the end of an option marks the correct answer. `[correct]` and `(correct)` work too.

### Recognised answer keywords

- `Answer:` `A`
- `Correct:` `B`
- `Correct Answer:` `c`
- `Ans:` `2`
- `Key:` `(D)`

### Recognised option label styles

- `A)` `B)` `C)` `D)`
- `a.` `b.` `c.` `d.`
- `(A)` `[B]`
- `1)` `2.` `3-` `4:` (mapped to A/B/C/D)

### Optional extras

- A line starting with `Explanation:` or `Reason:` after the answer line is captured and shown in the review screen.
- Lines that look like ALL-CAPS section headers without a question mark are treated as boundaries and skipped.

### Parsing rules

- Blank lines between options are ignored.
- Option labels are normalised to `A`, `B`, `C`, `D` regardless of input style.
- A question is only kept if it has at least 2 options **and** a detected correct answer.
- If no questions can be parsed, the API returns a 422 with a descriptive error.

## Limits & errors

| Condition | Behaviour |
|-----------|-----------|
| File > 10MB | `413 File exceeds 10MB limit.` |
| Unsupported extension | `415 Only .docx, .txt, and .pdf files are supported.` |
| Empty file | `400 Uploaded file is empty.` |
| Could not extract text | `422` with descriptive detail |
| No questions detected | `422 Could not detect any questions...` |
| Unknown quiz id | `404` (the page redirects home with a toast) |

## State persistence

The platform is **stateless** by design — quiz JSON is stored in an in-memory map keyed by a nanoid quiz id. The id in the URL is the only state that survives a refresh, and you can re-upload your file at any time.

## Keyboard shortcuts (quiz screen)

| Key | Action |
|-----|--------|
| `1`–`4` or `a`–`d` | Select option |
| `Space` | Toggle currently selected option |
| `Enter` or `→` | Next question / Finish |
| `←` | Previous question |

## Scripts

```bash
npm run dev     # Start dev server
npm run build   # Production build
npm run start   # Run production build
npm run lint    # Run ESLint
```
