# Afterword for Paperclip — Working Context

**Event:** [hackathon name — fill in] · one night
**Format:** solo/small team · ~8 hours build · live demo
**Prize:** [fill in]

**Missing input:** `paperclip-context.md` is on the laptop (`~/Downloads`), not in this repo. Drop it into `brief/` and reconcile this file against it before Phase 02 starts.

**Existing product:** Afterword lives in `GoldenHCH/Newsletter-for-Researchers` (deployed at afterword.fyi). It already has the paper engine and a hosted MCP connector. The plugin is a client of it. See `brief/paperclip-plugin-notes.md`, "Afterword connector".

---

## 1. The problem in one paragraph

Researchers and builders running agent teams on Paperclip already describe their work in issues, comments and goals, but nobody connects that stream to the literature. Finding the five papers that bear on what you are stuck on today means stopping work, opening Google Scholar and guessing keywords. Afterword already does the hard part: `find_papers` turns a problem in plain words into five recent OpenAlex papers re-ranked by embedding similarity, and notes about what you're working on steer a weekly briefing. Today Afterword only learns about your work when Claude or ChatGPT tells it. Paperclip is a live feed of exactly that signal, and its agents are assistants that can call the same connector.

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
- Papers come from Afterword's `find_papers` (OpenAlex, last three years, DOI link each). The plugin does not call OpenAlex or a model itself.
- Demo cannot depend on a live network call succeeding ([AI-11]): cached results for the seeded issues.

## 5. Data provided

- Paperclip plugin SDK, read from source: see `brief/paperclip-plugin-notes.md` (verified facts, with file paths into the Paperclip repo).
- Afterword's hosted connector: `POST https://afterword.fyi/mcp`, stateless JSON-RPC. `find_papers` needs no sign-in (20 calls an hour per address). `record_work`, `get_work_context`, `resolve_work` need an OAuth token for the reader's account. Code: `api/mcp.js`, `src/connector.js`, `src/oauth.js`, `src/oauthServer.js` in the Afterword repo.
- `find_papers` already does the extraction: it takes up to ten content words of `about`, searches OpenAlex, and re-ranks 25 candidates by embedding similarity when the server has an OpenAI key. An issue title plus its first sentences is a fine `about`.
- Afterword's own `/account` page shows the notes and has a Pause switch, so the "weekly briefing" half of the demo is visible there.

## 6. Scope

### Must have (demo path)

- Plugin installs and an **Afterword** tab appears on every issue detail page.
- Worker listens to `issue.created`, `issue.updated`, `issue.comment.created`; builds `about` from the issue title and description (clipped to 500 characters, redacted); calls Afterword `find_papers`; stores `{ about, papers[], source: "issue" | "agent", updatedAt }` in per-issue plugin state. Debounced on a content hash so edits don't burn the hourly limit.
- Issue tab shows what Afterword searched for and five paper cards: title, authors, year, DOI link, start of abstract. Loading, empty ("Afterword hasn't read this issue yet") and error states ([HACK-15]). A **Refresh** action.
- Dashboard widget: "This week's reading" — the latest papers across open issues, each linking back to its issue.
- Agent tool `afterword_find_papers({ about, why? })`: the agent writes the research angle in its own words (it is the model at the edge), the plugin proxies to Afterword, returns the papers to the agent, stores them on the issue with `source: "agent"` and the agent's `why`, and posts them as a comment.
- Seeded demo company with four realistic research issues and cached results.

### Nice to have

- **Connect Afterword account** from the plugin settings page (OAuth with PKCE against afterword.fyi, loopback redirect into a plugin API route). Then: agent tool `afterword_record_work` and worker `record_work` on `issue.created`, so Paperclip work shows up on afterword.fyi/account and steers the weekly briefing. Fallback for the demo: a token minted by a dev script in the Afterword repo.
- `resolve_work` when an issue closes.
- `structuredContent` on Afterword's `find_papers` response so the plugin parses JSON instead of the text block (small change in the Afterword repo, `api/mcp.js`).
- Comment annotation badge under a comment that triggered a new search.

### Explicitly out of scope

- Full-text PDFs, citation graphs, reading lists across companies.
- Publishing the plugin to npm. Local-path install only.
- Any change to Paperclip core. Afterword changes only as listed in nice-to-have.
- Calling OpenAlex or a model from the plugin. Afterword's connector does both.
- Auth, multi-user, billing.

## 7. Demo script

1. Open the seeded company's dashboard. The "This week's reading" widget already shows papers for open work.
2. Create a new issue: *"Our two coders disagree on half the themes in the interview transcripts — need a defensible way to measure and improve agreement before the write-up."*
3. Open the issue, click the **Afterword** tab. Within seconds: five 2024–2026 papers with DOI links and abstract starts, under "Afterword searched for: …".
4. Assign the issue to an agent. It calls `afterword_find_papers` with the angle in its own words ("intercoder reliability in reflexive thematic analysis") and a line per paper on why it helps. The tab updates to the agent's search; the comment shows the papers.
5. Back to the dashboard: the new issue's papers are now in the week's reading.
6. If the account is connected: open afterword.fyi/account and show the note Paperclip saved, which the Monday briefing ranks against.

## 8. AI approach

```
Issue title + description (code) ──────────────► Afterword find_papers (content words → OpenAlex → embedding re-rank) ─► 5 papers
Paperclip agent on the issue  ─[AI: angle, why]─► afterword_find_papers tool ─► same ─► papers + why, as comment + tab
```

- No model runs inside the plugin. The agent already working the issue is the model at the edge ([AI-01]): it writes the research angle and the one-line relevance. The worker's own path is pure code: clip, redact, send.
- `ctx.agents.invoke` returns only a `runId`, so the worker never waits on an agent. It searches on its own as soon as the issue exists and lets agents improve the result later.
- Afterword's connector is the deterministic part ([AI-03]): content words, OpenAlex filters, dedupe, embedding re-rank. The plugin treats its answer as data.
- No keys in the plugin for the must-have path. The account token for the nice-to-have lives in plugin state, never in the repo ([HACK-13]).
- Cached results for the seeded issues so a slow connector cannot break the demo ([AI-11]).

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
- Settled: Afterword's HTTP surface is the stateless MCP endpoint at `/mcp`; a plain JSON-RPC POST works (see notes). `record_work` needs an OAuth token; the connect flow is the nice-to-have.
- Does the OAuth consent page accept a redirect to `http://127.0.0.1:3100/...`? `src/oauth.js` ignores the port for loopback, so it should. Needs one manual try before Phase 03b is committed to.
- `find_papers` returns a text block. Parse it in the plugin, or add `structuredContent` on the Afterword side first? Recommend the Afterword change: ten lines and a test.
- Is Node 24.11+ and pnpm 9.15+ installed on the demo laptop? Paperclip refuses to start otherwise.
- The cloud session cannot reach afterword.fyi or docs.paperclip.ing. Live checks against the connector happen from the laptop.
