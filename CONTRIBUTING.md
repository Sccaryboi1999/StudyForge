# Contributing to StudyForge

Thanks for helping improve StudyForge. Changes should preserve source fidelity, privacy, accessibility, and a complete guest workflow without paid services.

## Before starting

- Search existing issues before opening a new one.
- Use the bug-report form for reproducible defects.
- Use the feature-request form for product proposals.
- Do not include private study material, credentials, API keys, or authentication tokens in issues, screenshots, logs, fixtures, or commits.

## Local setup

```bash
git clone https://github.com/Sccaryboi1999/StudyForge.git
cd StudyForge
pnpm install
```

Copy `.env.example` to `.env.local`, then run:

```bash
pnpm dev
```

No external service is required for the default guest workflow.

## Branches and commits

- Create a focused branch from the current default branch.
- Keep unrelated changes in separate pull requests.
- Use short, descriptive commit messages.
- Never commit `.env.local`, credentials, generated build output, or private study guides.

## Development expectations

- Keep TypeScript strict and validate external input with Zod.
- Keep API keys and provider calls on the server.
- Treat uploaded documents and AI output as untrusted.
- Prefer fewer defensible questions over unsupported or repetitive questions.
- Preserve keyboard navigation, visible focus, sufficient contrast, and non-color status indicators.
- Add or update tests for behavior changes and regressions.
- Update README or architecture documentation when setup or system behavior changes.

## Validation

Run these checks before submitting a pull request:

```bash
pnpm lint
pnpm test
pnpm build
```

For changes to the main user flow:

```bash
pnpm exec playwright install chromium
pnpm test:e2e
```

For PDF-processing changes, also verify at least one text-based PDF through the running `/api/extract` and `/api/generate` routes.

## Pull requests

A pull request should explain:

- What changed
- Why it changed
- User impact
- Security or privacy impact
- Validation performed
- Screenshots for meaningful interface changes

Complete the repository pull-request template and keep the pull request in draft until the implementation and relevant checks are complete.

## Reporting security issues

Do not open a public issue for a vulnerability. Follow [SECURITY.md](SECURITY.md) instead.
