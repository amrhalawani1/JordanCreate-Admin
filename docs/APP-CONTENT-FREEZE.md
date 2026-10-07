# Freezing the app's content (App Store review)

The mobile app reads these tables directly from Supabase and cannot be told
to read anything else once a build is submitted:

`speakers`, `speaker_social_links`, `agenda_sessions`, `partners`,
`faq_entries`, `entertainment`, `event_info`

So the database keeps two names for each:

| Name | Who uses it | What it is |
|---|---|---|
| `<name>_live` | this admin panel, the website | the real, editable table |
| `<name>` | the mobile app (and the bot/API server) | a **view**: reads `_live` normally, reads `<name>_frozen` during review |
| `<name>_frozen` | nobody directly | the snapshot taken by `app_freeze()`; read-only, guarded by a trigger |

Writes sent to the bare name `<name>` (for example by an admin tab still
running an older build) are redirected into `_live` by an INSTEAD OF trigger
(`app_view_redirect_write`), so they can never reach the snapshot and never
fail with a permission error. One limit of that path: an update or delete
through the bare name only reaches rows the view can see, so while frozen an
older build cannot edit a speaker that was added after the freeze — the
current build (which targets `_live` directly) can.

The admin panel always targets `_live` (`lib/live-tables.ts`, applied in
`lib/supabase-crud.ts`). Audit-log labels keep the plain names.

## Freeze (at submission) / unfreeze (after approval)

Run in the Supabase SQL editor as the service role:

```sql
select public.app_freeze();    -- snapshot now; the app stops seeing changes
select public.app_is_frozen(); -- true / false
select public.app_unfreeze();  -- app goes back to live data instantly
select * from public.app_freeze_log order by at desc;
```

Both are safe to call twice. While frozen, every edit in this panel reaches
the website within a minute and reaches the app only after `app_unfreeze()`.
Never edit the bare-named tables by hand.

Frozen since 7 Oct 2026 (App Store submission); structure moved to views + redirect the same day after a stale tab wrote into the snapshot. Adding a new app-content
table means extending `app_content_tables()` in the database and
`APP_CONTENT_TABLES` in `lib/live-tables.ts`.
