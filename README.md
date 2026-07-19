# StudyForge AI

StudyForge AI turns pasted notes or uploaded TXT, Markdown, PDF, and DOCX study guides into source-grounded practice quizzes. The full guest flow works without external services; OpenAI generation and Supabase accounts are optional upgrades.

## What works

- Upload and extraction with a 10 MB limit, editable review, warnings, metadata, headings, and topic detection
- Strict Source Mode, multiple quiz modes, question types, difficulty levels, topics, hints, shuffling, and timers
- Server-side structured OpenAI generation with Zod validation, one repair attempt, rate limiting, and a deterministic grounded fallback
- One-question quiz interface, immediate or end feedback, exam submission warnings, autosave, refresh recovery, flags, and accessible non-color states
- Exact and partial-credit scoring, topic analytics, detailed source-supported review, retakes, missed-question quizzes, and weak-topic practice
- Local guest library, history, dashboard, progress analytics, TXT/JSON downloads, print/PDF, and shareable score summaries
- Optional Supabase email/password and Google auth, cloud persistence, ownership policies, indexes, and deletion cascades
- Responsive light/dark UI, keyboard focus, reduced motion, semantic labels, empty/error/loading states, unit tests, and an end-to-end demo test

## Requirements

- Node.js 20.9 or later
- pnpm 10 or later
- Optional: an OpenAI API key
- Optional: a Supabase project

## Install and run

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

Open `http://localhost:3000`. Click **Try the demo** to test the complete flow without a file or credentials.

## OpenAI configuration

Set `OPENAI_API_KEY` in `.env.local`. The key is used only in `src/app/api/generate/route.ts`; it is never sent to the browser. `OPENAI_MODEL` defaults to `gpt-5.6-sol` and can be changed without editing code.

The endpoint treats uploaded material as untrusted content, uses the Responses API with a Zod-backed structured output, validates again before returning, and falls back to the local generator if the provider times out or returns invalid data. No key is required for local development.

## Supabase configuration

1. Create a Supabase project.
2. Run `supabase/migrations/001_initial_schema.sql` with `supabase db push` or in the SQL editor.
3. Optionally run `supabase/seed.sql` after creating a test user.
4. Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in `.env.local`.
5. Add `http://localhost:3000/auth/callback` to the allowed redirect URLs. For Google sign-in, enable the Google provider in Supabase Auth.

Every cloud table has row-level security. Policies require `auth.uid()` to match the owner, and foreign keys cascade user-owned data when the auth user is removed. The browser never receives a service-role key.

## Tests and validation

```bash
pnpm test
pnpm build
pnpm exec playwright install chromium
pnpm test:e2e
```

Unit tests cover source processing and prompt-injection handling, schema-valid generation, non-duplication when a source is short, normalization, partial credit, complete scoring, and guest recovery. The Playwright test covers demo source → ten-question quiz → submission → score → incorrect-answer review → missed-question quiz on desktop and mobile projects.

## Production deployment

Deploy to any Node-compatible Next.js host (Vercel is the simplest path):

1. Push the repository to your Git host.
2. Import it into the hosting provider.
3. Add the same environment variables in the provider dashboard.
4. Add the production `/auth/callback` URL to Supabase.
5. Run `pnpm build` as the build command and `pnpm start` for a standalone Node host.

Use platform rate limiting in front of the included in-process guest limiter when running multiple server instances. Configure log retention so full study documents, credentials, and authentication tokens are never recorded.

## Troubleshooting

- **A PDF has almost no text:** it is probably scanned. OCR is not enabled by default; paste OCR output or upload a text-based PDF.
- **A PDF reports protected/corrupted:** export an unlocked copy or paste its text. StudyForge does not bypass encryption.
- **Cloud auth says it is not configured:** add both public Supabase variables and restart the development server.
- **Quiz generation uses the local provider:** this is expected when `OPENAI_API_KEY` is absent or an AI response fails validation.
- **Fewer questions were generated:** Strict Source Mode prefers fewer distinct, defensible questions to repetition or outside facts.
- **Guest history disappeared:** browser storage was cleared or a private session ended. Configure Supabase and sign in for cross-device persistence.

## Privacy and limits

Guest content stays in browser storage after extraction and quiz generation. If OpenAI is configured, selected source text is sent from the server for generation. Do not upload material you do not have permission to process. File type, size, input schema, output schema, rate, and ownership checks are enforced; embedded document instructions are neutralized as content.
