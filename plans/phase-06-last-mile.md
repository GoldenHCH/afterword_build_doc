# Phase 06 — Last mile

**Goal:** The demo path is audited, reviewed, polished and live at a URL a judge can touch.
**Brief requirements covered:** All five, as seen by a judge: the live app, the email, the MCP connector.
**Depends on:** Phases 01–05 (PRs #6 and #7 on `main`, Newsletter PR #22 on its `main`).

## Checklist

### Audit and reviews (no live project needed) `[HACK-19]` `[HACK-20]`
- [x] Audit against every brief requirement (`prompts/05-audit.md`), ranked fix list
- [x] Staff-architect persona review: structure, bugs, exposed keys, unvalidated input, missing auth checks
- [x] Fix the blocking findings from both

### Deploy readiness `[HACK-14]`
- [x] Firestore indexes match every query the app and the functions run; rules cover every collection the app touches
- [x] Hosting rewrites reach the functions (region, names); `firebase deploy` works end to end from a clean checkout (manifest checked offline; the real deploy needs the project)
- [x] A go-live runbook (`docs/go-live.md`): project creation, Blaze, Auth providers, secrets, web config, seed, demo auth user, Vercel env vars, smoke test

### UI polish `[HACK-21]` `[HACK-16]`
- [x] Sign-in, Notes, Briefing, Library: one primary action per screen, consistent spacing and type, loading / empty / error states, right at 375px
- [x] Nothing reads as a default template (before/after shots in `app/docs/ui-polish/`)

### Live (needs the owner: Google login, billing, keys)
- [ ] Firebase project `afterword-fyi` on Blaze, Firestore, Auth with Email/Password (+ Google), secrets set
- [ ] `firebase deploy` (functions, firestore, hosting) from `main`; demo auth user created; `seedDemo` run
- [ ] Newsletter PR #22 merged; Vercel env vars set; connector smoke test with a real assistant client
- [ ] UX-lead and sponsor persona reviews against the live URL; fix what loses a judge
- [ ] README live URL and demo flow verified word for word `[HACK-18]`

## Done when

- [ ] A judge can open the live URL on a phone, sign in with the demo account, build a briefing, save two papers, see them in the Library, and the assistant can search them over MCP
