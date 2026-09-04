# agalist

A multi-user shopping-list web app: sign up, and every account gets its own private list. Hebrew UI, sections (per store if you like), bought/missing states, and realtime sync across devices. Usable through the UI or the HTTP API below.

Stack: Vite + React 19, Supabase (Postgres + Auth + Realtime), deployed on Vercel.

## Running locally

```bash
npm install
npm run dev
```

Requires a `.env` (never committed - it is gitignored) with:

```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

## Self-hosting

You need your own Supabase project. Set these env vars (locally in `.env`, on Vercel in Project Settings -> Environment Variables):

| Variable | Used by | Notes |
| --- | --- | --- |
| `VITE_SUPABASE_URL` | frontend + API | your project URL |
| `VITE_SUPABASE_ANON_KEY` | frontend | safe to expose; RLS enforces access |
| `SUPABASE_SERVICE_ROLE_KEY` | API only | server-side only, never in the frontend |
| `AGALIST_API_TOKEN` | API (optional) | static token for the owner's own automation |
| `AGALIST_USER_ID` | API (optional) | your Supabase auth user UUID (Authentication -> Users); required if `AGALIST_API_TOKEN` is set |

The purchase-events log also needs `supabase/migrations/20260904000000_purchase_events.sql` applied.

Heads up: the core schema (categories, shopping_list), RLS policies, RPCs (`seed_default_categories`, `delete_category`) and the signup seed trigger are not exported to this repo yet - only the purchase-events migration is. Export them from your Supabase project if you're setting up from scratch.

## HTTP API

The app itself talks to Supabase directly; these endpoints exist for external callers (scripts, assistants, integrations). All data access is scoped to the authenticated user - the service-role key bypasses RLS, so every query filters `user_id` explicitly, and no endpoint accepts a `user_id` from the caller.

### Auth

`Authorization: Bearer <token>`, two token kinds:

1. **Your Supabase access token (multi-user path).** Sign in with supabase-js and use the session token:

   ```js
   const { data } = await supabase.auth.signInWithPassword({ email, password });
   const token = data.session.access_token;
   ```

   The API verifies it per request with `auth.getUser()` and uses the id from the verified token. Tokens expire (about an hour); refresh with supabase-js. Anyone who signs up in the app (or directly against Supabase Auth) can use the API this way and only ever sees their own data.

2. **Owner automation token.** If the deployment sets `AGALIST_API_TOKEN` + `AGALIST_USER_ID`, that static token authenticates as exactly that one account. Meant for the owner's scripts (no interactive login available). It cannot act as any other user.

### Endpoints

- `GET /api/list` - every section with its items and states. `?include=archived` also returns cleared items.
- `POST /api/items` `{ name, category }` - add an item to a section (re-adding an existing name restores it and bumps the count).
- `PATCH /api/items` `{ id | name [, category], purchased }` - mark bought/missing.
- `DELETE /api/items` `{ id | name [, category] }` - remove (archives, like the app's clear).
- `GET /api/events` - purchase log, newest first. `?limit=N`, `?event_type=added|marked_bought|marked_missing|deleted`, `?since=ISO`.

Every mutation is appended to the purchase log.

### Privacy note

On a hosted deployment, data stays private to its registered users: API tokens are only ever issued by that deployment's Supabase Auth, each caller is resolved to their own user id, and the service-role key never leaves the server.
