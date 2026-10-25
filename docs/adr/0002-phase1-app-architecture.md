# ADR-0002 — Phase 1 application architecture and deviations from the master spec

- Status: Accepted (Phase 1 brief, 25 Oct 2026)
- Context: the owner's "Phase 1 Implementation Master Prompt" asked for the first working
  version of the whole app. Where it differs from the Phase 0 master specification, the
  Phase 1 brief was followed and the difference is recorded here so the founders can confirm or
  reverse it.

## Decisions

1. **Supabase behind the server only (backend-for-frontend).** The browser never talks to
   Supabase. Pages, server actions and `/api/tutor` create a per-request client from the
   student's session cookie using the _publishable_ key, so every query runs under row-level
   security as that student. There is **no service-role key** anywhere in the app; privileged
   writes (saving a tutor exchange, marking a quiz, deleting an account) are `SECURITY DEFINER`
   functions that check `auth.uid()` themselves.
2. **Ownership in the schema, not just policies.** Every table has RLS with owner-only policies,
   default privileges are revoked, and child rows use composite foreign keys
   `(parent_id, user_id)` so a row can never be attached to another student's parent.
3. **AI tutor.** Anthropic Claude (`claude-sonnet-5-5` by default) streamed through
   `/api/tutor` as NDJSON. Limits: 4,000-character messages, 16 KB bodies, bounded history
   (20 messages / 24k characters), 1,500 output tokens, 90 s timeout, and per-student rate limits
   enforced in the database (20 per 10 minutes, 150 per day). The exchange is saved only when a
   reply completes. A `test` provider exists for automated tests; its replies say they are not
   AI, and the environment schema refuses it in production. The student's name and email are
   never sent to the provider.
4. **Session reads are request-time.** `getSessionUser` calls `connection()` before
   `getClaims()`, because token validation depends on the current time and must not run inside a
   prerender or runtime prefetch (Cache Components).
5. **Local stack without Docker.** The development sandbox cannot run Docker, so
   `scripts/sandbox-stack` runs Postgres, Supabase's own GoTrue and PostgREST binaries and a small
   gateway. CI uses the official `supabase start` instead (`supabase/config.toml`).

## Deviations from the master specification (to confirm)

| Area                   | Master spec                 | Phase 1 build                                                           | Why                                                                    |
| ---------------------- | --------------------------- | ----------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Scope                  | GCSE Maths only at launch   | Any subject; students add their own                                     | Phase 1 brief                                                          |
| Visual identity        | Fraunces / Atkinson, indigo | Inter, warm off-white, violet (#7564E8)                                 | Phase 1 brief                                                          |
| Colour contrast        | —                           | Muted text #6B6C67, interactive violet #6553DB, control borders #8E8C85 | Brief's #777873 and #7564E8 fail WCAG AA for small text                |
| Dark mode (D5)         | Yes                         | Deferred                                                                | Not in the Phase 1 brief; tokens make it a contained change            |
| Age gate               | Month/year of birth         | "I'm 13 or older" checkbox                                              | Phase 1 brief kept sign-up short; revisit with the safeguarding review |
| Account deletion (D18) | 7-day grace period          | Immediate                                                               | Simpler and safer for v1; backups expire on Supabase's schedule        |
| Search indexing        | —                           | `noindex` until launch                                                  | D21 trademark check still open                                         |
| Payments               | Stripe in M6                | None                                                                    | Phase 1 brief: no payments                                             |
