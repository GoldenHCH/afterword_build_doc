# Phase 01 — Toolchain + scaffold

**Goal:** Paperclip runs locally, the Afterword plugin is installed from a local path, an empty "Afterword" tab renders on an issue, and the shared types both later phases build against exist.
**Brief requirements covered:** installs into stock Paperclip; tab on every issue.
**Depends on:** Node 24.11+, pnpm 9.15+ on the laptop. Check first: `node -v && pnpm -v`.

## Checklist

- [ ] Clone Paperclip next to this repo: `git clone https://github.com/paperclipai/paperclip.git && cd paperclip && pnpm install && pnpm dev`. Confirm `http://localhost:3100` loads and a company exists (onboarding wizard).
- [ ] Scaffold outside the Paperclip checkout: `paperclipai plugin init @afterword/paperclip-plugin --output ../paperclip-plugins --template default --category automation --display-name "Afterword" --description "Recent papers for what you're working on"`.
- [ ] `pnpm install && pnpm dev` in the plugin. `dist/manifest.js`, `dist/worker.js`, `dist/ui/` appear.
- [ ] `paperclipai plugin install /abs/path/paperclip-plugins/paperclip-plugin` → `paperclipai plugin list` shows `afterword.paperclip-plugin` ready. Read the "Target Paperclip" line.
- [ ] Manifest: id `afterword.paperclip-plugin`, capabilities from `brief/paperclip-plugin-notes.md`, slots `detailTab` (issue) + `dashboardWidget`, `instanceConfigSchema` with `afterwordOrigin` (default `https://afterword.fyi`) and `postAgentComments` (default true).
- [ ] `src/types.ts`: the contract both phases use.
  ```ts
  export interface Paper { title: string; authors: string; year: number | null; url: string; abstractStart: string; why: string | null }
  export interface AfterwordIssueState { about: string; source: "issue" | "agent"; papers: Paper[]; sourceHash: string; updatedAt: string; status: "ready" | "pending" | "error"; error?: string }
  export interface PapersData { issueId: string; state: AfterwordIssueState | null }
  export interface ReadingListData { items: Array<{ issueId: string; issueTitle: string; paper: Paper }> }
  ```
- [ ] `src/fixtures.ts`: one realistic `AfterwordIssueState` so Phase 03 can build the UI before Phase 02 lands. Get it by calling `find_papers` once from the laptop with the request in the notes, `about` = "intercoder reliability in qualitative thematic analysis of interviews", and pasting the five papers.
- [ ] `src/afterword.ts`: the one function both later phases call, `findPapers(about: string): Promise<Paper[]>`, stubbed to return the fixture. Phase 02 fills it in (POST to `/mcp`, parse the numbered block).
- [ ] Worker stub: `ctx.data.register("papers", …)` returns the fixture; `ctx.data.register("reading-list", …)` returns three fixture rows; `ctx.actions.register("refresh", …)` no-op.
- [ ] UI stub: `AfterwordIssueTab` renders "Afterword" + the fixture angle; `AfterwordDashboardWidget` renders a title. Open an issue, see the tab.
- [ ] Commit the plugin repo (it is its own repo, not this docs repo). Note the absolute paths in `README.md` here.

## Done when

- [ ] Open any issue in local Paperclip → **Afterword** tab shows the fixture angle.
- [ ] `paperclipai plugin inspect afterword.paperclip-plugin` shows no error.
- [ ] Committed and PR opened.
