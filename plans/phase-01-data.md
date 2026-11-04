# Phase 01 — Data + shared types

**Goal:** One Firestore data model and one set of shared types that phases 02–05 build against in parallel, plus a seeded demo account so every later phase has real-looking data from minute one.
**Brief requirements covered:** All five indirectly — nothing on the demo path works without this. Directly: "a place for the researcher to save the recommended content they like" (the `library` collection).
**Depends on:** The note-storage decision below. Nothing else.

## Decision first (ask if unclear, `[HACK-07]`)

- [ ] **Where notes live.** The MCP's `record_work` / `get_work_context` already store notes, with integer ids, somewhere. Recommended: Firestore becomes the one store — the MCP server reads and writes `notes/` through the Admin SDK, note ids become Firestore document ids, and phase 05 changes the MCP's `id` params from integer to string. Fallback if the MCP's store can't move this weekend: phase 02 mirrors open notes into `notes/` at briefing time through an endpoint on the MCP backend, and `notes/` is read-only for the app. Write the choice here: **[decision]**

## Checklist

### Project skeleton
- [ ] `firebase.json`, `.firebaserc`, `firestore.rules`, `firestore.indexes.json`; `functions/` (TypeScript, yarn, `--exact` `[PKG-01]`). Phase 04 owns `app/` — scaffold it only if 04 hasn't started
- [ ] Secrets declared on the project, values set outside the repo (`[HACK-13]`, `[FB-05]`): `PAPERCLIP_API_KEY`, `X_BEARER_TOKEN`, `RESEND_API_KEY`, `ANTHROPIC_API_KEY`, `MCP_SHARED_KEY`
- [ ] `functions/src/constants.ts`: `collections` lookup (`collections.NOTES = 'notes'` …), `demoUser` (uid, email) `[TS-19]`

### Firestore collections — `Afterword.Firestore.*` in `functions/lib/firestore/index.d.ts` and `app/src/types/firestore.d.ts` (`[TS-10]`, namespace pattern in `rules/typescript.md`)
- [ ] `users/{uid}` — `User.IUser`: `id?`, `email`, `displayName`, `createdAt`
- [ ] `notes/{noteId}` — `Note.INote`: `id?`, `userId`, `kind: NoteKind` (`working_on | stuck | question`), `summary`, `detail?`, `angle?`, `keywords: string[]`, `project?`, `status: NoteStatus` (`open | resolved`), `source: NoteSource` (`mcp | app`), `createdAt`, `resolvedAt?`. Field names match `record_work`'s arguments exactly
- [ ] `sources/{sourceId}` — `Source.ISource`: `id?`, `kind: 'x_account'`, `handle`, `displayName`, `topics: string[]`, `weight` (0–1), `createdAt`. The curated thought-leader list, global
- [ ] `items/{itemId}` — `Item.IItem`: `id?`, `kind: ItemKind` (`paper | post`), `externalId` (DOI or post id), `url`, `title`, `text` (abstract start or post text), `authors: string[]`, `publishedAt`, `provider: ItemProvider` (`paperclip | openalex | x | seed`), `sourceHandle?`, `fetchedAt`. Document id is deterministic — `${kind}_${sha1(externalId)}` — so a re-fetch never duplicates
- [ ] `briefings/{briefingId}` — `Briefing.IBriefing`: `id?`, `userId`, `status: BriefingStatus` (`building | ready | failed`), `builtAt`, `sentAt?`, `error?`, `sections: IBriefingSection[]`. `IBriefingSection`: `noteId`, `noteSummary`, `noteKind`, `entries: IBriefingEntry[]`. `IBriefingEntry`: `itemId`, `rank`, `score`, `whyThis`, `readingNote?`, plus an item snapshot (`kind`, `title`, `url`, `authors`, `publishedAt`, `sourceHandle?`) so the UI and the email need no joins
- [ ] `library/{libraryItemId}` — `Library.ILibraryItem`: `id?`, `userId`, `itemId`, `noteId?`, `noteSummary?`, `briefingId?`, `keywords: string[]` (copied from the note), `whyThis`, `savedAt`, plus the same item snapshot
- [ ] Literal unions in `.types.ts`, const lookups in `.constants.ts` (`noteKinds.STUCK`, `itemKinds.PAPER` …) `[TS-12]`, `[TS-13]`
- [ ] `firestore.rules`: signed-in users read their own `notes`, `briefings`, `library` and write their own `notes` and `library`; `items` and `sources` read-only; `briefings`, `items`, `sources` written by functions only
- [ ] `firestore.indexes.json`: `notes (userId, status, createdAt desc)`, `briefings (userId, builtAt desc)`, `library (userId, savedAt desc)`, `library (userId, noteId, savedAt desc)`

### API contracts — `Afterword.Types.*` in `functions/lib/types/index.d.ts`
- [ ] `IDescribeWorkRequest { text }` → `IDescribeWorkResponse { note: Pick<INote, 'kind' | 'summary' | 'detail' | 'angle' | 'keywords' | 'project'> }`
- [ ] `IBuildBriefingNowRequest {}` → `IBuildBriefingNowResponse { briefingId, warning? }`
- [ ] `ISaveItemRequest { briefingId, itemId }` → `ISaveItemResponse { libraryItemId }`
- [ ] `IUnsaveItemRequest { libraryItemId }` → `IUnsaveItemResponse {}`
- [ ] `ISearchLibraryRequest { userId, query?, noteId?, limit? }` → `ISearchLibraryResponse { items: ILibraryItem[] }` (phase 05 calls this from the MCP)

### Source seams (interfaces only — phase 02 implements them)
- [ ] `functions/src/find/services/paper-source.interfaces.ts`: `IPaperQuery { angle, keywords, limit, publishedAfter }`, `IPaperSource { search(query: IPaperQuery): Promise<IItemDraft[]> }`
- [ ] `functions/src/find/services/post-source.interfaces.ts`: `IPostQuery { handles, since, limit }`, `IPostSource { recent(query: IPostQuery): Promise<IItemDraft[]> }`
- [ ] `IItemDraft` = `IItem` without `id` and `fetchedAt`

### Seed data (`functions/src/seed/`, callable `seedDemo`, demo uid only) `[HACK-17]`
- [ ] The demo user
- [ ] 3 notes: `stuck` — "Intercoder reliability in thematic analysis of interviews" with angle and keywords; one `working_on`; one `question`. Written the way a researcher says them, not like test data
- [ ] 8–10 `sources`: the X handles the user names — `[handles]` until then — each with `topics` and a `weight`
- [ ] ~15 papers fetched live from OpenAlex at seed time for the three angles (real titles, DOIs, dates, authors). Never typed in by hand
- [ ] ~6 posts: real posts copied with their URL, handle and date, or posts from a demo account. Never invented text under a real person's name
- [ ] One `briefings` document for the demo user, `status: ready`, three sections, `whyThis` and `readingNote` written by hand — this is the cached demo briefing `[AI-11]`
- [ ] `yarn seed` (or a `firebase functions:shell` recipe) written into README's demo shortcuts `[HACK-18]`

### Hand-off
- [ ] Paste the collection names, type names and seam interfaces into the PR description — phases 02–05 copy from there, not from memory
- [ ] `rules/typescript.md`: Firestore namespace set to `Afterword.Firestore` (per-project swap)

## Done when

- [ ] `yarn build` passes in `functions/`, and the shared types resolve from both `functions/` and `app/`
- [ ] `seedDemo` run once: the Firestore console shows the demo user, 3 notes, the sources, the items and one `ready` briefing
- [ ] Committed and PR opened
