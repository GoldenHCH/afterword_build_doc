# Afterword — Working Context

<!-- AGENTS.md points here; agents read it before building any feature. -->

**Event:** [name, date, location / online]
**Format:** [solo / team] · [build time] · [pitch length + Q&A]
**Prize:** [amount / bounty]

---

## 1. The problem in one paragraph

Researchers drown in arXiv and X. Field-wide digests (AlphaSignal and the like) tell everyone in the field the same thing, and nobody tells a researcher which paper to read first for the problem on their desk this week. The bottleneck is stated out loud all the time — to an AI assistant, mid-session — and then lost. Whatever the researcher does find and like ends up in a bookmarks folder their AI assistant can't see, so the next session starts from zero again.

## 2. The pitch (one sentence)

Afterword turns what a researcher is stuck on this week into a briefing of the papers and posts that move it forward, in reading order, and a saved library their AI can reach over MCP.

## 3. Judging rubric — everything follows from this

<!-- Fill from the event page before building. Weights decide where hours go ([HACK-01]). -->

| Criterion | Weight | How we win it |
|-----------|--------|---------------|
| [criterion] | [%] | |
| [criterion] | [%] | |
| [criterion] | [%] | |

## 4. Hard requirements

- Find out what the researcher is doing and where they are stuck (bottlenecks)
- Find content for that: papers through Paperclip, posts from thought leaders on X
- Summarize the content into an email tailored to the researcher
- A place for the researcher to save the recommended content they like
- Let the researcher's AI access the saved content through MCP, instead of digging through saved posts

## 5. Data provided

No files from the event. Everything comes from APIs or is seeded.

| Source | What it gives us | Status |
|--------|------------------|--------|
| Afterword MCP (exists) | Notes: `working_on` / `stuck` / `question`, each with a research angle and keywords (`record_work`, `get_work_context`, `resolve_work`, `forget_work`) | Live |
| Paperclip | Paper search for a research angle | [API, auth, rate limits — confirm] |
| OpenAlex | Paper search, free, no key; what `find_papers` uses today | Live — the fallback behind Paperclip |
| X API | Recent posts from a curated list of thought-leader accounts | [paid tier needed to read timelines — confirm budget] |
| Email provider | Sending the briefing | [Resend / Mailgun — pick and get a key] |

## 6. Scope

### Must have (demo path)

- **Capture.** Notes arrive from the researcher's AI assistant over the existing MCP (`record_work`). The web app also has a "describe instead" box that produces the same note shape.
- **Find.** For each open note: papers via Paperclip (OpenAlex behind a swap seam), posts from a curated X thought-leader list (seeded posts behind the same kind of seam if API access falls through). Merge, de-duplicate, score by recency and source.
- **Brief.** One briefing per researcher: items grouped per note, in reading order, each with a one-line "why this, for your bottleneck". Sent as a real email and shown in the app. Weekly by schedule; a "Build my briefing now" button for the demo.
- **Save.** One click on any item in the briefing (app) saves it to the Library. Library page lists saved items with the note they came from.
- **Ask.** The MCP gets a `search_library` tool so the researcher's AI can answer "what did I save about X?" from the Library. `resolve_work` closes the loop when the bottleneck is solved.
- Sign-in (Google), one demo account with seeded notes and a pre-built briefing so a slow API or model can't break the demo.

### Nice to have

- GitHub repos and YouTube videos as sources
- Reading path for a `question` note: five papers ordered foundational → frontier (the "learning map" for entering a new area)
- Thumbs up / down on items to tune the next briefing
- Per-note mute ("stop sending me things about this")
- `save_item` MCP tool so the AI can save on the researcher's behalf

### Explicitly out of scope

- Scraping X or any site without an API
- Full-text PDF ingestion or paper summarization beyond the abstract
- Social features, sharing, teams
- Native mobile app
- Building a second MCP server — extend the existing one

## 7. Demo script

1. In Claude (or Cursor), the researcher says "I'm stuck on intercoder reliability in my thematic analysis of interviews." The assistant calls `record_work` → "Saved to Afterword."
2. Open the Afterword web app. The Notes page shows the open note with its angle and keywords.
3. Click **Build my briefing now**. Loading → the briefing: papers from Paperclip and posts from X, grouped under the note, in reading order, each with one line on why it matters for this bottleneck.
4. Switch to the inbox: the same briefing landed as an email.
5. Save two papers from the briefing. Open the Library: they're there, tagged with the note.
6. Back in Claude: "What did I save in Afterword about intercoder reliability?" → the assistant calls `search_library` and answers from the Library. "Mark that solved." → `resolve_work`; the note disappears from next week's briefing.

## 8. AI approach

<!-- Model at the edges (rules/ai.md). Rules decide; the model adapts input and explains output. -->

- **Unstructured → structured (model):** free text about a research problem → a note (`kind`, `summary`, `angle`, `keywords`). Over MCP the assistant already does this; the in-app "describe instead" box calls a Cloud Function that returns the same shape, validated against the shared `Note` type.
- **Code:** fetching from Paperclip / OpenAlex / X, de-duplication, scoring (recency, source weight, keyword overlap with the note), ranking, reading order, briefing assembly, email rendering, saving, Library search (Firestore query + keyword match).
- **Structured → unstructured (model):** for each selected item, one line of "why this, for your bottleneck" and a one-line reading-order rationale. The model never decides what goes in; the scorer does.
- Prompts live in `.constants.ts`; model calls happen in Cloud Functions; the demo account's briefing is cached so the demo doesn't depend on a live call.

## 9. Glossary

- **Note** — one thing the researcher is working on, stuck on, or asking (what `record_work` saves).
- **Angle** — the research question a published paper could help with; what we search against.
- **Item** — one piece of content: a paper or a post (later a repo or a video).
- **Briefing** — the weekly set of items for one researcher, grouped per note, in reading order. Delivered as email and in the app.
- **Reading order** — the order to consume items within a note: start here, then this.
- **Library** — the items the researcher saved. What `search_library` searches.
- **Thought-leader list** — the curated X accounts we read posts from.
- **Paperclip** — the paper search service behind "Find"; OpenAlex sits behind the same interface as a fallback.

## 10. Open questions

- Paperclip: what is the API, auth and rate limit, and does it return abstracts? Until confirmed, OpenAlex (already wired in the MCP) is the implementation behind the `PaperSource` seam.
- X API: reading posts from a list of accounts needs a paid tier. Budget it, or seed real posts for the demo and keep the fetch adapter behind the `PostSource` seam.
- Email provider and sending domain (Resend?).
- Where does the existing MCP server run, and how does it reach Firestore — same Firebase project, or a separate service with a shared API?
- Hackathon rubric, format and pitch length (section 3).
