# AGENTS.md - Claude Code Configuration

## Project Overview

<!-- Replace this section at kickoff. Keep it to a few lines — details live in brief/. -->

**Afterword** is an Angular 21+ (standalone components), Angular Material, SCSS application backed by Firebase Cloud Functions (TypeScript) and Firestore, built for **[Hackathon Name]**. It turns what a researcher is stuck on (captured by their AI assistant over the existing Afterword MCP) into a weekly briefing of papers (Paperclip) and X posts, in reading order, sent by email; the researcher saves what they like, and their AI searches that library back over MCP.

**Key files:**
- `brief/brief.md` — challenge, judging rubric, required features, demo script. Read it before touching any feature.
- `plans/00-general.md` — phases and which one is blocking.

---

## Sibling Repo: the MCP Connector and afterword.fyi

Afterword ships from two repos. This one holds the plan, the Angular app (`app/`), the Cloud Functions and Firestore. [GoldenHCH/Newsletter-for-Researchers](https://github.com/GoldenHCH/Newsletter-for-Researchers), checked out at `/Users/goldenhuang/Desktop/Newsletter-for-Researchers`, holds the MCP connector (`api/mcp.js`: `record_work`, `find_papers`, `search_library`, …), its OAuth, and the Vercel project that serves https://afterword.fyi. Sessions here can read and edit it (`additionalDirectories` in `.claude/settings.json`). Its own rules are in its `CLAUDE.md`: npm and vitest, not yarn.

| To change… | Edit |
|------------|------|
| What the assistant's tools do or say | `api/mcp.js` in the connector repo |
| The papers `find_papers` returns, or what `search_library` finds | `functions/src/mcp/` here (`searchPapers`, `searchLibrary`) |
| The header, the request caps, or the note document's fields and values | `functions/src/mcp/connector.contract.json` here, its TS constants (`yarn test` fails until they match), and the connector's copies in the same sitting (its next Vercel build fails until they match) |
| A new app route | `app/src/app/app.routes.ts` here and the `rewrites` in the connector repo's `vercel.json` |

- Functions and Firestore deploy from here with `firebase deploy`. The app at afterword.fyi is built from this repo's `main` by the connector repo's Vercel build, so an app change goes live only when that project redeploys.
- The connector writes notes straight into Firestore `notes/` with `source: "mcp"` and calls `searchPapers` / `searchLibrary` over HTTP with the `MCP_SHARED_KEY` secret. Both sides must hold the same key.

---

## Hackathon Mode

This is a hackathon build. Ship the demo, not the test suite. Read `rules/hackathon.md` first — it overrides any stricter rule elsewhere.

---

## Rule Files

Rules use the format `[CATEGORY-##]`. **Read only the files relevant to your task** — do not load all of them.

| File | Categories | Load when… |
|------|-----------|------------|
| `rules/hackathon.md` | HACK | Always — scope, speed, testing stance, last mile |
| `rules/ai.md` | AI | Any feature that calls a model, or deciding where AI belongs |
| `rules/typescript.md` | CMT, TS, PKG, ERR, file organization, shared types | Any TypeScript work |
| `rules/angular.md` | ANG, MAT | Frontend components or templates |
| `rules/scss.md` | SCSS, theme variables | Styling work |
| `rules/ui.md` | UI, cards, page headers, forms, side panels | UI components or patterns |
| `rules/firebase.md` | FB | Cloud Functions or Firestore |
| `rules/git.md` | GIT | Commits or PRs |

**Example**: a Cloud Function task → read `rules/hackathon.md` + `rules/typescript.md` + `rules/firebase.md`. Skip the rest.

---

## Agent Workflow

- `[AGT-01]` Do NOT use the `superpowers:subagent-driven-development` skill — it's too slow for a hackathon clock. Implement plans directly.
- `[AGT-02]` DO use subagents to parallelize independent work (e.g., backend function + frontend screen, or research while building). Use `superpowers:dispatching-parallel-agents` or the Agent tool directly.
- `[AGT-03]` Use `superpowers:brainstorming` for scoping a new feature, and `superpowers:systematic-debugging` for bugs. Skip `superpowers:test-driven-development` (see `[HACK-08]`).

### Planning in Layers

- `[AGT-04]` The general plan lives in `plans/00-general.md`: high-level phases only, designed to run in parallel, with the blocking phase marked and built first.
- `[AGT-05]` Deep-plan one phase at a time in `plans/phase-##-[name].md` before building it. Keep it a checklist, not an essay.
- `[AGT-06]` One phase per session: plan, build, skim, commit, PR — then start a new session for the next phase. Long sessions drift and forget the brief.
- `[AGT-07]` At the start of a phase session, read the brief, the general plan, and that phase's plan — not the whole repo.

---

## Universal Rules

- Always include a newline at the end of files
- Do NOT add comments to TypeScript code (`[CMT-01]`) — code should be self-documenting
- Only commit or push when explicitly asked (`[GIT-04]`)
