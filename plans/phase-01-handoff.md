# Phase 01 hand-off

Copy from here, not from memory. Sources: `functions/lib/firestore/index.d.ts`, `functions/lib/types/index.d.ts`, `functions/src/constants.ts`, `functions/src/shared/*`, `functions/src/find/services/*`, `functions/src/seed/*`. The frontend mirror is `app/src/types/firestore.d.ts` (uses the client `Timestamp`).

## Collections and document ids

`collections` in `functions/src/constants.ts`:

| Constant | Collection | Document id |
|---|---|---|
| `collections.USERS` | `users` | the Auth uid (`demoUser.UID` = `demo-researcher` for the demo) |
| `collections.NOTES` | `notes` | `note_<key>` for seeded notes (`note_intercoder`, `note_vla-finetuning`, `note_mamba-recall`); auto id for notes created later |
| `collections.SOURCES` | `sources` | the X handle, e.g. `tri_dao` |
| `collections.ITEMS` | `items` | `itemDocId(kind, externalId)` = `${kind}_${sha1(externalId)}` (`functions/src/shared/item-id.helper.ts`). `externalId` is the bare lowercase DOI (`10.…`) for papers, the post id for posts |
| `collections.BRIEFINGS` | `briefings` | `briefing_demo_seed` for the seeded one; auto id for built ones |
| `collections.LIBRARY` | `library` | auto id |

## Firestore interfaces (`Afterword.Firestore.*`)

All dates are `Timestamp`.

- `User.IUser`: `id?`, `email`, `displayName`, `createdAt`
- `Note.INote`: `id?`, `userId`, `kind: NoteKind`, `summary`, `detail?`, `angle?`, `keywords: string[]`, `project?`, `status: NoteStatus`, `source: NoteSource`, `createdAt`, `resolvedAt?`
  - `NoteKind` = `'working_on' | 'stuck' | 'question'`; `NoteStatus` = `'open' | 'resolved'`; `NoteSource` = `'mcp' | 'app'`
- `Source.ISource`: `id?`, `kind: 'x_account'`, `handle`, `displayName`, `topics: string[]`, `weight` (0–1), `createdAt`
- `Item.IItem`: `id?`, `kind: ItemKind`, `externalId`, `url`, `title`, `text`, `authors: string[]`, `publishedAt`, `provider: ItemProvider`, `sourceHandle?`, `fetchedAt`
  - `ItemKind` = `'paper' | 'post'`; `ItemProvider` = `'paperclip' | 'openalex' | 'x' | 'seed'`
- `Item.IItemSnapshot`: `kind`, `title`, `url`, `authors`, `publishedAt`, `sourceHandle?` (no `text`)
- `Briefing.IBriefing`: `id?`, `userId`, `status: BriefingStatus`, `builtAt`, `sentAt?`, `error?`, `sections: IBriefingSection[]`
  - `BriefingStatus` = `'building' | 'ready' | 'failed'`
- `Briefing.IBriefingSection`: `noteId`, `noteSummary`, `noteKind: NoteKind`, `entries: IBriefingEntry[]`
- `Briefing.IBriefingEntry` (extends `IItemSnapshot`): `itemId`, `rank`, `score`, `whyThis`, `readingNote?`
- `Library.ILibraryItem` (extends `IItemSnapshot`): `id?`, `userId`, `itemId`, `noteId?`, `noteSummary?`, `briefingId?`, `keywords: string[]`, `whyThis`, `savedAt`

## API contracts (`Afterword.Types.*`)

- `IDescribeWorkRequest { text }` → `IDescribeWorkResponse { note: Pick<INote, 'kind' | 'summary' | 'detail' | 'angle' | 'keywords' | 'project'> }`
- `IBuildBriefingNowRequest {}` → `IBuildBriefingNowResponse { briefingId, warning? }`
- `ISaveItemRequest { briefingId, itemId }` → `ISaveItemResponse { libraryItemId }`
- `IUnsaveItemRequest { libraryItemId }` → `IUnsaveItemResponse {}`
- `ISearchLibraryRequest { userId, query?, noteId?, limit? }` → `ISearchLibraryResponse { items: ILibraryItem[] }`
- `ISeedDemoRequest {}` → `ISeedDemoResponse { users, notes, sources, items, briefings }` (counts)
- Aliases: `Afterword.Types.INote`, `Afterword.Types.ILibraryItem`

## Seams (phase 02 implements)

- `functions/src/find/services/item-draft.types.ts`: `IItemDraft = Omit<Afterword.Firestore.Item.IItem, 'id' | 'fetchedAt'>`
- `functions/src/find/services/paper-source.interfaces.ts`: `IPaperQuery { angle, keywords, limit, publishedAfter: Date }`; `IPaperSource { search(query: IPaperQuery): Promise<IItemDraft[]> }`
- `functions/src/find/services/post-source.interfaces.ts`: `IPostQuery { handles: string[], since: Date, limit }`; `IPostSource { recent(query: IPostQuery): Promise<IItemDraft[]> }`
- Reusable OpenAlex code: `functions/src/seed/services/openalex.helper.ts` (`buildOpenAlexWorksUrl`, `extractContentWords`, `rebuildAbstract`, `firstWords`, `normalizeDoi`, `toPaperDraft`) and `openalex-seed.service.ts`.

## Const lookups (`[TS-19]`, with literal-union types in `functions/src/shared/*.types.ts`)

- `collections`: `USERS`, `NOTES`, `SOURCES`, `ITEMS`, `BRIEFINGS`, `LIBRARY`
- `demoUser`: `UID` (`demo-researcher`), `EMAIL` (`demo@afterword.fyi`), `DISPLAY_NAME` (`Demo Researcher`)
- `noteKinds`: `WORKING_ON`, `STUCK`, `QUESTION`
- `noteStatuses`: `OPEN`, `RESOLVED`
- `noteSources`: `MCP`, `APP`
- `itemKinds`: `PAPER`, `POST`
- `itemProviders`: `PAPERCLIP`, `OPENALEX`, `X`, `SEED`
- `briefingStatuses`: `BUILDING`, `READY`, `FAILED`
- Secrets are declared in `functions/src/secrets.constants.ts`.

## Known for phases 02–05

- **Seeded posts use `provider: 'x'`, not `'seed'`.** A phase 02 `seeded-post-source` must read `items` where `kind == 'post'` and `provider in ['x', 'seed']`.
- **Briefing entry snapshots have no `text`.** Phase 03 must load the abstract or post text from `items` by `itemId`.
- **`users/demo-researcher` is a Firestore document only.** Phase 04 must also create the Auth user with that uid, or map sign-in to it; `seedDemo` rejects any other uid.
- **Reseeding merges** (`set` with `{ merge: true }`). It does not clear `resolvedAt`, `sentAt` or `error` set after demo interactions, and it resets `createdAt`/`builtAt`/`fetchedAt` to the seed time. Run it against a fresh project before a demo.
- **Seed check without a project:** `cd functions && npx -y yarn@1.22.22 build && npx -y yarn@1.22.22 seed:dry` (49 documents, live OpenAlex calls).
