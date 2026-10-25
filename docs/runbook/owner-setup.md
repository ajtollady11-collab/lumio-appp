# Owner setup checklist

Steps only the account owner can take. Claude never needs passwords or secret keys pasted into chat: secrets are entered directly into the GitHub, Vercel or Supabase dashboards.

## Done

- [x] GitHub repository `ajtollady11-collab/lumio-appp` created and connected to Claude.
- [x] Vercel and Supabase accounts connected to Claude (read access confirmed 25 Oct 2026).

## Before M1b (deployments)

- [ ] Decide whether the repository stays public. Recommended: **private**, so business plans and specifications can live in `docs/`. GitHub → repo → Settings → General → Danger Zone → Change visibility.
- [ ] Approve Claude creating a **new** Vercel project for this repo (do not reuse the old `lumio-app` project).
- [ ] After the first merge to `main`, protect the branch: require a pull request, require the `Quality`, `Build and end-to-end` and `Secret scan` checks, block force pushes. Claude can apply this on request.

## Before M1c (data and auth)

- [ ] Confirm that the Supabase organisation currently connected to Claude is the one Lumio should use (Claude shows its name in chat, not in this public file).
- [ ] Approve Claude creating `lumio-staging` and `lumio-production` projects in a London or EU region. Supabase Pro is needed for production (spec §14).

## Open business decision

- [ ] D21 — trademark search for the name "Lumio" before any brand, domain or marketing work.
