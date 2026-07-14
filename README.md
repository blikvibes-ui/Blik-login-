# nexus-auth-frontend

React + vanilla Three.js cyberpunk-terminal login UI, backed directly by
**Supabase Auth** — no custom backend. Postgres (via Supabase) handles roles
and invite-only signup through Row Level Security and a few SQL functions;
Supabase Auth itself handles passwords, sessions, and email verification.

## Quick start

```bash
npm install
cp .env.example .env   # fill in VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY
                        # from Supabase: Connect button → Direct Connection → API tab
npm run dev
```

Before this works end to end, run the schema migration once — see
"Database setup" below.

## Database setup (do this once, per Supabase project)

1. Supabase Dashboard → **SQL Editor** → New query.
2. Paste in `supabase/migrations/0001_init.sql` → Run.

This creates:
- `public.profiles` — username + role (`user`/`admin`), one row per Supabase
  Auth user.
- `public.invites` — single-use, expiring invite codes. Fully locked down;
  nothing touches it except the SQL functions below.
- A trigger that fires on every signup: validates the invite code, creates
  the profile, marks the invite used — atomically, so a bad invite code
  means the account is never created at all.
- `check_invite(code)` — the frontend calls this before signup to show a
  real error message (Supabase Auth itself only returns a generic
  "Database error saving new user" when the trigger rejects a signup).
- `create_invite(hours)` and `promote_to_admin(email)` — admin-only RPCs;
  each checks the caller's own role server-side before doing anything.

Also enable **Confirm email** under Authentication → Providers → Email in
the dashboard (should be on by default) — this is what makes Supabase Auth
block login until the user clicks the verification link, matching the
"email verification required" behavior from the original spec.

## Wiring Mailgun into Supabase (instead of a custom mailer)

Supabase's default email sending is rate-limited and meant for testing only.
Point it at Mailgun instead:

1. Authentication → Settings → SMTP Settings → enable **Custom SMTP**.
2. Fill in your Mailgun SMTP credentials (same ones from the original setup
   guide):
   ```
   Host: smtp.mailgun.org
   Port: 587
   Username: postmaster@mail.yourdomain.com
   Password: <your Mailgun SMTP password>
   Sender email: noreply@mail.yourdomain.com
   Sender name: NEXUS
   ```
3. Save. Verification emails now send through Mailgun's deliverability
   rather than Supabase's shared pool.

## Bootstrapping your first admin (invite-only chicken-and-egg)

You need one invite before any admin exists to call `create_invite()`.
Run this once, directly in the SQL Editor — it generates one random code,
stores only its hash, and prints the raw code in the query results so you
can copy it before closing the tab:
```sql
do $$
declare
  v_raw text := encode(gen_random_bytes(32), 'hex');
begin
  insert into public.invites (code_hash, expires_at)
  values (encode(digest(v_raw, 'sha256'), 'hex'), now() + interval '7 days');
  raise notice 'Raw invite code: %', v_raw;
end $$;
```
Run it, check the **Messages/Results** tab in the SQL Editor for the
`NOTICE` line with your raw code, register with it in the app, verify your
email, then run:
```sql
update public.profiles set role = 'admin'
where id = (select id from auth.users where email = 'you@example.com');
```
From then on, log in as admin and call `authApi.createInvite()` from the
app (or `select * from create_invite(168);` directly in the SQL Editor) for
every invite after that.

## What's here

- `src/components/CyberpunkAuth.jsx` — the login/register UI, now calling
  `src/api/supabaseAuth.ts` for real instead of a simulated response.
- `src/api/supabaseClient.ts` — the Supabase client instance.
- `src/api/supabaseAuth.ts` — register/login/logout/session, invite
  pre-check, and the two admin RPC calls, with error messages mapped to
  something safe to show a user.
- `supabase/migrations/0001_init.sql` — the whole database side of auth.
- `public/branding.config.json` — footer text, theme colors, logo
  placeholder.

## Logo

No real logo asset yet — `public/branding.config.json` and a TODO comment
at the top of `CyberpunkAuth.jsx` mark where to drop one
(`src/assets/logo.svg`).

## Legal pages

`docs/legal/terms-of-service.md` and `docs/legal/privacy-policy.md` are
starting templates — see the note at the top of each, and note the privacy
policy should now describe Supabase (not a custom MySQL/Postgres server) as
where account data lives; update it if you've customized the schema.

## Deploying

`npm run build` outputs a static `dist/` — deploy it to Vercel or Netlify,
set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` as build-time env vars
in their dashboard, then attach your domain. No backend hosting step is
needed anymore — Supabase *is* the backend now.
