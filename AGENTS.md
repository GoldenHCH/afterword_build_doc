# AGENTS.md - Claude Code Configuration

## Project Overview

<!-- Replace this section at kickoff. Keep it to a few lines — details live in brief/. -->

**Afterword for Paperclip** is a Paperclip plugin (TypeScript: Node worker + React 19 UI via `@paperclipai/plugin-sdk`) that reads what a researcher and their agents are working on in Paperclip issues and surfaces the five most relevant recent papers from OpenAlex on the issue itself, built for **[Hackathon Name]** in one night.

The plugin code lives in its own repo scaffolded by `paperclipai plugin init`; this repo holds the brief, plans and rules.

**Key files:**
- `brief/brief.md` — challenge, judging rubric, required features, demo script. Read it before touching any feature.
- `brief/paperclip-plugin-notes.md` — verified Paperclip SDK facts and repo paths. The docs site is unreachable from cloud sessions; read this instead.
- `plans/00-general.md` — phases and which one is blocking.

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
| `rules/ui.md` | UI, cards, page headers, forms, side panels | Plugin UI components. Ignore the Angular Material specifics; the patterns (cards, states, headers) still apply to the React slots |
| `rules/angular.md`, `rules/scss.md`, `rules/firebase.md` | — | Not used for this build (Paperclip plugin, not Angular/Firebase). Do not load |
| `rules/git.md` | GIT | Commits or PRs |

**Example**: a worker task → read `rules/hackathon.md` + `rules/typescript.md` + `rules/ai.md` + `brief/paperclip-plugin-notes.md`. A UI slot task → `rules/hackathon.md` + `rules/typescript.md` + `rules/ui.md` + the notes. Skip the rest.

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
