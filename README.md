# Kakeibo 家計簿

A personal finance tracker for the Oct 2026 → Mar 2027 savings plan. It's mobile-first, installable on the iPhone home screen, and styled with an anime look.

**Stack:** Next.js 16 (App Router) · TypeScript · Tailwind 4 · Neon Postgres · one-password lock · PWA.

## Run it locally

```bash
npm install
cp .env.example .env.local   # then fill in the three values
npm run dev                  # http://localhost:3000
```

| Variable | What it is |
| --- | --- |
| `DATABASE_URL` | Neon connection string (pooled). |
| `APP_PASSWORD` | The one password that unlocks the app. |
| `SESSION_SECRET` | 32+ random characters (`openssl rand -hex 32`). Changing it logs every device out. |

There's no setup step for the database. On the first request the app creates its tables, and on the first unlock it seeds the plan. To try the UI on sample data with no database: `NEXT_PUBLIC_DEMO=1 npm run dev` (dev only).

## Deploy (Vercel)

1. Push the repo to GitHub and import it in Vercel.
2. Add `DATABASE_URL`, `APP_PASSWORD` and `SESSION_SECRET` under Project → Settings → Environment Variables.
3. Deploy. It has to be served over HTTPS, because the login cookie is `Secure` in production.

## Put it on the iPhone

Open the deployed URL in **Safari** → Share → **Add to Home Screen**. Then open the app from the home screen and unlock it once. Home-screen apps keep their own cookies, separate from Safari. It stays unlocked for about 6 months on that device.

## How it works

- **Instant and offline:** every change is applied on the device first, saved to a local queue, and pushed to Postgres in the background. Logging works with no signal. An "Offline · N changes will sync" pill shows until the queue drains. The app re-pulls when it regains focus and every 60 seconds, so the phone and the Mac stay in sync.
- **Security:** one password, checked server-side in constant time. A signed HttpOnly cookie keeps you unlocked. More than 10 wrong attempts in 15 minutes locks login (tracked in Postgres). **Lock** in Settings clears the device's offline copy.
- **Everything is editable** in Settings: salary split, incomes, categories and budgets, trip months, targets, goal, milestones, rules, planned items and EMIs, and pots.

### Money model

- **Savings now** = cash on hand (as of its date) + income received since − logged spending − payments marked paid.
- **Salary:** your share (gross − office scheme − parents) is credited on the 1st of Nov–Mar. Each month's pay funds the next month, which is how the Oct target of 75k works out.
- **Projection:** past months use actual spending. The current month uses the larger of spent-so-far and its budget. Future months assume the budget plus every unskipped planned payment. The office payout is included.
- **Weekly allowance** = that month's cap × 7 ÷ days in the month.
- **Pots** are part of savings but earmarked. Paying a linked item uses up the pot.

## Tables

`app_state` (plan + meta as JSONB) · `expenses` (typed columns, easy to query) · `commitments`, `pots`, `wishlist` (JSONB docs) · `auth_failures`.
