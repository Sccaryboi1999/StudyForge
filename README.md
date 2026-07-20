# StudyForge AI

StudyForge AI turns notes and study guides into source-grounded practice quizzes. Upload a TXT, Markdown, PDF, or DOCX file—or paste text directly—review the extracted material, choose quiz settings, and practice with questions supported by the source.

The complete guest workflow runs locally without external services. An OpenAI API key upgrades question generation, while Supabase adds accounts and cross-device persistence.

## Highlights

- Source-grounded quiz generation with Strict Source Mode enabled by default
- Editable text review before generation
- PDF, DOCX, Markdown, TXT, and pasted-text inputs up to 10 MB
- Automatic exclusion of repeated headers, page labels, contents, quiz directions, scoring material, and study instructions
- Answer-key-aware generation that treats unanswered prompts as cues—not facts
- Multiple-choice, true/false, fill-in-the-blank, short-answer, and scenario questions
- Practice, exam, study, adaptive, flashcard, and review modes
- Hints, timers, shuffling, flags, skipping, autosave, and refresh recovery
- Source excerpts, explanations, partial-credit scoring, and topic analytics
- Guest history, library, dashboard, progress tracking, exports, and printable results
- Optional Supabase authentication and cloud persistence with row-level security
- Responsive light/dark interface with accessible focus, labels, contrast, and reduced-motion support

## How source relevance works

StudyForge classifies extracted material before generating questions.

**Included as quiz evidence:**

- Facts and definitions
- Processes and cause-and-effect relationships
- Comparisons and worked examples
- Technical explanations
- Explained answer-key content

**Excluded from quiz evidence:**

- Document titles and course labels
- Repeated headers and footers
- Page numbers and navigation text
- Tables of contents and module listings
- Quiz directions, scoring rubrics, and review plans
- Blank response lines and study instructions
- Unanswered questions presented without authoritative answers

The review screen always shows the extracted text so the user can make final corrections before generation.

## Requirements

- Node.js 20.9 or later
- pnpm 10 or later
- Optional: an OpenAI API key
- Optional: a Supabase project

## Quick start

Clone the repository and enter the project directory:

```bash
git clone https://github.com/Sccaryboi1999/StudyForge.git
cd StudyForge
pnpm install
```

Create the local environment file.

PowerShell:

```powershell
Copy-Item .env.example .env.local
```

macOS or Linux:

```bash
cp .env.example .env.local
```

Start the development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). Click **Try the demo** to test the full workflow without credentials or a file.

## Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `OPENAI_API_KEY` | No | Enables server-side OpenAI quiz generation. The grounded local generator is used when omitted. |
| `OPENAI_MODEL` | No | Overrides the configured OpenAI model. Defaults to `gpt-5.6-sol`. |
| `NEXT_PUBLIC_SUPABASE_URL` | No | Supabase project URL for authentication and cloud persistence. |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | No | Supabase publishable key used by the browser client. |

Never commit `.env.local` or a service-role key.

## OpenAI configuration

Add `OPENAI_API_KEY` to `.env.local` and restart the development server. The key is used only by the server route at `src/app/api/generate/route.ts` and is never sent to the browser.

The generation endpoint:

- Treats uploaded documents as untrusted source material
- Removes non-examinable document structure before prompting
- Requires structured output validated with Zod
- Rejects questions that cite unsupported or administrative text
- Attempts one structured repair after an invalid response
- Falls back to the deterministic local generator when necessary

## Supabase configuration

1. Create a Supabase project.
2. Run `supabase/migrations/001_initial_schema.sql` with the Supabase CLI or SQL editor.
3. Optionally run `supabase/seed.sql` after creating a test user.
4. Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in `.env.local`.
5. Add `http://localhost:3000/auth/callback` to the allowed redirect URLs.
6. Enable the Google provider in Supabase Auth if Google sign-in is needed.

Every cloud table uses row-level security. Policies require `auth.uid()` to match the resource owner, and foreign keys cascade user-owned data when the authentication user is deleted.

## Commands

| Command | Description |
| --- | --- |
| `pnpm dev` | Start the local Next.js development server. |
| `pnpm lint` | Run ESLint across the project. |
| `pnpm test` | Run the Vitest unit suite once. |
| `pnpm test:watch` | Run Vitest in watch mode. |
| `pnpm build` | Type-check and create an optimized production build. |
| `pnpm start` | Serve a completed production build. |
| `pnpm exec playwright install chromium` | Install the browser used by end-to-end tests. |
| `pnpm test:e2e` | Run the Playwright workflow on desktop and mobile projects. |

## Project structure

```text
src/
  app/                  Next.js pages and server routes
  components/           Quiz, dashboard, history, and workflow UI
  lib/                  Processing, generation, scoring, storage, and types
supabase/
  migrations/           Database schema and row-level security policies
  seed.sql               Optional development seed data
e2e/                     Playwright end-to-end coverage
docs/                    Architecture and design documentation
.github/                 Issue forms and pull-request guidance
```

See [Architecture](docs/ARCHITECTURE.md) for the request flow, trust boundaries, persistence model, and source-relevance pipeline.

## Testing

```bash
pnpm lint
pnpm test
pnpm build
pnpm exec playwright install chromium
pnpm test:e2e
```

The unit suite covers source processing, prompt-injection neutralization, document relevance, answer-key handling, schema-valid generation, duplicate prevention, partial credit, scoring, and guest recovery. The Playwright test covers the demo source through quiz completion, results review, and missed-question practice on desktop and mobile layouts.

## Production deployment

StudyForge can be deployed to any Node-compatible Next.js host. Vercel is the simplest option:

1. Import the GitHub repository.
2. Use `pnpm build` as the build command.
3. Add the required environment variables in the provider dashboard.
4. Add the production `/auth/callback` URL to Supabase when cloud accounts are enabled.
5. Configure platform-level rate limiting when running more than one server instance.

For a standalone Node host, build with `pnpm build` and serve with `pnpm start`.

## Privacy and security

- Guest content stays in the current browser after extraction and generation.
- With OpenAI enabled, selected study text is sent from the server for generation.
- Full study documents, credentials, and authentication tokens should never be logged.
- File type, file size, input schema, output schema, ownership, and rate checks are enforced.
- Instructions embedded inside uploaded material are treated as untrusted content, never as system commands.

Review [SECURITY.md](SECURITY.md) before reporting a vulnerability.

## Troubleshooting

- **A PDF has almost no text:** It is probably image-only or scanned. OCR is not included; paste OCR output or upload a text-based PDF.
- **A PDF reports protected or corrupted:** Export an unlocked copy or paste its text. StudyForge does not bypass PDF encryption.
- **Cloud authentication is not configured:** Add both public Supabase variables and restart the development server.
- **The local provider is shown:** This is expected when `OPENAI_API_KEY` is absent or an AI response fails validation.
- **Fewer questions were generated:** Strict Source Mode prefers fewer defensible questions over repetition or unsupported content.
- **An older quiz still looks wrong:** Create a new quiz after changing the source or updating StudyForge; saved quizzes do not regenerate automatically.
- **Guest history disappeared:** Browser storage was cleared or a private session ended. Configure Supabase and sign in for cross-device persistence.

## Contributing

Read [CONTRIBUTING.md](CONTRIBUTING.md) for development setup, coding expectations, validation commands, and the pull-request checklist.

## Project status

StudyForge is a functional production-ready baseline under active development. OCR for scanned documents and distributed rate limiting are intentionally not included in the local baseline.
