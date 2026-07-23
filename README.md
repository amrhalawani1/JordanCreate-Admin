# Jordan Create Bot Data Registry

Internal admin panel for the Jordan Create events team to view and edit every
dataset that powers the Jordan Create WhatsApp concierge bot — without ever
touching the Supabase SQL editor or Table Editor directly.

## Tech stack

Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 · shadcn/ui ·
Supabase (`@supabase/supabase-js` + `@supabase/ssr`) · react-hook-form + zod

## What's in scope

Every table below has a full list/edit UI: `event_info`, `agenda_sessions`,
`speakers`, `venue_zones`, `interest_tags`, `brand_voice`, `faq_entries`,
`experience`, `jordan_create_one`, `jordan_create_three`.

**Out of scope, on purpose:** `guest_profiles` and `conversation_messages`
hold live guest PII and chat logs. Nothing in this codebase queries,
imports, or references them — confirmed by a `grep -ri` sweep with zero
real hits (the only match is a comment explaining why they're absent).

## Architecture (read before changing anything)

- **All database reads/writes go through the server**, never the browser.
  `lib/supabase/admin.ts` holds the *only* client ever used to touch table
  data — it uses the Supabase **service role key**, loaded from
  `SUPABASE_SERVICE_ROLE_KEY` (no `NEXT_PUBLIC_` prefix), and is guarded by
  `import "server-only"` so an accidental client-side import fails the build.
- The **anon key** (`NEXT_PUBLIC_SUPABASE_ANON_KEY`) is used only for
  Supabase Auth sessions, in `lib/supabase/server.ts`.
- **Every route requires auth.** `proxy.ts` (Next 16's replacement for
  `middleware.ts`) redirects any unauthenticated request to `/login`. There
  is no sign-up flow — admin accounts are created manually in Supabase
  Studio (see below).
- RLS is disabled on every table by existing project convention. The
  security boundary is "server-only service role key + auth-gated
  routes," not RLS — this is intentional, not an oversight.
- Every create/update/delete is a Server Action in `actions/<table>.ts`,
  validated with a per-table zod schema in `lib/validation/<table>.ts`
  before it ever reaches the database. Constraint violations are turned
  into readable messages by `lib/errors.ts`.
- The two Postgres `CHECK`-constrained columns (`agenda_sessions.status`,
  `speakers.bio_status`) are dropdown-only in the UI and `z.enum(...)` in
  validation — there's no path to submit an invalid value.
- The CRUD UI itself is generic: `components/shared/DataTable.tsx` +
  `EntityForm.tsx` + `EntityDrawer.tsx` + `DeleteConfirmDialog.tsx`, driven
  by a per-table `EntityConfig` in `lib/entity-configs/`. Singleton tables
  (`event_info`, `brand_voice`, `jordan_create_one`/`three`) use
  `SingletonForm.tsx` instead, which reuses the same field renderer.
- `types/database.ts` is **hand-written** to match the exact shape
  `supabase gen types typescript` would produce, since generating it live
  needs an interactive `supabase login` this project didn't need for v1.
  See "Swapping in generated types" below.

## Running locally

```bash
npm install
cp .env.example .env.local   # then fill in the three values below
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). You'll be redirected
to `/login` until you sign in.

### Environment variables

| Variable | Where to find it |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase dashboard → Project Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Same page → anon/publishable key |
| `SUPABASE_SERVICE_ROLE_KEY` | Same page → service role/secret key (keep this one out of git, chat, and screenshots — it bypasses everything) |

### Creating an admin login

There's no sign-up page by design. Create accounts manually in
**Supabase Studio → Authentication → Users → Add user**, with email +
password, and check **Auto Confirm User** (otherwise the account needs
email verification it'll never receive). Each team member who needs
access gets their own user record here.

### Swapping in generated types

Once you've run `supabase login` and `supabase link --project-ref
peaoiihysmthpzrxlcxc`, you can replace `types/database.ts` with the output
of:

```bash
supabase gen types typescript --project-id peaoiihysmthpzrxlcxc > types/database.ts
```

as long as the generated file still exports a `Database` type with the
same shape, `types/entities.ts` and everything downstream needs zero
changes.

## Deploying (not done yet — do this yourself)

This project was built and verified locally against production data, but
was deliberately **not** connected to GitHub or Vercel during the build
(no `gh`/`vercel` CLI auth was available in that environment). To ship it:

1. `git init` is already done locally with a full commit history — create
   a GitHub repo and push:
   ```bash
   gh repo create jordan-create-bot --private --source=. --push
   ```
2. Import the repo into Vercel (or run `vercel`), and set these three
   encrypted environment variables in the Vercel project settings — do
   **not** commit them to the repo:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
3. After deploying, confirm the login gate works on the live URL: visiting
   any page while logged out should redirect to `/login`, and no data
   should be fetchable without a valid session.

## Manual QA checklist

Run through this per table before considering a change done (there's no
automated test suite given the timeline this was built under):

- [ ] List view loads real data, shows an empty state when a table has
      zero rows, and a loading skeleton while fetching.
- [ ] Add a row, confirm it appears and the toast fires.
- [ ] Edit a row, confirm the change persists after a refresh.
- [ ] Delete a row, confirm the confirmation dialog names the specific
      row, and it's actually gone after confirming.
- [ ] For `agenda_sessions.status` and `speakers.bio_status`: confirm the
      field is a dropdown and no other value can be typed in.
- [ ] Trigger a save error (e.g. a duplicate ID) and confirm a readable
      message appears instead of a crash or a generic failure.
- [ ] Where `updated_at` exists, confirm it changes after a save (the
      database has no auto-update trigger for this column — the app
      stamps it explicitly on every write).

### Tables with extra behavior to check

- **`agenda_sessions`**: speaker/tag multi-select, moderator single-select
  (including "— None —"), and reorder buttons (disabled while a
  search/filter is active).
- **`faq_entries`**: reorder buttons update `sort_order` for the whole list.
- **`speakers`**: rows with `bio_status = 'missing'` get a gold left
  border; search and category/bio_status filters work together.
- **`brand_voice`**: the Values field edits as removable chips but stays
  a semicolon-separated string in the database.

## Project structure

```
app/(dashboard)/      one route per table, auth-gated by proxy.ts
actions/               Server Actions — all reads/writes, one file per table
lib/supabase/          server (auth) vs admin (data) client separation
lib/entity-configs/     per-table config driving the generic list/edit UI
lib/validation/        per-table zod schemas
components/shared/      DataTable, EntityForm, SingletonForm, and field types
types/database.ts       hand-written Supabase types (guest_profiles /
                        conversation_messages intentionally absent)
```
