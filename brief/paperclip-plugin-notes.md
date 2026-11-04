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
| Afterword connector, OAuth server, paper search | `Newsletter-for-Researchers`: `api/mcp.js`, `src/connector.js`, `src/oauth.js`, `src/oauthServer.js`, `test/mcp.test.js` |

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
events.subscribe, http.outbound, plugin.state.read, plugin.state.write,
agent.tools.register, instance.settings.register,
ui.detailTab.register, ui.dashboardWidget.register
```

Add `api.routes.register` for the OAuth callback route if Phase 03b is built.

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
- `ctx.agents.invoke(agentId, companyId, { prompt })` returns `{ runId }` only. It cannot be used as a synchronous model call. The plugin needs none: Afterword's `find_papers` does the extraction, and agents call the tool themselves.
- Events fire on every edit. Debounce per issue (hash of title+description; skip if unchanged) or the worker will spend Afterword's 20 calls an hour in a minute.
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

## Afterword connector (the paper engine)

Repo: `GoldenHCH/Newsletter-for-Researchers`. Production: `https://afterword.fyi`. Design doc: `docs/designs/reader-work-connector.md`. Not reachable from Claude cloud sessions (proxy 403); test from the laptop.

### find_papers, no sign-in

Stateless Streamable HTTP, JSON answers, no session id, one JSON-RPC message per POST (a batch gets 400). Send the 2025 protocol header so the stateless leg answers (the tests in `test/mcp.test.js` do this):

```http
POST https://afterword.fyi/mcp
content-type: application/json
accept: application/json, text/event-stream
mcp-protocol-version: 2025-11-25

{"jsonrpc":"2.0","id":1,"method":"tools/call",
 "params":{"name":"find_papers","arguments":{"about":"intercoder reliability in qualitative thematic analysis of interviews"}}}
```

- `about`: 3 to 500 characters. The server keeps up to ten content words for the OpenAlex search, then re-ranks 25 candidates by embedding similarity to the whole `about` (`src/connector.js` `findPapers`). So send the issue title and the first sentences of the description, redacted, clipped to 500.
- Returns `result.content[0].text`, the block `formatPapers` writes: `"5 papers from OpenAlex, published in the last three years:\n\n1. Title\n   Authors · Year\n   https://doi.org/...\n   First 60 words of the abstract…"`. On error `result.isError: true` with a plain sentence.
- Limits: 20 calls an hour per caller or address (`CALLS_PER_HOUR`). Debounce per issue on a hash of title + description, cache in plugin state, and seed the demo issues.
- Each paper (`toPaper`): `{ title, authors: "A, B, C et al.", year, url: "https://doi.org/…", abstract }`. No venue, no citation count.
- Recommended Afterword-side change (nice-to-have): add `structuredContent: { papers }` next to the text in `findPapersTool` (`api/mcp.js`) so the plugin parses JSON. Until then, parse the numbered block.

### Work notes, with the reader's account

`record_work`, `get_work_context`, `resolve_work`, `forget_work` need `Authorization: Bearer <access token>` with scope `work`. Without it: 401 with a `WWW-Authenticate` challenge.

OAuth 2.1 server at the same origin (`src/oauth.js`, `src/oauthServer.js`):

| Step | Endpoint | Notes |
|------|----------|-------|
| Register | `POST /oauth/register` with `{ client_name, redirect_uris }` | Dynamic registration, shown as "Unverified app" on consent. 10 an hour per IP. |
| Authorize | `GET /oauth/authorize?response_type=code&client_id&redirect_uri&scope=work offline_access&state&code_challenge&code_challenge_method=S256&resource=https://afterword.fyi/mcp` | Reader signs in with the email code, then Allow. Code lasts 60 s. |
| Token | `POST /oauth/token` form-encoded `grant_type=authorization_code&code&redirect_uri&client_id&code_verifier` | Access token 1 h, refresh token 30 days, rotates on use. Reusing a spent refresh token revokes the family. |
| Refresh | `POST /oauth/token` `grant_type=refresh_token&refresh_token&client_id` | |

Redirect URIs match exactly, except loopback (`localhost`, `127.0.0.1`), where the port is ignored. Local Paperclip is `http://127.0.0.1:3100`, so a plugin API route such as `http://127.0.0.1:3100/api/plugins/afterword.paperclip-plugin/api/oauth/callback` (declared in `manifest.apiRoutes` with `auth: "board"`, capability `api.routes.register`) can receive the code. The route answers JSON only; say "Connected. Close this tab." in the body.

Note limits: 30 a day, 200 open per account; `summary` ≤ 300 chars, `angle` ≤ 300, up to 8 keywords. Notes are written by assistants and treated as untrusted data on the Afterword side.

Demo fallback if the connect flow slips: a dev-only script in the Afterword repo that calls `issueTokens` for the demo account and prints the pair once. Paste the refresh token into the plugin settings.

### OpenAlex, for reference only

The plugin does not call OpenAlex. Afterword's `src/connector.js` `searchUrl` is the query it runs: `search=<content words>`, `filter=from_publication_date:<3 years ago>,has_doi:true,has_abstract:true,type:article|conference-paper|preprint|…`, `per-page=30`, `select=id,doi,title,publication_year,authorships,abstract_inverted_index`.
