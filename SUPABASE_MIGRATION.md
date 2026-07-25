# Supabase migration scope

Plan for moving VitaTrack from single-device `localStorage` persistence
(done — see `src/lib/useLocalStorageState.js`) to a real backend: accounts,
multi-device sync, and push notifications that fire while the app is
closed. This is a scope document, not a build order — nothing here is
implemented yet, and it needs your decisions (and your own Supabase
project) before work starts.

## Why Supabase over the alternatives

- **Postgres, not a document store** — this app's data is relational
  (a user has many scheduled supplements, each with reminder times; a user
  has many log entries keyed by date+supplement). That's a natural fit for
  Postgres tables and foreign keys, an awkward fit for Firestore-style
  documents.
- **No server to write or host.** Supabase gives you Auth + a Postgres
  database + an auto-generated REST/realtime API + Row-Level Security out
  of the box. There's no Express/Fastify app to build, deploy, or keep
  patched — the client talks to Supabase directly, with RLS enforcing that
  each user only ever sees their own rows.
- **Already the documented plan** — this was the recommended path before
  this round of work started (see git history / prior README revisions).
  This document just makes it concrete.

## Two problems, not one

Worth keeping separate, because they're different amounts of work:

1. **Accounts + sync** — a user's data follows them across devices. This is
   "just" CRUD: read on load, write on mutation, scoped by `user_id`.
2. **Push notifications while the app is closed** — this needs *all* of #1
   *plus* a server-side scheduler and the Web Push protocol. A closed
   browser tab cannot run JavaScript, so nothing client-side can check "is a
   reminder due" once the tab is gone — something on a server has to know
   that and push to the device unprompted.

You can ship #1 alone and get real value (the actual product-defining gap
from before — data survives, works on your phone and your laptop). #2 is a
meaningfully bigger lift and can follow later.

## Schema (Phase 1 — accounts + sync)

All tables reference `auth.users` (Supabase's built-in auth table) via
`user_id uuid references auth.users not null default auth.uid()`, with RLS
policies restricting every operation to `user_id = auth.uid()`. The static
75-item supplement catalog (`src/data/supplements.js`) stays bundled with
the app code, not moved to a table — it's reference data, not user data,
and versioning it alongside app releases is simpler than a migration.

```sql
-- One row per user, 1:1 with auth.users.
create table profiles (
  user_id uuid primary key references auth.users default auth.uid(),
  sex text,
  age_band text,
  pregnant boolean default false,
  lactating boolean default false,
  kidney_disease boolean default false,
  liver_disease boolean default false,
  goal text,
  seen_hints jsonb default '{}',
  updated_at timestamptz default now()
);

-- A user's scheduled items. supplement_id is a free-text key matching an
-- id in the bundled supplements.js catalog, OR a custom_supplements.id —
-- no foreign key to a supplements table since that catalog isn't in the DB.
create table user_supplements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null default auth.uid(),
  supplement_id text not null,
  dosage text,
  days int[] not null default '{}',       -- 0=Sun .. 6=Sat, matches WEEKDAYS in the app today
  reminder_times text[] not null default '{}', -- "HH:MM" strings
  start_date date not null default current_date,
  updated_at timestamptz default now(),
  unique (user_id, supplement_id)
);

-- User-entered products not in the bundled catalog.
create table custom_supplements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null default auth.uid(),
  name text not null,
  rda_adult text,
  upper_limit text,
  created_at timestamptz default now()
);

create table medications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null default auth.uid(),
  name text not null,
  created_at timestamptz default now()
);

-- One row per (user, date, supplement) taken/not-taken toggle.
create table supplement_log (
  user_id uuid references auth.users not null default auth.uid(),
  log_date date not null,
  supplement_id text not null,
  taken boolean not null default true,
  primary key (user_id, log_date, supplement_id)
);

create table outcomes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null default auth.uid(),
  log_date date not null,
  mood int,
  energy int,
  notes text,
  created_at timestamptz default now()
);

-- Phase 2 only (push notifications) — one row per browser/device.
create table push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null default auth.uid(),
  subscription jsonb not null, -- the browser's PushSubscription object
  created_at timestamptz default now()
);
```

Every table gets the same RLS shape:

```sql
alter table profiles enable row level security;
create policy "own rows only" on profiles
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
-- repeat per table
```

## Auth strategy

Recommend **magic link** (email, no password) over email/password:
- Matches this app's low-friction ethos — no password to create, remember,
  or reset.
- Supabase Auth supports it natively, no extra infrastructure.
- Trade-off: requires email deliverability to work (Supabase's default
  email sending is fine for low volume; a custom SMTP provider becomes
  worth it once you have real traffic).

Decision needed from you: is single-device-only (no accounts, current
state) acceptable long-term, or is sync worth requiring users to sign in?
Adding accounts is also adding friction to onboarding — worth weighing
against how much multi-device usage you actually expect.

## Migration approach — minimize component churn

The existing components (`Calendar.jsx`, `SupplementLibrary.jsx`,
`MedicationCheck.jsx`, etc.) only know about the *shapes* of `profile`,
`userSupplements`, `medications`, `log`, `outcomes` — not where that data
comes from. The plan is to keep those shapes identical and only change
`App.jsx`'s data layer:

1. Add `@supabase/supabase-js`, a Supabase client instance, and
   `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` env vars (`.env.local`,
   gitignored — never commit these).
2. Add an auth gate: no session → show a sign-in screen (magic link email
   input) before `Onboarding`. Existing `Onboarding` flow stays as-is for a
   signed-in user with no `profile` row yet.
3. Replace `useLocalStorageState` calls in `App.jsx` with a data hook that
   fetches from Supabase on mount and writes through on mutation — same
   `[state, setState]`-shaped return so nothing else in `App.jsx` changes.
   Options: hand-rolled `useEffect` + Supabase queries, or bring in React
   Query / SWR for caching and to avoid re-fetching on every tab switch.
4. **One-time import for existing localStorage users**: on first sign-in,
   if `localStorage` has VitaTrack data and the new Supabase profile is
   empty, offer "Import your existing data?" and push the local state up as
   the user's first rows. Without this, anyone using the app today loses
   their data the moment accounts ship — worth doing even though it's
   throwaway code you'll delete once the localStorage-era users have
   migrated.
5. Realtime (optional, nice-to-have): Supabase's realtime subscriptions
   would let a second open tab/device reflect changes live. Not required
   for correctness (a page refresh always gets fresh data either way) — skip
   for an initial version unless multi-tab-at-once is a real use case.

## Phase 2 — push notifications while the app is closed

Only worth scoping once Phase 1 is live, since it depends on the same
`user_id`/auth foundation:

1. Register a service worker (`public/sw.js`) that handles incoming push
   events and shows an OS notification.
2. On the client, after notification permission is granted, subscribe via
   `PushManager.subscribe()` with a VAPID public key, and save the
   resulting subscription object to `push_subscriptions`.
3. A Supabase Edge Function on a schedule (`pg_cron` triggering it, e.g.
   every minute) queries `user_supplements` for anything with a
   `reminder_times` entry matching the current time, joins against
   `push_subscriptions`, and sends Web Push (VAPID-signed) to each match.
4. This replaces (or runs alongside) the current in-app `useReminders`
   polling, which only works while a tab is open.

This is a genuinely different engineering surface from Phase 1 (cron
scheduling, VAPID key management, service worker lifecycle) — budget it as
its own project once Phase 1 has been live for a bit.

## What I need from you to start Phase 1

- A Supabase project (free tier is fine to start) — I can't create this for
  you, it requires your account.
- The project URL and anon key, added to `.env.local`.
- A decision on magic-link vs. email/password (recommend magic link).
- Confirmation you're OK with the one-time "your current local data resets
  unless you import it" migration UX for existing users of the prototype.
