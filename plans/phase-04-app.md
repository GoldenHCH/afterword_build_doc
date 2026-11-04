# Phase 04 — Web app

**Goal:** The screens the judge touches — Notes, Briefing (with Save and "Build my briefing now"), Library — each with loading, empty and error states, right at phone width.
**Brief requirements covered:** "A place for the researcher to save the recommended content they like"; the app side of "find out what the researcher is doing" (the describe-instead box); the visible side of the briefing.
**Depends on:** Phase 01 (types, seeded data). Parallel with 02, 03, 05. Owns `app/` and the callables `describeWork` (`functions/src/notes/`), `saveItem` and `unsaveItem` (`functions/src/library/`).

## Checklist

### Callables (functions/)
- [x] `describeWork` in `functions/src/notes/` (model call, validated, retried once, nothing written; the app saves the note with `source: app`)
- [x] `saveItem` / `unsaveItem` in `functions/src/library/`
- [x] `npx -y yarn@1.22.22 demo:auth` creates the demo Auth user (see README, Demo account sign-in)

### Scaffold
- [x] Angular 21 standalone app in `app/` (Material, SCSS, yarn, `--exact`); Firebase Hosting target; `firebase deploy` works on day one `[HACK-14]` (hosting block and build done; the deploy itself still needs the Firebase CLI, login and the web config)
- [x] Global class prefix `aw-`: rename `app-` in `rules/ui.md` and `styles.scss`; theme colors set once in `rules/scss.md`
- [x] Shared components the rules assume — `ScreenToolbarComponent`, `AlertBannerComponent`, `SidePanelComponent`, `LoadingService` — created in `shared/` the first time each is needed (`[ANG-05]`–`[ANG-07]`)
- [x] Google sign-in (`core/services/auth.service.ts`), auth guard, `/sign-in`; first sign-in creates `users/{uid}` (plus the demo email/password path)
- [x] Routes: `/notes`, `/briefings`, `/briefings/:id`, `/library`; bottom nav on mobile, side nav on desktop (placeholder pages; `/briefings` redirecting to the latest briefing is the briefing session's job)

### Notes page (`app/src/app/notes/`)
- [x] `notes.service.ts`: live query of `notes` where `userId == me` and `status == open`, newest first; `resolve(noteId)`
- [x] List: kind label (Stuck / Working on / Question), `summary`, `angle` muted, `keywords` as chips, a small icon for `source` (assistant vs. typed here); **Resolve** sets `status` and `resolvedAt`
- [x] **Describe instead** → `SidePanelComponent` with one textarea → callable `describeWork` (model: unstructured → structured; prompt in `notes.constants.ts`; output validated against `IDescribeWorkResponse`, retry once, then a friendly error `[AI-08]`) → the draft shown with editable summary and keywords → **Save note** writes with `source: app`. Async submit pattern `[UI-12]`–`[UI-15]`
- [x] Empty state: "Nothing here yet. Tell your assistant what you're stuck on, or describe it here." with the Describe button. Load failure → alert banner

### Briefing page (`app/src/app/briefings/`)
- [ ] `briefings.service.ts`: latest briefing for me; by id; `buildNow()` calls `buildBriefingNow`
- [ ] Header: "Your briefing", built date, **Build my briefing now** (`mat-flat-button`, inline spinner while running `[UI-02]`, navigates to the new briefing when done); a `warning` in the response shows as an info banner, not an error
- [ ] One section per note: `noteSummary` with the kind label; entries in `rank` order as cards — rank, kind icon (paper / post), linked title (new tab), authors or @handle, date, `whyThis`, `readingNote` in italics, **Save** toggle (`mat-stroked-button`, becomes "Saved" with a check)
- [ ] `?save=<itemId>` (the email's Save link) saves on load and scrolls to that entry
- [ ] No briefing yet → one sentence and the Build button. `status: failed` → its `error` in an alert banner plus the Build button. Page loads through `LoadingService` `[UI-01]`

### Library page (`app/src/app/library/`)
- [x] `library.service.ts`: live query of `library` where `userId == me`, newest first; `save(briefingId, itemId)` and `unsave(libraryItemId)` call the callables
- [x] Callables `saveItem` / `unsaveItem` in `functions/src/library/functions/`: `[FB-02]`; copy the entry's snapshot, `whyThis`, `noteId`, `noteSummary` and the note's `keywords` into `library/`; a repeat save returns the existing id
- [x] List grouped by `noteSummary`; each item: kind icon, linked title, `whyThis`, saved date, **Remove**; filter chips by kind
- [x] Empty state: "Save something from your briefing and it shows up here — and in your assistant."

### Polish that is on the demo path
- [ ] Every page: loading, empty, error `[HACK-15]`; checked at 375px `[HACK-16]`
- [ ] README: live URL, demo account, demo flow step by step, the `?save=` shortcut `[HACK-18]`

## Done when

- [ ] Signed in as the demo user: Notes shows the 3 seeded notes; Build my briefing now produces a briefing (or the seeded one with a warning); Save on two papers; Library shows both under their note; all three pages look right at 375px
- [ ] Deployed to the live URL
- [ ] Committed and PR opened
