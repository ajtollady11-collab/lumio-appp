# M1 — Secure foundation

M1 (spec §16, items F-01 to F-13) is split into four reviewable slices so each one can be
verified before the next begins.

| Slice                       | Backlog items                                             | Needs from the owner                                                   | State       |
| --------------------------- | --------------------------------------------------------- | ---------------------------------------------------------------------- | ----------- |
| M1a Repository foundation   | F-01, F-02, F-08 (guards), F-11 (health), CI part of F-12 | GitHub repo (done)                                                     | In review   |
| M1b Deployments             | F-12 (Vercel preview + gated production, rollback drill)  | Approve creating a new Vercel project; production deploy approver      | Not started |
| M1c Data and auth           | F-03, F-04, F-05, F-09, F-10, F-13                        | Approve creating Supabase staging + production projects (UK/EU region) | Not started |
| M1d Design system and shell | F-06, F-07                                                | Review of design tokens and components                                 | Not started |

## M1a — acceptance criteria

| #   | Criterion                                                                                                     | How it is verified                                                                                 | Result            |
| --- | ------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- | ----------------- |
| 1   | Next.js 16 + strict TypeScript + Tailwind project with the spec §6.2 folder layout                            | Repository review                                                                                  | Pass              |
| 2   | Invalid environment variables fail the build with a readable message                                          | `APP_ENV=staging pnpm build` fails naming `APP_ENV`; unit tests                                    | Pass              |
| 3   | Server-only code cannot reach the browser                                                                     | Lint rule, `server-only` markers, architecture test — each shown to fail on a deliberate violation | Pass              |
| 4   | No secret-looking value in the client bundle                                                                  | `pnpm check:bundle` after build                                                                    | Pass              |
| 5   | `/api/health` returns `{status, environment, commit, checkedAt}` only, never cached                           | Unit + E2E tests                                                                                   | Pass              |
| 6   | Baseline security headers on every response; no `X-Powered-By`                                                | E2E test                                                                                           | Pass              |
| 7   | Holding page is honest: says the product is in development; no buttons, sign-up or pricing                    | E2E test                                                                                           | Pass              |
| 8   | Holding page meets WCAG 2.2 AA (axe), no horizontal scroll at mobile width, skip link first                   | E2E tests on desktop and mobile                                                                    | Pass              |
| 9   | Light and dark mode follow the system setting using spec §10.2 tokens                                         | Visual check of screenshots                                                                        | Pass              |
| 10  | CI runs types, lint, formatting, unit tests, build, bundle scan, E2E and a repository secret scan on every PR | First CI run on GitHub                                                                             | Pending first run |
| 11  | `CLAUDE.md`, README, ADR-0001 and this file describe the actual implementation                                | Review                                                                                             | Pass              |

Local results at hand-off: 17 unit tests and 15 E2E tests passing (1 desktop-only test skipped
on mobile by design).

## Not in M1a

No database, authentication, AI, payments, app shell or Vercel deployment. The page at `/` is a
holding page, not the product.
