# General Plan

**Demo path (one sentence):** A researcher writes an issue in Paperclip describing what they're stuck on; the Afterword tab on that issue shows five recent papers with a line on why each one helps, and the dashboard rolls them up into this week's reading.

## Phases

| # | Phase | Blocking? | Can run in parallel with | Plan file | Status |
|---|-------|-----------|--------------------------|-----------|--------|
| 01 | Toolchain + scaffold: Paperclip running, plugin installed, stub tab visible, shared types | Yes | — | `phase-01-scaffold.md` | |
| 02 | Worker: events → work context → angle + keywords → OpenAlex → per-issue state; `papers` data, `refresh` action, agent tool | No | 03 | `phase-02-worker.md` | |
| 03 | UI: issue detail tab + dashboard widget, loading/empty/error states, against the Phase 01 fixture data | No | 02 | `phase-03-ui.md` | |
| 04 | Seed + last mile: demo company, cached results, README, demo rehearsal, mobile check | — | — | `phase-04-last-mile.md` | |

Rough clock for one night (8h): 01 = 1.5h · 02 ∥ 03 = 2.5h · 04 = 1.5h · 2.5h buffer for the thing that breaks (it will be Node 24 or esbuild).

Phase 02 and 03 meet on the `AfterwordIssueState` type and the `papers` data payload defined in Phase 01. Neither phase changes that contract without updating `src/types.ts` first.

## Requirements from the brief

- Installs into a stock Paperclip instance with `paperclipai plugin install <path>`. No Paperclip core changes.
- Works on the issues a user already has. No extra data entry on the demo path.
- Papers come from OpenAlex, published in the last three years, with a DOI link each.
- Demo cannot depend on a live model call succeeding: cached results for the seeded issues.
- Afterword tab on every issue detail page: angle, keywords, five paper cards (title, authors, year, venue, DOI link, abstract start, one-line relevance), loading/empty/error, Refresh.
- Worker reacts to `issue.created`, `issue.updated`, `issue.comment.created`.
- Dashboard widget "This week's reading" across open issues, linking back to issues.
- Agent tool `afterword_find_papers({ about })`, result also posted as a comment.
- Seeded company with four realistic research issues.

## Cut on purpose

- Publishing to npm; Afterword `record_work` sync (until the HTTP API question is answered); comment annotations; settings page beyond the auto-generated form; closing issues → resolving Afterword notes; PDFs and citation graphs.
