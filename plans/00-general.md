# General Plan

**Demo path (one sentence):** A researcher writes an issue in Paperclip describing what they're stuck on; the Afterword tab on that issue shows five recent papers from Afterword's `find_papers`, an agent on the issue refines the search in its own words and explains each paper in a comment, and the dashboard rolls them up into this week's reading.

## Phases

| # | Phase | Blocking? | Can run in parallel with | Plan file | Status |
|---|-------|-----------|--------------------------|-----------|--------|
| 01 | Toolchain + scaffold: Paperclip running, plugin installed, stub tab visible, shared types, fixture | Yes | — | `phase-01-scaffold.md` | |
| 02 | Worker: Afterword client (`find_papers` over JSON-RPC), issue events with debounce, per-issue state, `papers` and `reading-list` data, `refresh` action, `afterword_find_papers` agent tool that also comments | No | 03, 03b | `phase-02-worker.md` | |
| 03 | UI: issue detail tab + dashboard widget, loading/empty/error states, built against the Phase 01 fixture | No | 02, 03b | `phase-03-ui.md` | |
| 03b | Connect account (nice-to-have, 2h timebox): settings page "Connect Afterword" → OAuth PKCE → callback API route → tokens in plugin state → `record_work` from the worker and an `afterword_record_work` tool. Fallback: pasted refresh token from a dev script in the Afterword repo | No | 02, 03 | `phase-03b-connect.md` | |
| 04 | Seed + last mile: demo company, cached results, README, demo rehearsal, mobile check | — | — | `phase-04-last-mile.md` | |

Rough clock for one night (8h): 01 = 1.5h · 02 ∥ 03 ∥ 03b = 2.5h · 04 = 1.5h · 2.5h buffer for the thing that breaks (it will be Node 24, esbuild, or the OAuth redirect).

Phases 02, 03 and 03b meet on the `AfterwordIssueState` type and the `papers` data payload defined in Phase 01. Nobody changes that contract without updating `src/types.ts` first.

Afterword repo (`Newsletter-for-Researchers`) changes, each its own small PR, only if time allows: `structuredContent` on `find_papers`; a dev-only token-minting script for the demo account.

## Requirements from the brief

- Installs into a stock Paperclip instance with `paperclipai plugin install <path>`. No Paperclip core changes.
- Works on the issues a user already has. No extra data entry on the demo path.
- Papers come from Afterword's `find_papers` (OpenAlex, last three years, DOI link each). The plugin does not call OpenAlex or a model itself.
- Demo cannot depend on a live network call succeeding: cached results for the seeded issues.
- Afterword tab on every issue detail page: what was searched, five paper cards (title, authors, year, DOI link, abstract start), loading/empty/error, Refresh.
- Worker reacts to `issue.created`, `issue.updated`, `issue.comment.created`, debounced on a content hash.
- Dashboard widget "This week's reading" across open issues, linking back to issues.
- Agent tool `afterword_find_papers({ about, why? })`: proxies to Afterword, stores on the issue as the agent's search, posts a comment.
- Seeded company with four realistic research issues.

## Cut on purpose

- Calling OpenAlex or a model from the plugin; publishing to npm; comment annotations; `resolve_work` on close; PDFs and citation graphs; any Paperclip core change. Phase 03b is cut first if the clock slips.
