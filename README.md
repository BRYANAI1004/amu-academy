# AMU Academy

Full-stack learning platform with a Vite React frontend and a Cloudflare Workers (Hono) backend.

## Project structure

```
amu-academy/
  frontend/   # Vite + React + TypeScript UI
  backend/    # Hono API on Cloudflare Workers (mock data)
  README.md
  .gitignore
```

## Frontend

```bash
cd frontend
npm install
npm restart
```

- **URL:** http://localhost:5175
- **Preview build:** `npm run preview` → http://localhost:4175

The frontend runs in demo mode with no backend dependency. Routes:

- `/` or `/home` — Home page
- `/login` — Login page (Sign in navigates directly to `/learn`)
- `/learn` — Learn page

## Backend

```bash
cd backend
npm install
npm restart
```

- **URL:** http://localhost:8787
- **Health check:** http://localhost:8787/health

Mock API endpoints:

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | Service info |
| GET | `/health` | Health check |
| GET | `/api/courses` | List of 3 mock courses |
| GET | `/api/courses/:id` | Single mock course |
| GET | `/api/me` | Mock demo user |
| POST | `/api/demo-login` | Mock login response |

## Development notes

- No Supabase, Stripe, or Cloudflare Stream integration yet.
- Backend is mock-only; the frontend works even when the backend is not running.
- Deploy backend: `cd backend && npm run deploy`
