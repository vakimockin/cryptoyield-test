# CryptoYield — Test Task

Mini full-stack project: deposit address generation + on-chain webhook handling.
See the assignment PDF for the task description, scope, and evaluation criteria.

## Stack

- **Backend**: FastAPI + SQLAlchemy 2 + Alembic + Postgres
- **Frontend**: Next.js 14 (App Router) + TypeScript + Tailwind
- **Auth**: `X-User-Id` header (test-only — pretend it's a JWT bearer token)

## Quick start

### 1. Backend

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -e ".[dev]"
docker compose up -d                 # Postgres on :5432
alembic upgrade head                 # apply initial migration
python scripts/seed.py               # creates two seed users
uvicorn app.main:app --reload        # http://localhost:8000
```

### 2. Frontend

```bash
cd frontend
npm install
cp .env.local.example .env.local
npm run dev                          # http://localhost:3000
```

### 3. Tests

```bash
cd backend
pytest
```

## Seed users (test-only)

| Label | X-User-Id (UUID)                       | email                    |
|-------|----------------------------------------|--------------------------|
| Alice | `11111111-1111-1111-1111-111111111111` | `alice@cryptoyield.test` |
| Bob   | `22222222-2222-2222-2222-222222222222` | `bob@cryptoyield.test`   |

Switch the active user via the dropdown in the top-right of the UI.
The frontend stores the choice in `localStorage` and sends it as `X-User-Id` on every API call.

## Where to write code

- `backend/app/routes/deposits.py` — three endpoints (see PDF)
- `frontend/app/deposit/page.tsx` — single page (see PDF)

You can add new files / migrations / tests freely. Don't edit migration `001_initial.py` —
create a new one if you need schema changes (`alembic revision -m "..."`).

## Project layout

```
backend/
  app/
    main.py              # FastAPI factory + CORS + /health
    db.py                # engine + session
    models.py            # User, DepositAddress, Deposit
    auth.py              # X-User-Id dependency
    services/
      address_gen.py     # mock address generator
    routes/
      deposits.py        # ← TODO
  alembic/
    versions/001_initial.py
  scripts/seed.py
  tests/
    conftest.py
    test_health.py
  pyproject.toml
  docker-compose.yml

frontend/
  app/
    layout.tsx
    page.tsx
    deposit/page.tsx     # ← TODO
  components/UserSwitcher.tsx
  lib/api.ts             # fetch helper with X-User-Id header
  package.json
```

## Submission

1. Push to a branch `candidate/<your-name>` or fork the repo.
2. Open a Pull Request to `main`.
3. In the PR description: what you finished, what you skipped, any trade-offs you want us to notice.

Questions about the assignment — write directly, don't burn time guessing scope.
