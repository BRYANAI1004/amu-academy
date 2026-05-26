# AMU Academy database setup

Use a **dedicated Supabase project** for AMU Academy. Do not run this migration against an existing database that already has unrelated `courses` / `lessons` tables (for example the legacy myAMU project).

Run the migration in your Supabase SQL editor or with the Supabase CLI:

```bash
# From backend/
supabase db push
# or paste backend/supabase/migrations/20260526000000_init.sql into the SQL editor
```

Then seed the starter catalog:

```bash
cd backend
cp .dev.vars.example .dev.vars
# Fill in SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (service role — backend only)
npm run db:seed
```

The seed script upserts courses by `slug` and lessons by `(course_id, sort_order)` so it is safe to re-run.

### Local backend

Wrangler loads secrets from `backend/.dev.vars` during `npm restart`.

### Production deploy

```bash
wrangler secret put SUPABASE_URL
wrangler secret put SUPABASE_SERVICE_ROLE_KEY
```

Service role credentials belong only in backend `.dev.vars` / Wrangler secrets — never in the frontend.

### Schema notes

The migration includes the requested core columns plus a few JSON/text fields used by the existing API (`overview`, `what_you_learn`, `objectives`, `notes`).
