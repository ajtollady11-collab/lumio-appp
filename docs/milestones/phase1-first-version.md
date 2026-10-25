# Phase 1 — first working version

Scope: the owner's Phase 1 brief. Design and architecture decisions are in ADR-0002.

## What works (verified by tests)

| Area          | What a student can do                                                                                                        | Verified by                                                        |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| Accounts      | Sign up (13+ confirmation), log in, log out, reset password by email link, delete account                                    | E2E journey; integration tests for deletion                        |
| Onboarding    | 6 steps saved one by one; resumes after a refresh; cannot skip ahead                                                         | E2E                                                                |
| Dashboard     | Greeting by first name and local time, one suggested focus, today's tasks, subjects, quick actions, last 7 days              | E2E + visual check                                                 |
| Learning      | Create, edit, delete subjects and topics                                                                                     | E2E + integration                                                  |
| Planner       | Create, edit, complete, reopen, delete (with confirmation) study tasks                                                       | E2E                                                                |
| Tutor         | Streamed replies, Markdown and maths, conversation history, rename/delete, retry after failure, clear "not configured" state | E2E (test provider), unit tests (prompt, provider with mocked SDK) |
| Revision      | Flashcard collections and cards, review sessions, multiple-choice quizzes marked on the server with explanations             | E2E + integration                                                  |
| Progress      | Totals and 14-day activity from stored records only                                                                          | E2E + integration                                                  |
| Settings      | Profile, goals and preference, sign-out, account deletion, privacy summary                                                   | E2E                                                                |
| Security      | RLS on every table, cross-student access returns not found, rate limits, no secrets in the client bundle                     | 41 integration tests, E2E cross-user test, `check:bundle`          |
| Accessibility | axe (WCAG 2.2 AA) and no horizontal scroll on every public and app page, desktop and mobile                                  | E2E                                                                |

## Not done yet

- Not deployed: needs a new Vercel project and Supabase projects (owner approval).
- The real AI tutor needs an Anthropic API key in Vercel; until then it shows "not configured".
- Auth emails use Supabase's default sender; a custom SMTP sender is needed before launch.
- Privacy notice and terms are drafts and need legal review.
- Dark mode, spaced-repetition scheduling, AI-generated flashcards/quizzes and payments are not built.
