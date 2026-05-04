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

## Implementation notes

- Backend implements the three deposit endpoints from the task: address generation, deposit listing, and a public webhook.
- Deposit addresses are idempotent per `(user_id, currency)`.
- Webhook processing is idempotent per `tx_hash`.
- The frontend uses a client component for `/deposit`, because the selected fake user is stored in `localStorage` and the page needs copy-to-clipboard behavior.
- The deposit table uses a manual refresh button and refreshes after requesting an address. This avoids background API noise while still making Postman/curl webhook tests easy to verify.

## Bonus answers

### Idempotency

Webhook idempotency is guaranteed with a database unique constraint on `deposits.tx_hash`. The endpoint inserts the deposit first; if Postgres rejects the insert because the transaction hash already exists, the request returns `{ "status": "ignored" }` and no balance update is executed. Other viable approaches are an explicit idempotency table, advisory locks, or Redis-based idempotency keys, but a Postgres unique constraint is the smallest reliable option here because the deposit itself is the durable record.

### Race conditions

Parallel webhook requests with different `tx_hash` values are safe because balances are updated with an atomic SQL expression: `balance_<currency> = balance_<currency> + amount`. The code never reads a balance into Python, adds to it, and writes it back, so concurrent updates do not overwrite each other. Duplicate concurrent webhooks are handled by the same `UNIQUE tx_hash` constraint.

### Production hardening

Before production, I would add HMAC verification for the raw webhook body with timestamp/replay protection, rate limiting and IP allowlisting for webhook endpoints, structured audit logs plus alerts for failed or suspicious deposit events, and stronger operational monitoring around delayed confirmations and reconciliation mismatches.

### HD wallets

For real address generation, I would derive addresses deterministically from an HD wallet xpub per currency and a stable derivation path per user/currency/account index. Private seed material should not live in the app database; it belongs in a KMS/HSM or a dedicated wallet service with strict access controls and rotation procedures. The app should store only public derivation metadata, generated addresses, and reconciliation state.
