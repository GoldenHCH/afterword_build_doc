# Paperclip plugin SDK — verified notes

Read from the Paperclip source (`github.com/paperclipai/paperclip`, cloned 2026-11-03). `docs.paperclip.ing` is not reachable from Claude cloud sessions, so phase sessions should read this file and the repo paths below instead of the docs site.

## Where to read in the Paperclip repo

| What | Path |
|------|------|
| SDK README (manifest, events, jobs, slots, capabilities) | `packages/plugins/sdk/README.md` |
| Worker context types (`ctx.issues`, `ctx.http`, `ctx.state`, …) | `packages/plugins/sdk/src/types.ts` |
| UI hooks | `packages/plugins/sdk/src/ui/hooks.ts` |
| Reference plugin using every surface | `packages/plugins/examples/plugin-kitchen-sink-example/src/{manifest,worker}.ts`, `src/ui/index.tsx` |
| Local dev loop | `doc/plugins/LOCAL_PLUGIN_DEVELOPMENT.md` |
| Authoring guide | `doc/plugins/PLUGIN_AUTHORING_GUIDE.md` |
| Spec | `doc/plugins/PLUGIN_SPEC.md` |
| Community plugins to crib from (Slack, Telegram are the smallest) | `github.com/gsxdsm/awesome-paperclip` |

## Toolchain

- Node.js 24.11+ and pnpm 9.15+.
- Run Paperclip from a local checkout: `git clone … && pnpm install && pnpm dev` (UI + API on `http://localhost:3100`, embedded Postgres created automatically). `npx paperclipai@latest onboard --yes` also works for a plain instance, but the scaffolder snapshots the SDK from a local checkout, so clone anyway.
- Scaffold: `paperclipai plugin init @afterword/paperclip-plugin --output ~/dev/paperclip-plugins --template default --category automation` (or `npx @paperclipai/create-paperclip-plugin`). Produces `src/manifest.ts`, `src/worker.ts`, `src/ui/index.tsx`, esbuild watch config, Vitest config.
- Dev loop: `pnpm install && pnpm dev` in the plugin (esbuild watch → `dist/manifest.js`, `dist/worker.js`, `dist/ui/`), then `paperclipai plugin install /abs/path/to/plugin`. Paperclip watches `dist/` and reloads the worker on rebuild. `paperclipai plugin list` / `plugin inspect <key>` show status and the last error.
- Plugin `package.json` carries `"paperclipPlugin": { "manifest": "./dist/manifest.js", "worker": "./dist/worker.js", "ui": "./dist/ui/" }`.
- Plugin UI is React 19, same-origin, trusted code. Worker is a Node process talking JSON-RPC to the host.

## Manifest (`PaperclipPluginManifestV1`)

Fields we need: `id`, `apiVersion: 1`, `version`, `displayName`, `description`, `author`, `categories`, `capabilities`, `entrypoints: { worker, ui }`, `instanceConfigSchema` (JSON Schema → auto settings form), `tools[]`, `ui.slots[]`.

Capabilities for this build:

```
issues.read, issue.comments.read, issue.comments.create, projects.read, companies.read,
events.subscribe, http.outbound, secrets.read-ref, plugin.state.read, plugin.state.write,
agent.tools.register, instance.settings.register,
ui.detailTab.register, ui.dashboardWidget.register
```

Slots: `{ type: "detailTab", id, displayName, exportName, entityTypes: ["issue"] }` and `{ type: "dashboardWidget", id, displayName, exportName }`. `exportName` is a named export of `src/ui/index.tsx`.

## Worker API (what we actually call)

```ts
import { definePlugin, runWorker } from "@paperclipai/plugin-sdk";

const plugin = definePlugin({
  async setup(ctx) {
    ctx.events.on("issue.created", handler);          // event.entityId = issue id, event.companyId
    ctx.events.on("issue.updated", handler);
    ctx.events.on("issue.comment.created", handler);  // entity is the issue

    await ctx.issues.get(issueId, companyId);         // title, description, status, projectId
    await ctx.issues.listComments(issueId, companyId);
    await ctx.issues.createComment(issueId, { body }, companyId);
    await ctx.issues.list({ companyId, limit, offset: 0 });

    await ctx.http.fetch(url, init);                  // needs http.outbound; plain fetch also allowed

    await ctx.state.get({ scopeKind: "issue", scopeId: issueId, stateKey: "afterword" });
    await ctx.state.set({ scopeKind: "issue", scopeId: issueId, stateKey: "afterword" }, value);

    ctx.data.register("papers", async (params) => …);      // UI reads via usePluginData("papers", params)
    ctx.actions.register("refresh", async (params) => …);  // UI calls via usePluginAction("refresh")

    ctx.tools.register("afterword_find_papers", { displayName, description, parametersSchema }, async (params, runCtx) => {
      // runCtx.companyId, runCtx.issueId (the task the agent is on)
      return { content: "markdown for the agent", data: { papers } };
    });
  },
});
export default plugin;
runWorker(plugin, import.meta.url);
```

Gotchas:
- `ctx.agents.invoke(agentId, companyId, { prompt })` returns `{ runId }` only. It cannot be used as a synchronous model call. Call the Claude API with `ctx.http.fetch` instead.
- Events fire on every edit. Debounce per issue (hash of title+description+last comment; skip if unchanged) or the worker will hammer OpenAlex.
- Host APIs are capability-gated. A missing capability shows up as an error in `paperclipai plugin inspect`, not at build time.
- `ctx.assets` is not supported yet. Don't store anything there.

## UI API

```ts
import { useHostContext, usePluginData, usePluginAction, useHostNavigation, type PluginDetailTabProps, type PluginWidgetProps } from "@paperclipai/plugin-sdk/ui";

export function AfterwordIssueTab({ context }: PluginDetailTabProps) {
  // context.companyId, context.entityId (issue id), context.entityType === "issue"
  const papers = usePluginData<PapersData>("papers", { issueId: context.entityId, companyId: context.companyId });
  const refresh = usePluginAction("refresh");
}
export function AfterwordDashboardWidget({ context }: PluginWidgetProps) { /* context.companyId */ }
```

Shared host components exist in `@paperclipai/plugin-sdk/ui` (`MarkdownEditor`, `FileTree`, pickers). Plain React + CSS is fine.

## OpenAlex

```
GET https://api.openalex.org/works
  ?search=<keywords joined by space>
  &filter=from_publication_date:2023-11-01,has_abstract:true
  &sort=relevance_score:desc
  &per-page=5
  &select=id,doi,title,display_name,publication_year,authorships,primary_location,abstract_inverted_index,cited_by_count
  &mailto=<contact>
```

Abstracts come as `abstract_inverted_index` (word → positions); rebuild the first ~60 words in code. Afterword's own `find_papers` uses the same three-year window and five results, so the plugin matches what the briefing shows.
