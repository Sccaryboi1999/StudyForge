# StudyForge Architecture

This document describes StudyForge's runtime flow, source-relevance pipeline, trust boundaries, persistence options, and main extension points.

## System overview

StudyForge is a Next.js App Router application. The browser manages the quiz workflow and guest persistence, while server routes handle file extraction and optional OpenAI generation.

```text
Study material
  -> /api/extract
  -> editable review
  -> relevance classification
  -> /api/generate
       -> OpenAI structured generation (optional)
       -> grounded local generator (fallback/default)
  -> quiz player
  -> scoring and results
  -> local storage or Supabase
```

## Major modules

### Application routes

- `src/app/create` hosts the add, review, and quiz-configuration workflow.
- `src/app/quiz` renders the active attempt.
- `src/app/results` provides scoring, explanations, and follow-up practice.
- `src/app/dashboard`, `library`, `history`, and `progress` expose saved learning data.
- `src/app/auth` and `src/app/auth/callback` provide optional Supabase authentication.

### Server routes

- `src/app/api/extract/route.ts` validates uploads and extracts text from TXT, Markdown, DOCX, and PDF inputs.
- `src/app/api/generate/route.ts` validates settings, sanitizes source material, applies relevance filtering, invokes OpenAI when configured, and falls back locally.

### Core libraries

- `src/lib/processing.ts` sanitizes text, classifies relevance, detects headings, and identifies topics.
- `src/lib/generator.ts` creates deterministic source-grounded questions without external services.
- `src/lib/scoring.ts` calculates exact and partial-credit results.
- `src/lib/storage.ts` manages guest persistence and optional cloud writes.
- `src/lib/types.ts` contains shared TypeScript types and Zod schemas.

## Source-relevance pipeline

Quiz quality depends on separating subject knowledge from document administration.

1. The extraction route preserves useful PDF line structure rather than flattening every page into one line.
2. Text sanitization removes script content and neutralizes prompt-injection phrases.
3. Repeated document chrome and administrative lines are excluded from generation context.
4. Course titles, module navigation, directions, blank answer areas, scoring tables, and review plans are rejected as quiz facts.
5. Unanswered question prompts may provide context but are not accepted as evidence.
6. Explained answers are treated as authoritative source values.
7. The local generator requires a factual predicate unless a value is explicitly part of an answer key.
8. OpenAI questions are filtered again to ensure their source excerpts exist in the original material and are quiz-worthy.

The original editable text remains visible to the user. Relevance filtering changes generation context, not the user's source document.

## Generation providers

### Local provider

The local provider is deterministic and requires no credentials. It extracts distinct supported facts, derives question subjects and distractors, respects selected topics, and returns fewer questions when the source cannot support the requested count.

### OpenAI provider

When `OPENAI_API_KEY` is configured, the server uses structured generation with a Zod-backed response format. The source is treated as untrusted, strict-source behavior is explicit, and an invalid response receives one repair attempt. Provider failure or rejected output falls back to the local generator.

## Persistence

### Guest mode

Guest study guides, quizzes, attempts, and progress are stored in browser storage. This supports refresh recovery but is limited to the current browser profile.

### Supabase mode

Supabase adds accounts and cross-device persistence. The schema in `supabase/migrations/001_initial_schema.sql` uses foreign keys, indexes, row-level security, and ownership policies based on `auth.uid()`.

The client uses only the project URL and publishable key. A service-role key must never be exposed to the browser.

## Trust boundaries

- Uploaded files are untrusted input.
- Extracted document instructions are content, not commands.
- OpenAI credentials remain server-side.
- Public Supabase credentials are distinct from service-role credentials.
- AI output is untrusted until it passes the shared schema and source-fidelity checks.
- Browser storage should not be treated as a secure store for secrets.

## Runtime limits

- Maximum upload size: 10 MB
- Supported inputs: TXT, Markdown, PDF, and DOCX
- Image-only PDF OCR: not included
- Generation request limit: in-process guest limiter suitable for a single local/server instance
- Production multi-instance rate limiting: expected at the hosting platform or shared data-store layer

## Testing strategy

- Vitest covers processing, relevance, generation, scoring, and persistence behavior.
- Playwright covers the primary demo flow at desktop and mobile breakpoints.
- `next build` provides production compilation and TypeScript validation.
- Real text-based PDFs are used for manual extraction and quiz-quality verification when PDF behavior changes.

## Safe extension points

- Add OCR behind a server-side provider without changing the quiz schemas.
- Add new question types through `questionTypeSchema`, generator support, UI controls, and scoring tests.
- Replace the in-process limiter with a shared production limiter.
- Add exports as isolated server or client utilities while preserving privacy defaults.
- Extend topic classification without weakening source-excerpt validation.
