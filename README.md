# Lumio

A personal AI learning companion: an AI tutor, subjects and topics, a study planner, flashcards,
quizzes and progress built from real activity. **In development — not yet deployed or open to
students.**

This repository is the from-scratch implementation. See [`docs/milestones/`](docs/milestones/)
for what exists today and [`docs/adr/`](docs/adr/) for the decisions behind it.

## Status

| Milestone | Scope                                                        | State                     |
| --------- | ------------------------------------------------------------ | ------------------------- |
| M1a       | Repository foundation, quality gates                         | Done (PR #1)              |
| Phase 1   | Landing page, auth, onboarding, app shell and all core areas | In review, not deployed   |
| Next      | Vercel + Supabase projects, production AI key, launch checks | Waiting on owner approval |

## Running it locally

Requires Node 22 and pnpm 10 (`corepack enable` provides pnpm), plus a local Supabase:

```bash
pnpm install
supabase start                # Supabase CLI + Docker; applies supabase/migrations
# or, where Docker is unavailable: pnpm sandbox up && pnpm sandbox env
cp .env.example .env.local    # then fill SUPABASE_URL / SUPABASE_PUBLISHABLE_KEY from the output
pnpm dev                      # http://localhost:3000
```

Without an `ANTHROPIC_API_KEY` the tutor shows a "not configured" message; set
`TUTOR_PROVIDER=test` locally for fixed, clearly labelled test replies.

Checks:

```bash
pnpm check             # types, lint, formatting, unit tests
pnpm test:integration  # RLS and database functions (needs local Supabase)
pnpm db:types:check    # generated database types match the migrations
pnpm build             # production build (fails on invalid environment variables)
pnpm check:bundle      # fails if a secret-looking value reaches the browser bundle
pnpm test:e2e          # Playwright against the production build
```

## Stack

Next.js 16 (App Router, Cache Components) · React 19 · TypeScript (strict) · Tailwind CSS 4 ·
Zod · Supabase (Postgres, Auth, RLS) · Anthropic Claude · Vitest · Playwright + axe. Reasons are
recorded in [ADR-0001](docs/adr/0001-foundation-stack.md) and [ADR-0002](docs/adr/0002-phase1-app-architecture.md).

## Contributing

See [`CLAUDE.md`](CLAUDE.md) for engineering rules, structure and the definition of done. Never
commit secrets: `.env.example` lists variable names only.

Fonts are self-hosted under the SIL Open Font License 1.1 (`src/app/fonts/licenses/`).
