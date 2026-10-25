# Owner setup checklist

Steps only the account owner can take. Claude never needs passwords or secret keys pasted into chat: secrets are entered directly into the GitHub, Vercel or Supabase dashboards.

## Done

- [x] GitHub repository `ajtollady11-collab/lumio-appp` created and connected to Claude.
- [x] Vercel and Supabase accounts connected to Claude (read access confirmed 25 Oct 2026).

## Before M1b (deployments)

- [ ] Decide whether the repository stays public. Recommended: **private**, so business plans and specifications can live in `docs/`. GitHub → repo → Settings → General → Danger Zone → Change visibility.
- [ ] Approve Claude creating a **new** Vercel project for this repo (do not reuse the old `lumio-app` project).
- [ ] After the first merge to `main`, protect the branch: require a pull request, require the `Quality`, `Database, build and end-to-end` and `Secret scan` checks, block force pushes. Claude can apply this on request.

## Before M1c (data and auth)

- [ ] Confirm that the Supabase organisation currently connected to Claude is the one Lumio should use (Claude shows its name in chat, not in this public file).
- [ ] Approve Claude creating `lumio-staging` and `lumio-production` projects in a London or EU region. Supabase Pro is needed for production (spec §14).

## Before the first deployment (Phase 1)

- [ ] Approve Claude creating a **new** Vercel project for `lumio-appp` and the Supabase projects above.
- [ ] In Supabase → Authentication → URL configuration, set the Site URL to the deployed address and add `<site>/auth/callback` to the redirect URLs (Claude can do this once the projects exist).
- [ ] Create an Anthropic API key at console.anthropic.com and paste it **directly into Vercel** → Project → Settings → Environment Variables as `ANTHROPIC_API_KEY` (Production and Preview). Never paste it into chat. Set a monthly spend limit in the Anthropic console.
- [ ] Before inviting real students: configure a custom SMTP sender in Supabase (the built-in sender is rate-limited) and have the draft privacy notice and terms reviewed.

## Open business decision

- [ ] D21 — trademark search for the name "Lumio" before any brand, domain or marketing work.
