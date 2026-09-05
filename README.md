# agalist

A multi-user shopping-list web app. Every account gets its own private list, synced in realtime across devices. Hebrew UI.

Features:

- Sections you name yourself (per store, per category - whatever fits); default sections are seeded automatically on signup
- Items with bought/missing states and a tap-to-clear flow; re-adding a known item restores it and bumps its count
- Realtime sync across devices
- Email + password signup and sign in
- An append-only purchase log of every list change
- An HTTP API for scripts, assistants and integrations - every caller only ever sees their own list

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

Heads up: the core schema (categories, shopping_list), RLS policies, RPCs (`seed_default_categories`, `delete_category`) and the signup seed trigger are not exported to this repo yet - only the purchase-events migration is. Export them from your Supabase project if you're setting up from scratch.

## HTTP API

The app itself talks to Supabase directly; these endpoints exist for external callers (scripts, assistants, integrations). All data access is scoped to the authenticated user - the service-role key bypasses RLS, so every query filters `user_id` explicitly, and no endpoint accepts a `user_id` from the caller.

### Auth

`Authorization: Bearer <your Supabase access token>`. Sign in with supabase-js and use the session token:

```js
const { data } = await supabase.auth.signInWithPassword({ email, password });
const token = data.session.access_token;
```

The API verifies the token per request with `auth.getUser()` and uses the id from the verified token - never from the request. Anyone who signs up in the app (or directly against Supabase Auth) can use the API this way and only ever sees their own data. There is deliberately no static or superuser token: no credential exists that could expose someone else's list.

### Connecting your own agent

Access tokens expire after about an hour, so automation should keep the **refresh token** and mint a fresh access token when needed:

```js
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Once, interactively: sign in and store both tokens somewhere safe.
const { data } = await supabase.auth.signInWithPassword({ email, password });
// data.session.access_token  -> Authorization: Bearer <token>
// data.session.refresh_token -> store securely

// Later, headless: exchange the stored refresh token for a fresh session.
const { data: refreshed, error } = await supabase.auth.refreshSession({
  refresh_token: STORED_REFRESH_TOKEN,
});
// refreshed.session.access_token is your new Bearer token.
```

Important: Supabase **rotates the refresh token on every use** - persist `refreshed.session.refresh_token` each time, or the old one stops working (and a reused old one can invalidate the whole session family under reuse detection).

### Endpoints

- `GET /api/list` - every section with its items and states. `?include=archived` also returns cleared items.
- `POST /api/items` `{ name, category }` - add an item to a section (re-adding an existing name restores it and bumps the count).
- `PATCH /api/items` `{ id | name [, category], purchased }` - mark bought/missing.
- `DELETE /api/items` `{ id | name [, category] }` - remove (archives, like the app's clear).
- `GET /api/events` - purchase log, newest first. `?limit=N`, `?event_type=added|marked_bought|marked_missing|deleted`, `?since=ISO`.

Every mutation is appended to the purchase log.

### Privacy

Data is private to each registered user: API tokens are only ever issued by the deployment's Supabase Auth, each caller is resolved to their own user id, and the service-role key never leaves the server. Row-level security is enabled on every table and every policy is owner-scoped (`auth.uid() = user_id`). The purchase log has no UPDATE or DELETE policy, so it stays append-only.
