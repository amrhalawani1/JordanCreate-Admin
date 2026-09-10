# Jordan Create Admin & Registry V1

Internal admin panel **and** data registry for Jordan Create. This is the one
place the events team edits shared data that feeds both:

- the **Jordan Create mobile application**
- the **WhatsApp concierge bot**

Change a session, a speaker, or event logistics here — the app and the bot
read from the same tables. You should not need the Supabase SQL editor or
Table Editor for day-to-day edits.

The in-app label is **Admin & Registry V1**.

## What it covers

| Area | Status |
| --- | --- |
| Event Info (including extra title + description items), Agenda, Speakers, Venue, Partners, Interest Tags, Brand Voice, FAQ, Experience, Other Editions | Live |
| Dashboard overview + HTML export of each data page | Live |
| Admin Management (create/edit/remove people who can sign in) | Live — Super Admin only |
| Request a Feature | Live — Super Admin only |
| Guests | Live — Guest Managers can access this page and Tickets |
| Tickets Management | Live — Guest Managers may approve and reject; only Super Admin and Admin may revoke access or delete |

**Still out of scope, on purpose:** `conversation_messages` holds live chat
logs. Nothing in this codebase queries, imports, or references them.

## Who can sign in

Access is an `admins` row plus a Supabase Auth user. An Auth-only account
without an `admins` row is **not** an admin.

| Level | Access |
| --- | --- |
| **Super Admin** | Every route, including Admin Management and Request a Feature. Can preview other levels with **View as**. |
| **Admin - Full Edit** | All event/registry pages except Admin Management and Request a Feature. Can add, edit, archive, and delete. Stored as `admin`. |
| **Admin - View Only** | Same pages as Admin - Full Edit, but cannot add, edit, archive, or delete. Stored as `admin_view_only`. |
| **Guest Manager** | `/guests` and `/tickets-management`. May approve, reject, restore, and add manual tickets. Cannot revoke access or delete. |

`role` on an admin is a free-text job title (for example “Operations”). It is
not the permission level — that is `admin_level`.

Super Admins create further admins in **Admin Management**. You can still add
a user in **Supabase Studio → Authentication → Users** if needed; they will
not get into the panel until an `admins` row exists for their email.

## Tech stack

Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 · shadcn/ui ·
Supabase (`@supabase/supabase-js` + `@supabase/ssr`) · react-hook-form + zod

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
  is no public sign-up flow.
- After login, `lib/auth/guard.ts` checks `admins.admin_level`. Guest
  Managers are sent to `/guests`; everyone else lands on the dashboard.
  Forbidden URLs redirect to that home. **Admin - View Only** can read staff
  pages but mutations are rejected. Super Admin **View as** only changes
  the UI (cookie `jc_view_as`); mutations still use the real level.
- RLS is off on the original event tables by existing project convention.
  Newer tables (`admins`, `feature_requests`) are meant to be service-role
  only. The security boundary is “server-only service role key + auth-gated
  routes + `admins` row,” not browser-side RLS.
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
- Each data page can **Export** a standalone HTML snapshot. The file and
  the document both include the date and time of the export. Passwords are
  never included.
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

Preferred: a Super Admin adds the person in **Admin Management** (email,
password, name, role, and level). That creates both the Auth user and the
`admins` row.

Fallback: create the Auth user in **Supabase Studio → Authentication →
Users → Add user**, with **Auto Confirm User** checked, then insert a
matching `admins` row. An Auth user with no `admins` row sees the missing-
profile screen, not the panel.

## Swapping in generated types

Once you've run `supabase login` and `supabase link --project-ref
peaoiihysmthpzrxlcxc`, you can replace `types/database.ts` with the output
of:

```bash
supabase gen types typescript --project-id peaoiihysmthpzrxlcxc > types/database.ts
```

as long as the generated file still exports a `Database` type with the
same shape, `types/entities.ts` and everything downstream needs zero
changes. Do not add `conversation_messages` to the hand-written file.

## Deploying (free test host: Vercel Hobby)

This is a **server-only** Next.js app. Table reads and writes use
`SUPABASE_SERVICE_ROLE_KEY` on the server (`lib/supabase/admin.ts`). The
GitHub repo is public, so secrets must live only in Vercel (and local
`.env.local`) — never in git, chat, or screenshots.

The test URL talks to the **same** Supabase project as local. Saves there
change real event data.

### 1. Import the repo

1. Sign in at [vercel.com](https://vercel.com) with GitHub **amrhalawani1**.
2. **Add New Project** → import
   [JordanCreate-Admin](https://github.com/amrhalawani1/JordanCreate-Admin).
3. Framework: Next.js. Root: repo root. Build: `next build` (default).
4. Production branch: `main`. Turn **off** Deploy Previews for PRs if the
   UI offers it, so pull requests never get a live admin.

### 2. Environment variables (Production only)

Paste from local `.env.local`. Attach them to **Production**, not Preview:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

Do **not** prefix the service role with `NEXT_PUBLIC_`. Deploy.

### 3. Supabase Auth URLs

In **Supabase → Authentication → URL configuration**:

- **Redirect URLs:** `http://localhost:3000/**` and
  `https://<your-vercel-domain>/**`
- **Site URL:** the Vercel HTTPS origin once this is the shared test host
  (keep localhost in Redirect URLs so `npm run dev` still works).

Disable public sign-up in Auth. This app has no sign-up screen; Studio
must match.

### 4. Check the live URL

- Logged out, `/` redirects to `/login`.
- A wrong password stays on login.
- A Super Admin reaches the dashboard.
- `/change-log` stays Super Admin only.

The test host sends `noindex` / `X-Robots-Tag` so crawlers should skip it.
The login gate is the free inner lock. Vercel password/SSO in front of the
whole site is a paid extra; Cloudflare Zero Trust Access in front of the
URL is an optional free layer later.

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
- [ ] Export downloads an HTML file that includes the export date and the
      page’s current data.

### Tables with extra behavior to check

- **`agenda_sessions`**: speaker/tag multi-select, moderator single-select
  (including "— None —"), and reorder buttons (disabled while a
  search/filter is active).
- **`faq_entries`**: reorder buttons update `sort_order` for the whole list.
- **`speakers`**: rows with `bio_status = 'missing'` get an orange left
  border; search and category/bio_status filters work together.
- **`tickets`**: approval queue at `/tickets-management`. Never exports `qr_token`.
  Guest Managers can approve/reject; revoke access and delete stay Super Admin / Admin.
  Bulk approve reports partial failure instead of rolling back successes.

## Project structure

```
app/(dashboard)/      one route per area, auth-gated by proxy.ts
actions/               Server Actions — all reads/writes, one file per table
lib/supabase/          server (auth) vs admin (data) client separation
lib/auth/              admin levels, guards, view-as
lib/entity-configs/     per-table config driving the generic list/edit UI
lib/validation/        per-table zod schemas
lib/export-html.ts     HTML snapshot used by the Export button
components/shared/      DataTable, EntityForm, SingletonForm, and field types
types/database.ts       hand-written Supabase types (conversation_messages
                        intentionally absent)
```
