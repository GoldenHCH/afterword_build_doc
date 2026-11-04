# General Plan

<!-- High-level phases only. Detail goes in each phase file. -->

**Demo path (one sentence):** A note recorded over MCP becomes a briefing of papers and posts (app + email), the researcher saves what they like, and their AI reads the Library back over MCP.

## Phases

| # | Phase | Blocking? | Can run in parallel with | Plan file | Status |
|---|-------|-----------|--------------------------|-----------|--------|
| 01 | Data + shared types: Firestore collections (`users`, `notes`, `sources`, `items`, `briefings`, `library`), the `Afterword.Firestore.*` namespace, the `PaperSource` / `PostSource` interfaces, seed data for the demo account (notes, items, one pre-built briefing) | Yes | — | `phase-01-data.md` | |
| 02 | Find: Cloud Functions that fetch per open note — Paperclip adapter (OpenAlex fallback), X adapter (seeded-posts fallback) — then merge, de-duplicate, score and rank into a briefing document; the `buildBriefingNow` callable runs it | — | 03, 04, 05 | `phase-02-find.md` | |
| 03 | Brief: model writes the per-item "why this, for your bottleneck" and reading-order lines (prompts in `.constants.ts`, JSON validated), email template, send via the email provider, weekly scheduled function; extends `buildBriefingNow` with explain + send | — | 02, 04, 05 | `phase-03-brief.md` | |
| 04 | Web app: Google sign-in, Notes page ("describe instead" box → `describeWork` callable), Briefing page with Save (`saveItem` / `unsaveItem` callables), Library page, "Build my briefing now" button; loading, empty and error states on each | — | 02, 03, 05 | `phase-04-app.md` | |
| 05 | MCP: move note storage to Firestore per the phase 01 decision, add `search_library`, point `find_papers` at the `PaperSource` seam through a `searchPapers` function so it uses Paperclip too, keep the other tools' behavior | — | 02, 03, 04 | `phase-05-mcp.md` | |
| 06 | Last mile: audit, persona reviews, UI polish, mobile, live URL | — | — | — | |

Phases 02–05 build against the types and seed data from 01, so they don't wait on each other. 03 renders the seeded briefing until 02 produces a real one.

## Requirements from the brief

- Find out what the researcher is doing and where they are stuck (bottlenecks)
- Find content for that: papers through Paperclip, posts from thought leaders on X
- Summarize the content into an email tailored to the researcher
- A place for the researcher to save the recommended content they like
- Let the researcher's AI access the saved content through MCP, instead of digging through saved posts

## Cut on purpose

- GitHub and YouTube as sources — two adapters are enough to prove the pattern; the `PostSource` seam makes a third a nice-to-have, not a phase
- Reading path for entering a new area (the "learning map") — the briefing's reading order shows the idea; a dedicated five-paper path waits for the nice-to-have list
- Feedback (thumbs up / down) and per-note mute — no rubric criterion or demo step needs them
- Full-text PDF ingestion — abstract-level is enough to explain why a paper matters
- Scraping X — API or seeded posts, nothing else
- A second MCP server — extend the one that exists
