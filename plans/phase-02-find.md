# Phase 02 — Find

**Goal:** For every open note, fetch candidate papers and posts, score and rank them, and write a `ready` briefing — no model, no email yet — so the pipeline runs end to end on its own.
**Brief requirements covered:** "Find content for that: papers through Paperclip, posts from thought leaders on X"; the ranking half of "tailored".
**Depends on:** Phase 01 (types, seams, seeded notes and sources). Parallel with 03, 04, 05. Owns `functions/src/find/`. Does not touch `functions/src/brief/`, `app/` or the MCP.

## Checklist

### Paper sources
- [x] Confirm Paperclip: base URL, auth header, query shape, response fields (abstract? DOI? date?), rate limit. Put what you found in the PR description. Found: OpenAPI spec at `https://paperclip.gxl.ai/api/v1/openapi.json`; `POST /search` with `X-API-Key`; hits carry `doi`, `abstract`, `published_date`, `authors`; live call untested until `PAPERCLIP_API_KEY` is set, so `contentSources.PAPER` stays `openalex`
- [x] `paperclip-paper-source.service.ts` implements `IPaperSource`; secret `PAPERCLIP_API_KEY`; maps to `IItemDraft` with `provider: paperclip`, `externalId` = DOI (Paperclip's own id when there is none)
- [x] `openalex-paper-source.service.ts` implements `IPaperSource`: `GET https://api.openalex.org/works?search=…&filter=from_publication_date:…&per-page=…&mailto=…`, abstract start rebuilt from `abstract_inverted_index` — the same query `find_papers` uses today
- [x] `paper-source.factory.ts` picks by `contentSources.PAPER` in `find.constants.ts` (`paperclip | openalex`) `[FB-06]`. A Paperclip error logs with `logger.error` and falls back to OpenAlex for that one query

### Post sources
- [ ] Confirm X API access: tier, monthly read cap, bearer token. No paid tier by `[date]` → `contentSources.POST` stays `seed` and the demo runs on seeded posts `[HACK-06]`. Not confirmed: no token on hand, `POST` is `seed`; the adapter is written against the documented v2 endpoints and never run live
- [x] `x-post-source.service.ts` implements `IPostSource`: resolve handles → user ids once and cache them on `sources`; `GET /2/users/:id/tweets?start_time=…&max_results=…&tweet.fields=created_at,public_metrics`; secret `X_BEARER_TOKEN`; maps to `IItemDraft` with `provider: x`, `externalId` = post id, `url` = `https://x.com/{handle}/status/{id}`
- [x] `seeded-post-source.service.ts` implements `IPostSource` by reading `items` where `provider == seed` — same interface, so the switch is one constant
- [x] `post-source.factory.ts` picks by `contentSources.POST` (`x | seed`)

### Scoring and assembly (pure helpers, then one service)
- [x] `content-scoring.helper.ts` — `scoreItem(note, item, sourceWeight)` = 0.15 × recency (1 at 0 days, 0 at 365, linear) + 0.4 × keyword overlap (share of `note.keywords` whose every word stem is found in `title + text`, plus the handle's `topics` for posts) + 0.15 × source weight (`sources.weight` for posts, a constant for papers) + 0.3 × source rank (the paper's position in the OpenAlex result list, 1 for first, 0 for posts). Weights live in `find.constants.ts` `[TS-14]`
- [x] `content-scoring.helper.ts` — `pickSources(note, sources)`: sources whose `topics` overlap `note.keywords`; all sources when none overlap
- [x] One small test for `scoreItem` and the cross-note de-dup rule — the tricky pure logic `[HACK-10]`
- [x] `item-cache.service.ts`: upsert drafts into `items/` by the deterministic id; skip a note's fetch when its last fetch is under `fetchCooldownHours` (24)
- [x] `briefing-builder.service.ts` — `build(userId): Promise<string>`: load open notes; per note `paperSource.search({ angle: note.angle ?? note.summary, keywords, limit: 15, publishedAfter: 3 years, 8 for stuck and question notes })` and `postSource.recent({ handles: pickSources(…), since: 14 days, limit: 30 })`; score; keep the top 5 papers and top 3 posts per note (a post needs a keyword or handle-topic match; with none, the single newest post from the chosen handles); an item that scores under two notes stays only under its best; write `briefings/{id}` with `status: ready`, `rank`, `score`, item snapshots, and `whyThis` = `Matches: keyword, keyword` — the deterministic fallback phase 03 overwrites
- [x] Partial failure: a source that throws for one note logs and yields `[]`; the briefing still builds. Zero items overall → `status: failed` with a human-friendly `error` `[FB-03]`

### Entry point
- [x] Callable `buildBriefingNow` in `functions/src/find/functions/build-briefing-now.function.ts`: `[FB-01]`, `[FB-02]`; runs `briefingBuilder.build(uid)`; returns `{ briefingId }`; exported from `index.ts`; rewrite added to `firebase.json` (deferred: no `hosting` block exists yet, phase 04 adds it). Phase 03 extends this same function with explain + send — don't create a second one
- [x] `firebase-functions/logger` at each stage: notes found, items per source, items kept, time per source `[FB-07]`

## Done when

- [ ] (needs a Firebase project; not run) `buildBriefingNow` for the demo user writes a new `ready` briefing with papers and posts under each of the 3 seeded notes, each entry with `rank`, `score`, snapshot and the fallback `whyThis` — checked in the Firestore console
- [ ] (needs a Paperclip key; the fallback path was exercised in the dry run) Flipping `contentSources.PAPER` between `paperclip` and `openalex` changes `provider` on the papers; posts keep working either way
- [x] Committed and PR opened
