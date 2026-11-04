# Phase 03 — Brief

**Goal:** Turn a ready briefing into something a researcher reads: one line per item on why it matters for their bottleneck, reading order inside each note, a real email in their inbox, and a weekly schedule.
**Brief requirements covered:** "Summarize the content into an email tailored to the researcher"; the "in reading order" promise of the pitch.
**Depends on:** Phase 01 (types, the seeded `ready` briefing). Parallel with 02, 04, 05. Owns `functions/src/brief/`. Until phase 02 merges, run against the seeded briefing.

## Checklist

### Explain (model at the edge — `rules/ai.md`)
- [ ] `brief.constants.ts`: model id (`claude-sonnet-5-5`), `maxEntriesPerCall`, the prompt `[AI-10]`, `[TS-13]`. The prompt gets the note (`kind`, `summary`, `detail`, `angle`, `keywords`) and the section's entries (`itemId`, `kind`, `title`, `authors`, `publishedAt`, `text`) and asks for JSON: `{ entries: [{ itemId, whyThis, readingNote }], order: itemId[] }` — `whyThis` ≤ 25 words, second person, names the bottleneck; `readingNote` ≤ 12 words on why this position ("start here: defines the measure", "after #1: applies it to interviews")
- [ ] `briefing-explainer.service.ts`: one model call per section; validate against `IExplainResponse` in `brief.interfaces.ts` — every `itemId` exists in the section and `order` is a permutation of them — else retry once, then keep phase 02's fallback `whyThis` and score order `[AI-08]`. Secret `ANTHROPIC_API_KEY` `[AI-09]`
- [ ] Reorder `entries` by `order`, rewrite `rank`, write back to the briefing. Never add or drop an entry: the scorer decides what's in, the model explains and orders `[AI-05]`
- [ ] Log tokens and latency per section `[FB-07]`

### Email
- [ ] `briefing-email.helper.ts` (pure, `[TS-14]`): `IBriefing` → `{ subject, html, text }`. Subject: `Afterword: 8 for “[first note summary]”` (+ ` and 2 more notes`). Body: one greeting line; per note a heading (`noteSummary`, kind as a small label); entries in rank order with rank, linked title, authors or @handle, date, `whyThis`, `readingNote` in italics, and a **Save** link to `${appUrl}/briefings/${briefingId}?save=${itemId}`. Footer: link to the app and "Solved it? Tell your assistant and it leaves next week's briefing." Table-based HTML, inline styles, under 100 KB, reads on a phone
- [ ] `email.service.ts`: Resend `POST /emails` with secret `RESEND_API_KEY`, from `briefing@[domain]`; stores `sentAt` and the provider message id on the briefing; provider errors parsed into human-friendly messages `[ERR-01]`
- [ ] `yarn email:preview` renders the seeded briefing to `tmp/briefing.html` (gitignored) so the template is iterated without sending

### Orchestration
- [ ] `send-briefing.service.ts` — `explainAndSend(briefingId)`: explain → email → `sentAt`
- [ ] Extend phase 02's `buildBriefingNow` (coordinate on the merge): after `build`, run `explainAndSend`. Any failure after `build` leaves the briefing `ready` with fallback text and returns a human-friendly `warning` instead of throwing, so the demo button never shows a wall `[AI-11]`, `[FB-03]`
- [ ] `weeklyBriefing` scheduled function — `onSchedule('every monday 07:00', { timeZone: '[tz]' })`: every user with at least one open note → build → `explainAndSend`; one user's failure is logged and the loop continues
- [ ] Both exported from `index.ts`, secrets declared on the functions that use them

### Demo safety
- [ ] The seeded briefing is already `ready` with hand-written lines: if the model or Resend is down on stage, step 4 of the demo shows the previously sent email and the app shows the seeded briefing. Write this fallback into README's demo shortcuts `[HACK-18]`

## Done when

- [ ] `buildBriefingNow` on the demo account produces `whyThis` and `readingNote` on every entry, entries reordered, and an email with those lines lands in the demo inbox and reads correctly on a phone
- [ ] With the model key removed, the same call still returns a briefing (fallback text) plus a `warning`
- [ ] Committed and PR opened
