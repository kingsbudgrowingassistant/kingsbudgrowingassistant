# Kings Bud Grow Assistant

A secure, cloud-based, multi-user cultivation business tracker. Track tents, lights, electricity, expenses, harvests, revenue, seasons, break-even, company/director distributions — across every device, with realtime synchronisation, protected by PostgreSQL Row Level Security.

> **Status:** Production-ready · Free-tier deployable (Vercel + Supabase)

---

## Tech stack

| Layer | Choice |
|---|---|
| Frontend | Next.js 16 (App Router), TypeScript, Tailwind CSS 4, shadcn/ui |
| Authentication | Supabase Auth (email + password, email verification, password reset) |
| Database | Supabase PostgreSQL |
| Realtime | Supabase Realtime (postgres_changes) |
| Charts | Chart.js via `react-chartjs-2` |
| PWA | manifest.webmanifest + service worker |
| Hosting | Vercel (recommended) or Netlify |
| Cost | **R0 / month** at hobby scale |

---

## Project structure

```
.
├── DEPLOYMENT.md                     # Step-by-step deployment instructions
├── supabase/schema.sql               # Complete SQL setup script (tables, RLS, triggers)
├── public/
│   ├── manifest.webmanifest          # PWA manifest
│   ├── sw.js                         # Service worker (offline caching)
│   ├── icons/                        # PWA icons (192/512, maskable variants)
│   ├── favicon-32.png
│   └── apple-touch-icon.png
├── src/
│   ├── app/
│   │   ├── layout.tsx                # Root layout, PWA metadata, SW registration
│   │   ├── page.tsx                  # SPA entry — auth + data + routing
│   │   └── globals.css               # Green grow-assistant theme
│   ├── lib/
│   │   ├── auth-context.tsx          # Supabase session + profile context
│   │   ├── data-context.tsx          # Realtime data fetching + CRUD helpers
│   │   ├── calculations.ts           # kWh, electricity, break-even, director splits
│   │   ├── format.ts                 # Currency / date / number helpers
│   │   ├── router.ts                 # Hash-based SPA router
│   │   └── supabase/
│   │       ├── client.ts            # Browser Supabase client (anon key only)
│   │       └── types.ts             # TypeScript types matching the DB schema
│   └── components/
│       ├── landing/landing-page.tsx
│       ├── auth/                     # login, register, forgot-password, reset-password, verify-email
│       ├── pwa/                      # service worker registration
│       └── dashboard/
│           ├── dashboard-shell.tsx
│           ├── sidebar-nav.tsx
│           ├── topbar.tsx            # Account menu + quick KPIs + Live indicator
│           ├── shared.tsx            # EmptyState, ConfirmDelete, LoadingState
│           ├── section-header.tsx
│           ├── charts/               # Chart.js wrappers (Line/Bar/Doughnut + custom)
│           └── sections/
│               ├── overview.tsx
│               ├── tents.tsx
│               ├── lights.tsx
│               ├── electricity.tsx
│               ├── expenses.tsx
│               ├── harvests.tsx
│               ├── revenue.tsx
│               ├── seasons.tsx
│               ├── break-even.tsx
│               ├── directors.tsx
│               ├── reports.tsx
│               ├── settings.tsx
│               ├── profile.tsx
│               └── change-password.tsx
└── .env.example                      # Environment variable template
```

---

## Environment variables

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Supabase project URL (Project Settings → API) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Supabase anon public key (Project Settings → API) |

> ⚠️ **Never** use the Supabase service-role key in frontend code. It bypasses Row Level Security.

Copy `.env.example` to `.env.local` for local development, or set these in your Vercel/Netlify project settings for production.

---

## Quickstart (local development)

```bash
git clone <your-fork>
cd kings-bud-grow-assistant
npm install         # or: bun install
cp .env.example .env.local
# Edit .env.local with your Supabase URL + anon key
npm run dev         # open http://localhost:3000
```

You also need a Supabase project — see `DEPLOYMENT.md` for step-by-step instructions.

---

## Security model

1. **Authentication** — Supabase Auth handles signup, email verification, login, password reset, session persistence. Passwords are hashed server-side — never stored in plain text.
2. **Authorisation** — PostgreSQL Row Level Security (RLS) is enabled on every table. Each policy uses `auth.uid() = user_id` so a user can **only** read, create, update or delete their own records. The frontend cannot fake another user's identity.
3. **Session** — The frontend uses only the public anon key. The service-role key is never shipped to the browser.
4. **Email verification** — Users cannot reach the dashboard until `email_confirmed_at` is set.
5. **Multi-device sync** — All read/write operations go through authenticated Supabase queries. Supabase Realtime pushes changes to every open tab/device logged into the same account.

---

## Calculations

| Metric | Formula |
|---|---|
| Daily kWh per light | `wattage × quantity × hours_per_day ÷ 1000` |
| Monthly kWh per light | `daily_kwh × 30` |
| Monthly electricity cost | `monthly_kwh × tariff` |
| Monthly overheads | `electricity_cost + fixed_charge + monthly_expenses` |
| Break-even grams | `monthly_overheads ÷ avg_price_per_gram` |
| Gross profit | `total_revenue − total_expenses` |
| Company share | `gross_profit × company_percentage / 100` |
| Directors pool | `gross_profit − company_share` |
| Per-director split | `directors_pool × (director.percentage / Σ percentages)` |

When percentages don't sum to 100, the pool is split proportionally.

---

## License

MIT — see LICENSE file (none shipped by default; create one if you redistribute).
