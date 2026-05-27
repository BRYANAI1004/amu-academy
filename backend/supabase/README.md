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
cp .env.example .env
# Fill in SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (service role — backend only)
npm run db:seed
```

### Course cover images

Course cover images are stored in Supabase Storage bucket **`course-covers`** (public). The backend creates this bucket automatically on first upload if it does not exist. You can also create it manually in the Supabase dashboard:

- Bucket name: `course-covers`
- Public: yes

Apply the cover column migration (`20260527120000_add_course_cover_image.sql`) before using cover uploads.

The seed script upserts courses by `slug` and lessons by `(course_id, sort_order)` so it is safe to re-run.

### Local backend

Wrangler loads secrets from `backend/.env` during `npm restart`.

### Production deploy

```bash
wrangler secret put SUPABASE_URL
wrangler secret put SUPABASE_SERVICE_ROLE_KEY
wrangler secret put CLOUDFLARE_ACCOUNT_ID
wrangler secret put CLOUDFLARE_STREAM_API_TOKEN
```

Service role and Stream credentials belong only in backend `.env` / Wrangler secrets — never in the frontend.

### Schema notes

The migration includes the requested core columns plus a few JSON/text fields used by the existing API (`overview`, `what_you_learn`, `objectives`, `notes`).
