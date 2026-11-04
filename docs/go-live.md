# Go-live runbook

From an empty Google account to the live demo: the web app, the briefing email and the MCP connector. Every command runs from the repo root unless a step says otherwise. Nothing here needs a global install: the Firebase CLI and yarn come from `npx`.

Steps marked **OWNER** need your Google login, billing or your own keys; nobody else can do them.

Project id: `afterword-fyi`. Live app: https://afterword-fyi.web.app. Connector: https://afterword.fyi/mcp.

## Before you start

- Node 22 (`node -v`) and `npx` on the PATH.
- Keys in hand: an Anthropic API key (`ANTHROPIC_API_KEY`) and a Resend API key (`RESEND_API_KEY`) with the domain `afterword.fyi` verified in Resend (the sender is `briefing@afterword.fyi`).
- Newsletter repo PR #22 merged on its `main` (the connector code), and `vercel` logged in for the connector project.
- A folder outside the repo for keys, for example `~/afterword-keys/`. Nothing in it is ever committed.

## 1. Create the project **OWNER**

1. https://console.firebase.google.com → Add project → name it so the project id is `afterword-fyi` (if the id is taken, pick another and change it in `.firebaserc`, `app/src/environments/*.ts` and `AFTERWORD_API_ORIGIN` below).
2. Project overview → the gear → Usage and billing → Modify plan → **Blaze** (pay as you go). Cloud Functions, Secret Manager and Cloud Scheduler will not deploy on Spark.

## 2. Turn on Firestore and Auth **OWNER**

1. Build → Firestore Database → Create database → **Native mode**, production rules, a location near you (for example `nam5`). The location cannot be changed later. `firebase deploy` replaces the rules in step 7.
2. Build → Authentication → Get started → Sign-in method:
   - **Email/Password**: enable it. Required: the demo account signs in this way.
   - **Google**: optional. Enable it if you want the "Continue with Google" button to work. `afterword-fyi.web.app` is an authorized domain by default.

## 3. Log in to Firebase **OWNER**

```bash
npx -y firebase-tools@14 login
npx -y firebase-tools@14 projects:list
```

`projects:list` must show `afterword-fyi`. `.firebaserc` already points the default project at it.

## 4. Paste the web config

1. Firebase console → Project settings (the gear) → General → Your apps → Add app → Web (`</>`). Nickname `afterword`; skip Hosting setup; Register.
2. Copy three values from the `firebaseConfig` it shows: `apiKey`, `appId`, `messagingSenderId`.
3. Paste them into the `firebase` object in **`app/src/environments/environment.prod.ts`** (this is the one the deployed app uses). Do the same in `app/src/environments/environment.ts` if you want to run `yarn start` against the live project (it keeps `useEmulators: true`, so flip that flag too).
4. Leave `projectId` as is. `authDomain` and `storageBucket` stay empty: `app/src/app/core/firebase.ts` derives `authDomain` as `<projectId>.firebaseapp.com`, and the app does not use Storage.

These are public client identifiers, safe to commit. The security boundary is `firestore.rules`.

## 5. Set the secrets **OWNER**

Secrets live in Google Secret Manager; the CLI creates them. Only three exist as far as the deploy is concerned, and all three must be set before step 7, or the deploy stops and asks for the missing one.

| Secret | Required | Used by | What happens if it is wrong or missing |
|---|---|---|---|
| `ANTHROPIC_API_KEY` | yes | `describeWork`, `buildBriefingNow`, `weeklyBriefing` | Without it `describeWork` fails and briefings fall back to plain text lines with a warning. |
| `RESEND_API_KEY` | yes | `buildBriefingNow`, `weeklyBriefing` | The briefing is built but no email goes out; the app shows a warning. |
| `MCP_SHARED_KEY` | yes | `searchPapers`, `searchLibrary` | Every MCP call to these two functions gets `401`. Use the same value on Vercel (step 10). |
| `PAPERCLIP_API_KEY` | no | nothing | Not declared at all in this build: papers come from OpenAlex (`contentSources.PAPER = 'openalex'` in `functions/src/find/find.constants.ts`). To use Paperclip, set it to `'paperclip'`, set the secret, redeploy. If Paperclip then fails, search falls back to OpenAlex. |
| `X_BEARER_TOKEN` | no | nothing | Not declared at all in this build: posts come from the seeded X posts (`contentSources.POST = 'seed'`). To read live X posts, set it to `'x'`, set the secret, redeploy. |

The two optional secrets are only registered with the deploy when their source is switched on, so leaving them unset cannot fail a deploy.

```bash
npx -y firebase-tools@14 functions:secrets:set ANTHROPIC_API_KEY
npx -y firebase-tools@14 functions:secrets:set RESEND_API_KEY
```

Each prompts for the value (input is hidden). For `MCP_SHARED_KEY`, generate one and keep it in this shell, because step 10 needs the same value:

```bash
export MCP_SHARED_KEY="$(openssl rand -hex 32)"
printf '%s' "$MCP_SHARED_KEY" | npx -y firebase-tools@14 functions:secrets:set MCP_SHARED_KEY --data-file -
```

If you close the shell before step 10, read the value back with `npx -y firebase-tools@14 functions:secrets:access MCP_SHARED_KEY`.

## 6. Download a service-account key **OWNER**

Firebase console → Project settings → Service accounts → Generate new private key. Save the JSON as `~/afterword-keys/afterword-fyi-sa.json`. Never put it in the repo. Steps 8, 9 and 10 use it.

```bash
export GOOGLE_APPLICATION_CREDENTIALS="$HOME/afterword-keys/afterword-fyi-sa.json"
```

## 7. Build and deploy

```bash
npx -y firebase-tools@14 deploy --only firestore,functions,hosting --project afterword-fyi
```

This installs and builds `functions/` and `app/` itself (the predeploy hooks in `firebase.json`), deploys the rules and the 4 indexes, the 8 functions (all in `us-central1`, which the hosting rewrites need) and the web app.

- First deploy to a project: the CLI enables Cloud Functions, Cloud Build, Artifact Registry, Secret Manager and Cloud Scheduler for you, and may ask how long to keep container images; answer `1` (day).
- A permissions or "API not ready" error right after enabling APIs usually clears if you run the same command again a minute later.
- Indexes build in the background after deploy; the first Notes/Library load can show an error for a minute or two until they are `Enabled` (Firestore → Indexes).

Check: https://afterword-fyi.web.app loads and shows the sign-in page.

## 8. Create the demo auth user

The demo account is `demo@afterword.fyi` (uid `demo-researcher`). Pick a password of 8 or more characters; you type it into the sign-in page during the demo.

```bash
cd functions
npx -y yarn@1.22.22 install --frozen-lockfile
npx -y yarn@1.22.22 build
DEMO_PASSWORD='choose-a-password' npx -y yarn@1.22.22 demo:auth
cd ..
```

It prints `Created the demo user demo@afterword.fyi (uid demo-researcher).` The project comes from the service-account file in `GOOGLE_APPLICATION_CREDENTIALS`.

The briefing email goes to this user's address, so `demo@afterword.fyi` must be a mailbox you can actually open.

## 9. Seed the demo data

The app has no seed button, and the deployed `seedDemo` callable only accepts a signed-in demo user. Seed with the Admin SDK instead; it runs the same seeding code and is safe to run twice:

```bash
cd functions
npx -y yarn@1.22.22 seed:live
cd ..
```

It prints the counts: the demo user, 3 notes, 10 X sources, the cached posts and papers, about 15 more papers fetched live from OpenAlex (needs internet) and one `ready` briefing (`briefing_demo_seed`).

Alternative, calling the deployed callable with the demo user's ID token (`WEB_API_KEY` is the `apiKey` from step 4):

```bash
ID_TOKEN="$(curl -s "https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=WEB_API_KEY" \
  -H 'Content-Type: application/json' \
  -d '{"email":"demo@afterword.fyi","password":"choose-a-password","returnSecureToken":true}' | node -pe 'JSON.parse(require("fs").readFileSync(0)).idToken')"
curl -s "https://us-central1-afterword-fyi.cloudfunctions.net/seedDemo" \
  -H "Authorization: Bearer $ID_TOKEN" -H 'Content-Type: application/json' -d '{"data":{}}'
```

## 10. Connect the MCP connector (Newsletter repo, Vercel)

The connector is a separate repo, deployed on Vercel at https://afterword.fyi/mcp. It needs three environment variables in the Vercel project's **Production** environment. Run these in the same shell as step 5 (so `$MCP_SHARED_KEY` is set), from the Newsletter repo:

```bash
cd ~/Desktop/Newsletter-for-Researchers
vercel env add FIREBASE_SERVICE_ACCOUNT production < "$GOOGLE_APPLICATION_CREDENTIALS"
printf '%s' 'https://afterword-fyi.web.app' | vercel env add AFTERWORD_API_ORIGIN production
printf '%s' "$MCP_SHARED_KEY" | vercel env add MCP_SHARED_KEY production
vercel --prod
```

- `FIREBASE_SERVICE_ACCOUNT`: the service-account JSON as a string (or base64 of it). Notes go to the app's Firestore `notes/` and the reader is matched to the app by email.
- `AFTERWORD_API_ORIGIN`: the app's origin; `find_papers` and `search_library` call `/searchPapers` and `/searchLibrary` there.
- `MCP_SHARED_KEY`: the same value as the Firebase secret.

Environment variables only apply to new deployments, so redeploy (`vercel --prod`, or merge/push to its production branch) after adding them.

The assistant must connect with `demo@afterword.fyi`: that email maps to uid `demo-researcher`, so the notes it records show up in the demo account.

- Claude Code: `claude mcp add --transport http afterword https://afterword.fyi/mcp`, then `/mcp` to sign in.
- claude.ai: Customize → Connectors → Add custom connector → `https://afterword.fyi/mcp`.

## 11. Smoke test

1. Open https://afterword-fyi.web.app on a phone-sized window. Use the demo account: `demo@afterword.fyi` plus the password from step 8. You land on Notes.
2. Notes shows **3** open notes.
3. Briefing page: **Build my briefing now**. After a minute or two it opens a new briefing with items grouped under each note and a line on why each matters. A blue warning means the model or email fell back; a red banner means the build failed (check `npx -y firebase-tools@14 functions:log --only buildBriefingNow`).
4. The briefing email arrives in the `demo@afterword.fyi` inbox from `briefing@afterword.fyi`.
5. Save two papers: the button turns into **Saved**.
6. Library shows those two, grouped under their note.
7. In Claude, connected as `demo@afterword.fyi`: say "I'm stuck on intercoder reliability in my thematic analysis of interviews" (it calls `record_work`; a new note appears in Notes). Then "What did I save about intercoder reliability?" (it calls `search_library` and answers from the two saved papers).
8. Fallback if any live step is down: `/briefings/briefing_demo_seed` is a ready briefing with hand-written lines.

When all eight pass, tick the "Live" boxes in `plans/phase-06-last-mile.md` and put the verified URL in the README.

## Troubleshooting

| Symptom | Likely cause |
|---|---|
| Deploy stops with "no value for the secret" | A secret from step 5 is unset. Set it and re-run the deploy. |
| Deploy: "billing account required" or an API cannot be enabled | The project is still on Spark (step 1). |
| Sign-in page says the API key is invalid | The three web config values are empty or wrong in `environment.prod.ts`; redeploy hosting after fixing. |
| Notes or Library show an error right after deploy | The composite indexes are still building (Firestore → Indexes). |
| `seed:live` or `demo:auth` says it could not load default credentials | `GOOGLE_APPLICATION_CREDENTIALS` is not exported in this shell. |
| MCP `search_library` or `find_papers` returns 401 | `MCP_SHARED_KEY` differs between Firebase and Vercel, or Vercel was not redeployed after adding it. |
| MCP notes land in a different account | The assistant is signed in with an email other than `demo@afterword.fyi`. |
