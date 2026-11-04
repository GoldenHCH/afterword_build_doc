# Afterword for Paperclip — Working Context

**Event:** [hackathon name — fill in] · one night
**Format:** solo/small team · ~8 hours build · live demo
**Prize:** [fill in]

**Missing input:** `paperclip-context.md` is on the laptop (`~/Downloads`), not in this repo. Drop it into `brief/` and reconcile this file against it before Phase 02 starts.

---

## 1. The problem in one paragraph

Researchers and builders running agent teams on Paperclip already describe their work in issues, comments and goals, but nobody connects that stream to the literature. Finding the five papers that bear on what you are stuck on today means stopping work, opening Google Scholar and guessing keywords. Afterword already does the hard part (notes about what you're working on → research angle → recent papers from OpenAlex → weekly briefing), but today it only learns about your work when an assistant tells it. Paperclip is a live feed of exactly that signal.

## 2. The pitch (one sentence)

Afterword for Paperclip reads what you and your agents are working on and puts the five most relevant recent papers on the issue itself, with a line on why each one matters.

## 3. Judging rubric — everything follows from this

<!-- Fill in from the hackathon page. Until then, assume the usual split. -->

| Criterion | Weight | How we win it |
|-----------|--------|---------------|
| Demo / usability | high | Papers appear on the issue within seconds of writing it. No setup screen in the demo. |
| Technical execution | medium | Real Paperclip plugin (worker + UI), real OpenAlex data, events not polling. |
| Use of AI | medium | Model only at the edges: issue text → research angle; papers → one-line relevance. Search and ranking are code. |
| Originality / fit to sponsor | medium | Extends an existing product (Afterword) into the sponsor's platform instead of a standalone toy. |

## 4. Hard requirements

- Installs into a stock Paperclip instance with `paperclipai plugin install <path>`. No Paperclip core changes.
- Works on the issues a user already has. No extra data entry on the demo path.
- Papers come from OpenAlex, published in the last three years, with a DOI link each.
- Demo cannot depend on a live model call succeeding ([AI-11]): cached results for the seeded issues.

## 5. Data provided

- Paperclip plugin SDK, read from source: see `brief/paperclip-plugin-notes.md` (verified facts, with file paths into the Paperclip repo).
- OpenAlex works API: `https://api.openalex.org/works?search=...&filter=from_publication_date:YYYY-MM-DD&per-page=5` — public, no key, add `mailto=` for the polite pool.
- Afterword's existing MCP server (`find_papers`, `record_work`, `get_work_context`) proves the recommendation logic. Whether the plugin can call Afterword over HTTP is an open question (§10); default is to call OpenAlex directly from the worker.

## 6. Scope

### Must have (demo path)

- Plugin installs and an **Afterword** tab appears on every issue detail page.
- Worker listens to `issue.created`, `issue.updated`, `issue.comment.created`; builds the work context (title + description + latest comments); extracts `{ angle, keywords[] }`; searches OpenAlex; stores `{ angle, keywords, papers[], updatedAt }` in per-issue plugin state.
- Issue tab shows the angle, the keywords, and five paper cards: title, authors, year, venue, DOI link, start of abstract, one line on why it bears on this issue. Loading, empty ("Afterword hasn't read this issue yet") and error states ([HACK-15]). A **Refresh** action.
- Dashboard widget: "This week's reading" — the top papers across open issues, each linking back to its issue.
- Agent tool `afterword_find_papers({ about })` so an agent can pull papers mid-task; result returned to the agent and posted as a comment on the issue it is working.
- Seeded demo company with four realistic research issues and cached results.

### Nice to have

- `record_work` to the user's Afterword account so the weekly briefing picks up Paperclip work (needs an HTTP API or token).
- Comment annotation badge under a comment that triggered a new angle.
- Mark Afterword note resolved when the issue closes.
- Settings page: OpenAlex `mailto`, model key, years window.

### Explicitly out of scope

- Full-text PDFs, citation graphs, reading lists across companies.
- Publishing the plugin to npm. Local-path install only.
- Any change to Paperclip core or to Afterword's existing MCP server.
- Auth, multi-user, billing.

## 7. Demo script

1. Open the seeded company's dashboard. The "This week's reading" widget already shows papers for open work.
2. Create a new issue: *"Our two coders disagree on half the themes in the interview transcripts — need a defensible way to measure and improve agreement before the write-up."*
3. Open the issue, click the **Afterword** tab. Within seconds: angle "intercoder reliability in qualitative thematic analysis", keywords, five 2024–2026 papers with DOI links and a line each on why they help.
4. Add a comment steering the problem ("we're using reflexive thematic analysis, so maybe agreement isn't even the right goal"). Refresh: the angle and the papers shift.
5. Show an agent run that calls `afterword_find_papers` mid-task and leaves the papers as a comment.
6. Back to the dashboard: the new issue's papers are now in the week's reading.

## 8. AI approach

```
Issue text + comments → [AI] → { angle, keywords[] } → OpenAlex query (code) → top 5 (code) → [AI] → one line per paper
```

- Extraction and relevance lines are one Claude call each, JSON out, validated against a TypeScript interface, retry once ([AI-08]). Prompts live in `src/prompts.constants.ts` ([AI-10]).
- `ctx.agents.invoke` returns only a `runId` (fire-and-forget), so the worker calls the Claude API directly with `ctx.http.fetch`. Key comes from plugin config / `secrets.read-ref`, never the repo ([HACK-13]).
- Fallback with no key or a failed call: keywords from the issue title by stop-word removal, no relevance lines. The demo path never shows an error from the model ([AI-11]).
- Search, date filter, dedupe and ranking are code ([AI-03]).

## 9. Glossary

- **Paperclip** — open-source orchestration layer for teams of AI agents: companies, agents, issues, goals, heartbeats, plugins.
- **Plugin worker** — the Node process Paperclip runs for a plugin; subscribes to events, exposes data/actions/tools to the UI and to agents.
- **Slot** — a mount point in Paperclip's React UI a plugin component renders into (`detailTab`, `dashboardWidget`, …).
- **Afterword** — the existing paper-recommendation product: notes about your work → research angle → recent papers → weekly briefing.
- **Research angle** — the question a published paper could help with, phrased the way a paper would.
- **OpenAlex** — open catalogue of scholarly works with a free API.

## 10. Open questions

- What does `paperclip-context.md` add or contradict? (Drop it into `brief/`.)
- Hackathon rubric and hard requirements from the organiser page.
- Does Afterword expose an HTTP API or token the worker can call for `record_work`, or is it MCP-only? Decides whether the "weekly briefing" nice-to-have is a 30-minute job or cut.
- Is Node 24.11+ and pnpm 9.15+ installed on the demo laptop? Paperclip refuses to start otherwise.
