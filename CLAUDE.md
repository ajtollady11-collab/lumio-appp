@AGENTS.md

# Lumio — instructions for Claude

Lumio is an AI tutoring and learning platform, launching with GCSE Maths (England, 13+).
This repository is a from-scratch build. Never reuse, inspect or copy any earlier Lumio
codebase (including the `lumio` and `lumio-app` repositories or the old `lumio-app` Vercel
project).

## Source of truth

1. The **Master Product Specification** (Phase 0) — owned by the founders, kept outside this
   public repository. Section numbers (e.g. "spec §7.10") refer to it. If a task contradicts it,
   stop and say so instead of guessing.
2. `docs/adr/` — architectural decisions taken during implementation.
3. `docs/milestones/` — scope, acceptance criteria and status of each milestone.

Approved defaults: spec decisions D1–D20 as recommended. D21 (product name / trademark) is
still open — route every user-facing use of the name through `src/lib/brand.ts`.

## Before starting any task

Confirm you can state: what is being built and why; the spec sections and backlog IDs it
covers; affected data, permissions and failure states; the tests you will write; the acceptance
criteria. Read the relevant guide in `node_modules/next/dist/docs/` first — this Next.js
version (16.x, Cache Components on) differs from older training data.

## Commands

| Task                                           | Command             |
| ---------------------------------------------- | ------------------- |
| Install                                        | `pnpm install`      |
| Dev server                                     | `pnpm dev`          |
| All fast checks (types, lint, format, unit)    | `pnpm check`        |
| Unit tests                                     | `pnpm test`         |
| Production build                               | `pnpm build`        |
| Secret scan of the client bundle (after build) | `pnpm check:bundle` |
| End-to-end tests (after build)                 | `pnpm test:e2e`     |

In this sandbox, run Playwright with `PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers`.

## Structure

```text
src/
  app/                 routes only: pages, layouts, route handlers
    (marketing)/       public pages
    api/               route handlers
    fonts/             self-hosted font files + OFL licences
  components/          UI; must not import src/server
  lib/                 shared, browser-safe code (env schema, brand); must not import src/server
  server/              server-only modules; every file starts with `import "server-only"`
tests/
  unit/                cross-cutting unit tests (architecture guardrails)
  e2e/                 Playwright
docs/                  ADRs, milestones, runbook
```

## Non-negotiable rules (spec §19, abridged)

- Never commit secrets. Secrets live in Vercel / Supabase / GitHub settings only;
  `.env.example` lists names, never values. Nothing secret may use the `NEXT_PUBLIC_` prefix.
- Server-only code lives in `src/server/` and is guarded by `server-only`, an ESLint rule and
  `tests/unit/architecture.test.ts`. Do not weaken these to make a build pass.
- Never trust the client for identity, permissions, prices, marks or entitlements.
- Never invent student progress, results, testimonials, statistics or features. Placeholder
  UI must not look functional; unfinished work goes behind a feature flag.
- Never bypass a failing check. Fix the cause or stop and report it.
- Database changes only through versioned migrations (from M1c). Never reset production data.
- Every feature ships with loading, empty, error and success states, works at 360 px width,
  and passes axe (WCAG 2.2 AA).
- Prefer no new dependency; justify any you add in the PR description.

## Definition of done (spec §12.3)

Acceptance criteria demonstrated; all states implemented on mobile and desktop; server-side
authorisation tested (including a cross-user test once data exists); inputs validated with
Zod; accessibility checked; tests added and green; docs/ADRs updated; nothing unfinished
presented as working.

## Workflow

Branch from `main` (`feat/…`, `fix/…`, `chore/…`), Conventional Commit messages, open a PR,
CI must be green, the owner merges. Do not push directly to `main` after the initial commit.
