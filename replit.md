# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Structure

```text
artifacts-monorepo/
├── artifacts/              # Deployable applications
│   ├── api-server/         # Express API server
│   └── quranify/           # Quranify React + Vite frontend
├── lib/                    # Shared libraries
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
├── scripts/                # Utility scripts
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── tsconfig.json
└── package.json
```

## Quranify App

A Quran memorization (Hifzh) tracking platform.

**Tech stack:**
- Frontend: React + Vite + Tailwind CSS + shadcn/ui
- Backend: Express 5 + session auth (express-session)
- Database: PostgreSQL + Drizzle ORM
- Auth: Session-based (email + SHA-256 password hashing)

**Color palette:**
- Primary: #2563EB (blue, HSL 221 83% 53%)
- Background: #F8FAFC (HSL 210 40% 98%)
- Text: #0F172A (HSL 222 47% 11%)
- Secondary text: #64748B (HSL 215 16% 47%)

**Pages:**
- `/login` — Login
- `/register` — Register
- `/` — Dashboard (greeting, ayah of the day, stats, streak, recent hafalan)
- `/tracker` — Hafalan tracker (CRUD with filters)
- `/leaderboard` — Global leaderboard
- `/halaqah` — Halaqah groups list
- `/halaqah/:id` — Halaqah detail + group leaderboard
- `/analytics` — Weekly/monthly charts
- `/profile` — User profile + badges

**Features:**
- Streak tracking (auto-updated on hafalan submission)
- Badge system (100, 500, 1000 ayat)
- Halaqah group management
- Daily ayah + motivational quotes on dashboard

**Demo accounts:**
- admin@quranify.com / password123 (admin)
- mentor@quranify.com / password123 (mentor)
- zainab@quranify.com / password123 (member)
- omar@quranify.com / password123 (member)
- ibrahim@quranify.com / password123 (member)

## TypeScript & Composite Projects

Every package extends `tsconfig.base.json` which sets `composite: true`.

## Root Scripts

- `pnpm run build` — runs `typecheck` first, then recursively runs `build`
- `pnpm run typecheck` — runs `tsc --build --emitDeclarationOnly`

## Packages

### `artifacts/api-server` (`@workspace/api-server`)

Express 5 API server. Routes in `src/routes/`:
- `auth.ts` — register, login, logout, me, update profile
- `hafalan.ts` — CRUD hafalan entries + streak update
- `leaderboard.ts` — global leaderboard
- `halaqah.ts` — group CRUD + group leaderboard
- `dashboard.ts` — dashboard summary + analytics
- `users.ts` — user list + halaqah assignment

### `lib/db` (`@workspace/db`)

Drizzle ORM with PostgreSQL. Schema:
- `users` — id, name, email, password, role, halaqah_group, streak, last_activity_date
- `halaqah` — id, name, mentor_id
- `hafalan` — id, user_id, surah, surah_number, ayah_start, ayah_end, status, date

Run migrations: `pnpm --filter @workspace/db run push`

### `lib/api-spec` (`@workspace/api-spec`)

OpenAPI 3.1 spec (`openapi.yaml`) and Orval config.
Run codegen: `pnpm --filter @workspace/api-spec run codegen`
