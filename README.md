# Lumio

An AI tutoring and learning platform, starting with GCSE Maths. **In development — not open to
students.**

This repository is the from-scratch implementation. Work happens in small milestones; see
[`docs/milestones/`](docs/milestones/) for what exists today and what is next.

## Status

| Milestone | Scope                                                  | State       |
| --------- | ------------------------------------------------------ | ----------- |
| M1a       | Repository foundation, quality gates, holding page     | In review   |
| M1b       | Vercel project, preview and gated production deploys   | Not started |
| M1c       | Supabase, authentication, profiles, row-level security | Not started |
| M1d       | Design-system components and app shell                 | Not started |

## Running it locally

Requires Node 22 and pnpm 10 (`corepack enable` provides pnpm).

```bash
pnpm install
cp .env.example .env.local   # optional in M1a; no secrets are needed yet
pnpm dev                     # http://localhost:3000
```

Checks:

```bash
pnpm check        # types, lint, formatting, unit tests
pnpm build        # production build (fails on invalid environment variables)
pnpm check:bundle # fails if a secret-looking value reaches the browser bundle
pnpm test:e2e     # Playwright against the production build
```

## Stack

Next.js 16 (App Router, Cache Components) · React 19 · TypeScript (strict) · Tailwind CSS 4 ·
Zod · Vitest · Playwright + axe. Supabase, Anthropic and Stripe are added in later milestones.
Reasons are recorded in [`docs/adr/0001-foundation-stack.md`](docs/adr/0001-foundation-stack.md).

## Contributing

See [`CLAUDE.md`](CLAUDE.md) for engineering rules, structure and the definition of done. Never
commit secrets: `.env.example` lists variable names only.

Fonts are self-hosted under the SIL Open Font License 1.1 (`src/app/fonts/licenses/`).
