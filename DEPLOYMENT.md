# Kings Bud Grow Assistant — Free Deployment Guide

## Current Netlify deployment

The full Next.js application lives at the repository root. Netlify uses
`npm run build`, publishes `.next`, and runs the Next.js adapter configured in
`netlify.toml`. Node.js 22 is pinned for consistent dependency installation.
Deploy the extracted source rather than the uploaded ZIP or static HTML export.

The Next.js adapter handles routing and server-side rendering. Do not add a
static-site redirect to `/index.html`; the full application does not use that file.

Environment files from the archive were not restored. Configure required service
settings through Netlify environment variables, not committed files. The existing
application can render its setup or preview screen without its backend settings;
a successful deployment alone does not configure authentication or persistent data.

After Netlify finishes building, check that the production deploy is published.
A completed but unpublished deploy does not make the production domain available.

This guide walks you through deploying the Kings Bud Grow Assistant to **Vercel** (recommended) or **Netlify** using a free **Supabase** project. Total monthly cost: **R0 / $0** for hobby-scale usage.

> **📦 Downloadable ZIP:** A complete zip of the project is included at `download/kings-bud-grow-assistant.zip` (~2.4 MB, 200+ files). It contains:
> - **Full source code** (`src/`, `supabase/`, `scripts/`, `public/`)
> - **Static HTML export** (`static-html-export/` — drag-and-drop onto Netlify Drop for an instant live URL, no build step needed)
> - **SQL schema** (`supabase/schema.sql` — 13 tables + 2 storage buckets)
> - **Monthly P&L Edge Function** (`supabase/functions/monthly-pnl-email/`)
> - **PWA assets** (realistic cannabis-leaf icons, manifest, service worker)
> - **This deployment guide** (35 KB)
> - **Reusable scripts** (icon generator, zip packager)
>
> Unzip it locally, then either drag-drop the `static-html-export/` folder onto Netlify Drop for an instant preview, OR push the full project to GitHub and follow the 8-step Quick Start below for the production deploy.

---

## ⚡ Quick Start (copy-paste walkthrough)

If you just want this running **right now**, follow these 8 steps. Each one has a clickable link and an exact copy-paste where possible. Total time: **~15 minutes** if you have a GitHub account already.

### Step 1 — Create a free Supabase project (3 min)

1. Open <https://supabase.com> in your browser.
2. Click **"Start your project"** → sign in with GitHub (fastest).
3. Once in the dashboard, click the green **"New project"** button.
4. Fill in the form:
   - **Name**: `kings-bud` (or anything you like)
   - **Organization**: pick your personal org (default)
   - **Database Password**: click **"Generate"** then **"Copy password"** — paste it somewhere safe (you won't need it for the app, but you need it for SQL access).
   - **Region**: pick the closest to you (e.g. `Cape Town` if available, otherwise `Frankfurt` for Europe or `Northern Virginia` for US East).
   - **Pricing Plan**: **Free** ($0/month, 500 MB DB, 50 000 monthly active users — plenty for a single cultivation business).
5. Click **"Create new project"**. Wait ~2 minutes for it to provision. You'll see a green toast "Project is ready" when done.

### Step 2 — Run the SQL schema (1 min)

1. In your new Supabase project's left sidebar, click **"SQL Editor"**.
2. Click the green **"New query"** button.
3. Open the file `supabase/schema.sql` from the project zip (or repo).
4. **Select-all (Ctrl+A) → Copy → Paste** into the Supabase SQL editor.
5. Click the green **"Run"** button (or press `Ctrl+Enter`).
6. You should see **"Success. No rows returned."** in the bottom panel.

✅ **What this creates:** 13 tables (`profiles`, `site_settings`, `site_assets`, `settings`, `seasons`, `strains`, `tents`, `lights`, `electricity`, `expenses`, `harvests`, `harvest_photos`, `nutrient_logs`, `environment_logs`, `sales`, `directors`), Row Level Security policies on every table, a `harvest-photos` private storage bucket, a `site-assets` public storage bucket, a trigger that auto-grants admin to your owner email, and Realtime publication on all data tables.

### Step 3 — Configure email verification (30 sec)

1. In the Supabase sidebar, click **"Authentication"** → **"Providers"**.
2. Make sure **Email** is enabled (it's on by default — toggle it if needed).
3. Click **"Authentication"** → **"Sign In / Up"** in the sub-nav.
4. Toggle **"Confirm email"** to **ON**. This is mandatory — the dashboard is locked until email is verified.
5. Click **"Authentication"** → **"URL Configuration"** in the sub-nav.
6. For now, set:
   - **Site URL**: `http://localhost:3000` (you'll update this after deploying in step 7).
   - **Redirect URLs**: add `http://localhost:3000/#/reset-password`.

### Step 4 — Copy your project URL + anon key (30 sec)

1. In the Supabase sidebar, click **"Project Settings"** (gear icon, bottom-left).
2. Click **"API"** in the sub-nav.
3. Copy these two values — you'll paste them into Vercel in step 6:
   - **Project URL** — looks like `https://abcdefgh.supabase.co`
   - **anon public** key — a long JWT string (starts with `eyJ...`)

> ⚠️ **Never** copy the **service_role** key into the frontend — it bypasses RLS. The `anon public` key is safe in browser code because RLS still enforces per-user access.

### Step 5 — Push the project to GitHub (3 min)

If you haven't already:

1. Unzip `kings-bud-grow-assistant.zip` locally into a folder called `kings-bud-grow-assistant`.
2. Open a terminal in that folder.
3. Create a new GitHub repo at <https://github.com/new> (private is fine — and recommended).
4. Run these commands (replace `YOUR-USERNAME`):
   ```bash
   git init
   git add .
   git commit -m "Initial commit: Kings Bud Grow Assistant"
   git branch -M main
   git remote add origin https://github.com/YOUR-USERNAME/kings-bud-grow-assistant.git
   git push -u origin main
   ```

### Step 6 — Deploy to Vercel (free) (4 min)

1. Go to <https://vercel.com> and sign in with GitHub.
2. Click **"Add New…"** → **"Project"**.
3. Find your `kings-bud-grow-assistant` repo in the list → click **"Import"**.
4. Vercel auto-detects Next.js. Leave Framework Preset as **"Next.js"**.
5. Open the **"Environment Variables"** section and add these two:
   - `NEXT_PUBLIC_SUPABASE_URL` = the Project URL you copied in step 4
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = the anon public key you copied in step 4
6. Click **"Deploy"**. Build takes ~2 minutes.
7. Once deployed, click the **"Visit"** button — your live URL looks like `https://kings-bud-grow-assistant.vercel.app`. Copy it.

### Step 7 — Update Supabase redirect URLs (1 min)

1. Back in Supabase → **Authentication** → **URL Configuration**.
2. Update the **Site URL** to your real Vercel URL (e.g. `https://kings-bud-grow-assistant.vercel.app`).
3. Update **Redirect URLs** to include:
   - `https://kings-bud-grow-assistant.vercel.app`
   - `https://kings-bud-grow-assistant.vercel.app/#/reset-password`
4. Click **"Save"**.

### Step 8 — Register the owner account + verify (2 min)

1. Open your deployed URL in a fresh browser tab.
2. Click **"Get started"** (or **"Register"**).
3. Fill in:
   - **Full name**: (your name, e.g. `Kings Bud Owner`)
   - **Email**: `Kingsbud2k25@gmail.com` (must match exactly — the SQL trigger will auto-grant admin when this email registers)
   - **Password**: choose a strong password — minimum 8 chars with letters, numbers, and a special character (e.g. `K1ngsBud!2025`). Supabase Auth hashes it; we never see or store it in app code.
   - **Business name**: optional
4. Click **"Create account"**.
5. Check your inbox — open the verification email from Supabase and click the link.
6. You'll be redirected back to the app. Log in with your new credentials.
7. The sidebar now shows the **ADMIN** group with the **Admin Panel** — you're the owner!

🎉 **Done!** You now have a fully-functional, secure, cloud-based cultivation business tracker running entirely on free-tier infrastructure.

---

## Verifying it works

After step 8, do a quick smoke test:

1. Open **Admin Panel** (sidebar → Admin → Admin Panel) → confirm "Owner / Admin" badge shows.
2. Add a tent (sidebar → Tents → Add tent).
3. Add a light against that tent (sidebar → Lights → Add light, e.g. `600W HPS, 1 unit, 12h/day`).
4. Open the Dashboard (sidebar → Dashboard) — the Monthly kWh and Electricity cost should update immediately.
5. Open the Environment section (sidebar → Environment) → Add a reading (e.g. `25°C, 50% humidity`) → see the VPD + stage assessment + (if applicable) disease warnings.
6. Open Nutrient Logs (sidebar → Nutrient Logs) → Add a feeding log with pH/EC + runoff.
7. To test multi-device sync: open your deployed URL on your phone, log in with the same email/password → you should see the same tents/lights/data within ~1 second via Supabase Realtime.

---

## Optional enhancements

- **Monthly P&L email** — section 15 of this guide walks through deploying the Edge Function + scheduling the cron.
- **PWA install** — on your phone's browser, "Add to Home Screen" — the app opens fullscreen like a native app.
- **Custom logo / branding** — sign in as owner → Admin Panel → upload a logo, change the business name, set an announcement banner.

---

## Detailed reference

The sections below are detailed reference for each part of the deployment. Use the Quick Start above for the actual walkthrough; the sections below explain each feature and its schema in depth.

---

## 0. Prerequisites

- A GitHub account (free)
- A Vercel or Netlify account (free)
- A Supabase account (free)
- Node.js 18+ installed locally (optional — only needed for local development)

---

## 1. Create a Supabase project

1. Go to <https://supabase.com> and sign up (GitHub login is fastest).
2. Click **New project**.
3. Choose an organisation (the default personal org is fine).
4. Fill in:
   - **Name**: `kings-bud-grow-assistant`
   - **Database password**: generate a strong password and save it somewhere safe
   - **Region**: pick the one closest to your users (e.g. `Frankfurt` for Europe, `Cape Town` if available for South Africa)
   - **Pricing plan**: **Free** ($0/month)
5. Click **Create project**. It takes ~2 minutes to provision.

> The free tier includes: 500 MB PostgreSQL storage, 1 GB file storage, 50 000 monthly active users for auth, and unlimited API requests — more than enough for a single cultivation business with a handful of users.

---

## 2. Run the database SQL script

1. In your Supabase dashboard, click **SQL Editor** in the left sidebar.
2. Click **New query**.
3. Open the file `supabase/schema.sql` from this project.
4. Copy its **entire contents** and paste it into the SQL editor.
5. Click **Run** (or press `Ctrl+Enter` / `Cmd+Enter`).
6. You should see the message **Success. No rows returned.**

This script creates:
- All 10 tables (`profiles`, `settings`, `seasons`, `tents`, `lights`, `electricity`, `expenses`, `harvests`, `sales`, `directors`)
- Foreign keys with safe `on delete` rules
- Indexes for performance
- **Row Level Security policies** so every user can only read/write their own data
- A trigger that auto-creates a `profiles` and `settings` row when a user signs up
- Realtime publication on every table for multi-device sync

> The script is safe to re-run — it uses `if not exists` and `drop policy if exists` throughout.

---

## 3. Configure authentication

1. In your Supabase dashboard, click **Authentication** → **Providers**.
2. Make sure **Email** is enabled (it's on by default).
3. Under **Authentication** → **Sign In / Up**, toggle **Confirm email** to **ON** (mandatory for this app — the dashboard is locked until verification).
4. Under **Authentication** → **URL Configuration**:
   - **Site URL**: `https://YOUR-DEPLOYED-DOMAIN.vercel.app` (or your Netlify domain — fill this in after the first deploy and redeploy)
   - **Redirect URLs**: add `https://YOUR-DEPLOYED-DOMAIN.vercel.app/#/reset-password` and `https://YOUR-DEPLOYED-DOMAIN.vercel.app`
5. Under **Authentication** → **Email Templates**, customise the confirmation and password-reset emails if you want. The default templates are fine.

> Optional: Under **Authentication** → **Sign In / Up**, you can disable **Allow new users to sign up** after you've registered your own account to prevent random signups. You are still in control of who can register.

---

## 4. Obtain the Supabase URL and anon key

1. In the Supabase dashboard, click **Project Settings** (the gear icon bottom-left).
2. Click **API**.
3. Copy the following two values:
   - **Project URL** — looks like `https://abcdefgh.supabase.co`
   - **anon public** key — a long JWT string

> ⚠️ **Security:** Only the `anon public` key is safe to expose in frontend code. It is heavily restricted by Row Level Security policies. **NEVER** use the `service_role` key in frontend JavaScript — it bypasses RLS.

---

## 5. Upload the project to GitHub

1. Create a new repository on GitHub (private is fine — and recommended since it's your business code).
2. From the project root, run:

   ```bash
   git init
   git add .
   git commit -m "Initial commit: Kings Bud Grow Assistant"
   git branch -M main
   git remote add origin https://github.com/YOUR-USERNAME/kings-bud-grow-assistant.git
   git push -u origin main
   ```

3. If you haven't already, also push the files:
   - `supabase/schema.sql`
   - `DEPLOYMENT.md` (this file)
   - `.env.example`

> Make sure `.env` (with real credentials) is in `.gitignore`. The included `.gitignore` already excludes `.env` files, so only `.env.example` will be pushed.

---

## 6. Deploy to Vercel (recommended) or Netlify

### Option A — Vercel (recommended)

1. Go to <https://vercel.com> and sign up with GitHub.
2. Click **Add New…** → **Project**.
3. Import the `kings-bud-grow-assistant` repository.
4. Vercel auto-detects Next.js — leave Framework Preset as is.
5. Under **Environment Variables**, add:
   - `NEXT_PUBLIC_SUPABASE_URL` = your Supabase Project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = your Supabase anon public key
6. Click **Deploy**. The build takes ~2 minutes.
7. Once deployed, click **Visit** to open your live site.

### Option B — Netlify

1. Go to <https://netlify.com> and sign up with GitHub.
2. Click **Add new site** → **Import an existing project**.
3. Choose the `kings-bud-grow-assistant` repository.
4. Configure:
   - **Build command**: `npm run build`
   - **Publish directory**: `.next`
   - Add the **environment variables**:
     - `NEXT_PUBLIC_SUPABASE_URL`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. Click **Deploy site**.

> Note: deploying Next.js App Router on Netlify requires the Netlify Next.js plugin (auto-installed). Some advanced features may work better on Vercel.

---

## 7. Update Supabase redirect URLs

After your first deploy, you'll have a stable URL like `https://kings-bud-grow-assistant.vercel.app`.

1. Go back to Supabase → **Authentication** → **URL Configuration**.
2. Update **Site URL** and **Redirect URLs** to use your actual deployed domain (see step 3 above).
3. Save. No redeploy needed — Supabase reads these live.

---

## 8. Test registration, login, and email verification

1. Open your deployed site.
2. Click **Get started** → fill in your full name, email, strong password, optional business name.
3. Submit. You should see a "Verify your email" screen.
4. Check your inbox — open the verification email from Supabase and click the link.
5. You'll be redirected back to your site. Log in.
6. The dashboard should now be accessible.

If you don't see the verification email:
- Check spam folder.
- In Supabase → **Authentication** → **Users**, you can manually click **Confirm** on your user row to bypass during testing.

---

## 9. Test adding data

1. From the dashboard, open **Tents** → **Add tent**. Add a tent.
2. Open **Lights** → **Add light**. Add a light (e.g. 600W, 1 unit, 18 hours/day).
3. Watch the **Dashboard** — monthly kWh and electricity cost update instantly.
4. Open **Expenses** → add an expense for this month.
5. Open **Harvests** → record a harvest.
6. Open **Revenue** → add a sale. Notice revenue = quantity × price/g is auto-computed.
7. Open **Break-Even** — see the grams needed to cover overheads.
8. Open **Reports** — see charts light up.

All data is stored in your Supabase PostgreSQL database, protected by RLS policies that ensure no other user can ever access it.

---

## 10. Log in from a second device

1. On your phone, open your deployed URL in Chrome (Android) or Safari (iOS).
2. Tap **Log in**, enter the same email/password.
3. You should immediately see the same tents, lights, expenses, harvests, sales and directors that you created on your laptop.
4. Add a new tent on your phone.
5. Refresh the dashboard on your laptop — the new tent appears within seconds via Supabase Realtime.

> **Tip (PWA):** On Android Chrome, tap the menu → **Install app**. On iOS Safari, tap **Share** → **Add to Home Screen**. The app will then open fullscreen like a native app — without an app store.

---

## 11. Local development (optional)

1. Clone your repo: `git clone https://github.com/YOUR-USERNAME/kings-bud-grow-assistant.git`
2. Install dependencies: `npm install` (or `bun install`)
3. Copy `.env.example` to `.env.local` and fill in your Supabase URL and anon key.
4. Run: `npm run dev`
5. Open <http://localhost:3000>

> Do not commit `.env.local`. The included `.gitignore` already excludes it.

---

## 12. Test/demo account instructions

For reviewers / QA:

1. Use the **same** registration flow as above with a fresh email.
2. If you want a pre-populated demo database without creating an account, you'll need to either:
   - Ask the project owner to share their Supabase project URL + anon key, OR
   - Set up your own Supabase project (steps 1–2 above) and run the SQL script.
3. There is also an in-app "Try demo dashboard with sample data" button shown on the Configure Supabase notice. Demo data is in-memory only, never persisted, and writes are no-ops. Useful for screen-recordings and demos.

---

## 13. Admin Panel & Owner Account

The app ships with an Owner-only Admin Panel where you can:

- Edit the brand name, tagline, hero headline, hero subtext
- Pick a custom primary color (color picker)
- Set a contact email
- Set an announcement banner (shown on every page)
- Upload / replace the site logo, dark-mode logo, favicon, hero background, login background, landing hero image, footer image
- View all registered users (name, email, business, role, joined date)
- See admin-only security info

### How admin access works (security model)

The owner email is hardcoded in the SQL trigger function `public.set_admin_for_owner()` in `supabase/schema.sql`. The default is `Kingsbud2k25@gmail.com` — change it in the SQL if you want a different owner.

When ANY user registers with that exact email, the database trigger automatically sets `is_admin = true` on their profile row. The password is whatever they chose during registration — it is NEVER stored in the application code. To rotate the owner password, just use the normal "Change password" flow.

The admin panel only renders for users with `is_admin = true`. The check happens at two layers:

1. **Frontend**: sidebar nav shows the ADMIN group + Admin Panel button only when `profile.is_admin = true`
2. **Database (RLS)**: every write to `site_settings`, `site_assets`, and the `site-assets` storage bucket is rejected unless the requesting user has a profile row with `is_admin = true` — enforced by a sub-query in the storage RLS policies

So even if someone reverse-engineers the frontend, they cannot mutate site settings unless they own the owner email account.

### Setting up the owner account

1. After running `supabase/schema.sql`, go to your deployed site's landing page
2. Click **Get started** → fill in:
   - **Full name**: (your name)
   - **Email**: `Kingsbud2k25@gmail.com` (case-insensitive — the trigger lowercases)
   - **Password**: choose a strong password (min 8 chars, must include letters, numbers, and a special character — enforced by Supabase Auth)
   - **Business name**: optional
3. Submit — you'll see the email-verification screen
4. Click the verification link in your inbox
5. Log in with your email + password
6. The sidebar now shows the **ADMIN** group with **Admin Panel**. You're the owner.

### Changing the owner email

Edit the constant in `supabase/schema.sql`:

```sql
create or replace function public.set_admin_for_owner() ...
declare
  v_owner_email text := lower('your-new-email@example.com');  -- change this
```

Re-run the entire script. Existing profiles with the new email will be auto-promoted on their next sign-in (the trigger fires on insert OR update of email).

---

## 14. Strains, harvest photos, and yield-per-watt report (optional but recommended)

The SQL schema in `supabase/schema.sql` already creates everything you need for these features when you re-run it. If you ran the script before these features were added, just re-run it — it's safe (uses `if not exists` and `drop policy if exists`).

### Strains table

- **Purpose:** Track genetics — breeder, lineage, type (indica/sativa/hybrid/CBD), THC %, CBD %, flowering weeks, expected yield.
- **Where:** Sidebar → **Strains** in the Operations group.
- **Linked harvests:** When you add or edit a harvest, you can now select its strain. The Strains table shows how many harvests used each strain and the average dry yield per harvest — so you can compare actual vs expected performance.

### Harvest photos (Supabase Storage)

- **Purpose:** Upload harvest-day, drying, or finished-product photos to each harvest record.
- **Where:** Edit a harvest → **Photos** section → "Add photos" button.
- **Storage bucket:** A private bucket named `harvest-photos` is created automatically by the SQL script. Files are stored under `<user_id>/<harvest_id>/<uuid>.<ext>` paths. Storage RLS policies enforce that users can only access files where the first path segment equals their own `auth.uid()` — so even with the public anon key, no user can read another user's photos.
- **Size limits:** 10 MB per image · JPG / PNG / WebP / GIF.
- **Signed URLs:** Photos are served via 1-hour signed URLs — they are never publicly listed.
- **Cascade delete:** Deleting a harvest automatically removes its photos from Storage + the metadata table.

### Yield-per-watt efficiency report

- **Purpose:** See how efficiently you convert light into yield.
- **Formula:** `dry_grams / total_installed_watts` (per harvest) — plus a `grams / kWh` metric that factors in flowering time × hours/day.
- **Where:** Sidebar → **Reports** → scroll to the **Yield-per-watt** card at the bottom. Also surfaced per-tent in **Break-Even → Per-tent profitability** (last column).
- **Benchmark:** Indoor grows typically achieve 0.5–1.2 g/W. Top-tier setups can hit 1.5+ g/W. Below 0.4 g/W suggests lighting, environment, or genetics need attention.

### Per-tent electricity breakdown

- **Purpose:** Track electricity usage per tent per day, per month, and per year.
- **Where:** Sidebar → **Electricity** → scroll down past the monthly tariffs table to the "Electricity usage per tent" card.
- **Columns shown per tent:** light count, total watts, kWh/day, cost/day, kWh/month, cost/month, kWh/year, cost/year. Includes a totals row at the bottom.
- **Formula:** For each active light on the tent: `wattage × quantity × hours_per_day ÷ 1000 = daily_kWh`. Multiply by 30 for monthly, 365 for yearly. Multiply by tariff for Rand cost.
- **Tariff:** Uses `settings.electricity_tariff` (default R3.50/kWh) — override per-month in the Electricity section.

### Nutrient logs (feeding events)

- **Purpose:** Log every feeding — what you fed, how much (mL), input pH + EC, runoff pH + EC. Comparing input vs runoff reveals whether your root zone is accumulating salts or locking out nutrients.
- **Where:** Sidebar → **Nutrient Logs** (Operations group).
- **Schema (auto-created by `supabase/schema.sql`):** `nutrient_logs` table with `logged_at`, `tent_id`, `strain_id`, `season_id`, `nutrient_mix`, `amount_ml`, `water_ph`, `water_ec`, `runoff_ph`, `runoff_ec`, `notes`. RLS-enabled (per-user only).
- **Smart UI highlights:** input pH values outside the 5.8–6.5 range are highlighted amber. The form groups input (solution you watered with) and runoff (what came out the bottom) into separate panels with built-in guidance.

### Environment tracking + VPD + disease warnings

- **Purpose:** Log temperature + humidity per tent. The app auto-calculates VPD (vapor pressure deficit) on every reading, assesses which growth stage the conditions suit, and warns you about cannabis diseases when conditions drift into the danger zone.
- **Where:** Sidebar → **Environment** (Operations group).
- **Schema:** `environment_logs` table with `logged_at`, `tent_id`, `temp_c` (°C), `humidity_pct` (%), `notes`. RLS-enabled (per-user only).
- **VPD formula:** `VPD = SVP × (1 − RH/100)`, where `SVP = 0.6108 × exp(17.27 × T / (T + 237.3))` kPa (Tetens equation).
- **Stage assessment:** Each reading is matched against the ideal VPD + temp + humidity ranges for Clone/Seedling, Vegetative, Flower, and Late Flower stages. You'll see a green ✓ when conditions are ideal for a stage, or an amber ⚠ with the closest stage + what to adjust.
- **Disease warnings — auto-triggered when conditions drift:**
  - **Bud rot (Botrytis)**: humidity ≥ 70% (danger) — "grey mould can destroy a crop in 48 hours once established"
  - **Powdery mildew (Podosphaera)**: humidity 65–70% (warning) — "spores germinate above 65% RH and can spread fast"
  - **Pythium root rot + leaf septoria**: humidity ≥ 80% (danger)
  - **Heat stress + terpene loss + hermaphroditism**: temp ≥ 30°C (warning) or ≥ 32°C (danger)
  - **Cold stress**: temp < 15°C (danger) or < 18°C (warning) — slowed metabolism, root disease risk
  - **Transpiration stress / nutrient burn**: humidity < 35% (warning)
  - **VPD very high (>1.6 kPa)**: transpiring faster than water replacement
  - **VPD very low (<0.4 kPa)**: transpiration stalled, Ca/Mg deficiencies can show
- **Each warning includes:** severity (info/warning/danger), disease name, what's happening, and a fix tip (e.g. "Increase exhaust fan runtime, drop RH below 55% during flower").
- **Live preview:** The "Add reading" form shows a live VPD calculation as you type temp + humidity — so you can see what the assessment will be before saving.
- **Chart:** The page renders a multi-axis Chart.js line chart with the last 50 readings — temp + humidity on the left axis, VPD on the right axis.
- **Reference table:** A "Stage / Temp °C / RH % / VPD kPa" table shows the ideal ranges for all 4 stages so you can plan your environmentals.

### Dark cannabis-themed background

- The landing page, all 5 auth forms (login, register, forgot-password, reset-password, verify-email), the configure-supabase notice, and the loading screens now use a dark background — deep forest green (`#0f1f17`) with vibrant cannabis leaf silhouettes tiled every 200px at ~12% opacity, plus layered radial gradients (green top-left glow + amber bottom-right glow).
- The leaf pattern is a data-URI inline SVG — zero HTTP overhead, renders on first paint.
- The dark variant also remaps text colors so foreground text and cards stay readable on the dark base.

---

## 15. Monthly P&L summary email (optional)

Emails each user a clean monthly P&L snapshot on the 1st of every month — revenue, expenses, electricity, harvest total, top expense category, top product, net profit. Powered by a Supabase Edge Function + Resend (free tier — 3 000 emails/month).

### Setup

1. Sign up at <https://resend.com> and verify your sending domain (or use the default `onboarding@resend.dev` for testing).
2. Create an API key at Resend → API Keys.
3. In your Supabase project → Project Settings → Edge Functions → Secrets, add:
   - `RESEND_API_KEY` = your Resend key
   - `FROM_EMAIL` = e.g. `Kings Bud <reports@yourdomain.com>`
   - `APP_URL` = your deployed app URL (e.g. `https://your-app.vercel.app`)
   - `SUPABASE_URL` = your Supabase project URL (auto-injected by Supabase, but explicit is safer)
   - `SUPABASE_SERVICE_ROLE_KEY` = your Supabase service-role key (Project Settings → API)
4. Install the Supabase CLI: `npm install -g supabase` (one-time setup).
5. Link your project: `supabase link --project-ref <your-project-ref>` (find the ref in the Supabase dashboard URL).
6. Deploy the function:
   ```bash
   supabase functions deploy monthly-pnl-email --no-verify-jwt
   ```
7. Schedule it to run monthly via the SQL editor in Supabase dashboard:
   ```sql
   -- 08:00 UTC on the 1st of each month
   select cron.schedule(
     'monthly-pnl-email',
     '0 8 1 * *',
     $$
       select net.http_post(
         url := 'https://<your-project-ref>.supabase.co/functions/v1/monthly-pnl-email',
         headers := jsonb_build_object(
           'Authorization', 'Bearer <your-service-role-key>',
           'Content-Type', 'application/json'
         ),
         body := '{}'::jsonb
       );
     $$
   );
   ```
   > Note: `net.http_post` requires the `pg_net` extension. Enable it via Supabase → Database → Extensions → search "pg_net" → toggle on.
8. To test immediately without waiting for the cron:
   ```bash
   curl -i --request POST \
     'https://<your-project-ref>.supabase.co/functions/v1/monthly-pnl-email' \
     --header 'Authorization: Bearer <anon-or-service-role-key>' \
     --header 'Content-Type: application/json' \
     --data '{}'
   ```
   You should get a `{"ok":true,"month":"September 2025","sent":N,"failed":0,...}` response.

### What the email contains

- Header with user's business name + month label
- Headline net profit / net loss number (green if profit, red if loss)
- 4-tile metrics grid: revenue, expenses, electricity (fixed), harvest (dry grams + count)
- Top expense category and top product by revenue for the month
- "Open dashboard →" CTA button linking back to your deployed app

### Security notes

- The function uses the **service-role key** to read every user's data and compute aggregates. It is server-side only — the key never appears in the browser.
- It does not return any user data to the caller — it only sends emails via Resend.
- Only users with verified emails and activity in the previous month are emailed (no spam to inactive users).

---

## 16. Security checklist

- ✅ Passwords are hashed by Supabase Auth — never stored in plain text
- ✅ Email verification is required before dashboard access
- ✅ Row Level Security is enabled on every table (data tables + storage objects)
- ✅ Each user can only read / create / update / delete their own records
- ✅ The frontend uses only the public anon key
- ✅ The service-role key is never shipped to the browser (only used in Edge Functions)
- ✅ The `user_id` is taken from `auth.uid()` (server-side) — never trusted from a client-supplied value
- ✅ HTTPS is enabled automatically by Vercel / Netlify
- ✅ localStorage is used only for session persistence (Supabase Auth) — never as the primary database
- ✅ Harvest photos are stored in a private Supabase Storage bucket with per-user RLS policies; served via 1-hour signed URLs
- ✅ Admin panel access is granted via a SQL trigger that auto-promotes the owner email — no hardcoded passwords in frontend code
- ✅ All admin writes (site_settings, site_assets, site-assets storage bucket) are gated by `is_admin = true` checks in RLS policies
- ✅ The owner password is chosen by the user during registration and stored only by Supabase Auth (hashed) — never appears in the application code

---

## 17. Cost / scaling notes

- **Supabase free tier** supports 500 MB DB, 50 000 MAU auth, 1 GB file storage, 500 MB Edge Function invocations. For a single cultivation business with 1–10 users, this is more than enough.
- **Vercel free tier** supports unlimited static + 100 GB bandwidth + 100 GB-h serverless function execution per month.
- **Netlify free tier** supports 100 GB bandwidth + 300 build minutes per month.
- **Resend free tier** supports 100 emails/day, 3 000/month — plenty for monthly P&L emails.

If you outgrow the free tier:
- Supabase Pro: $25/month → 8 GB DB, 100 000 MAU, daily backups, no project pausing, 8 GB storage
- Vercel Pro: $20/month → 1 TB bandwidth, no commercial usage limits
- Netlify Pro: $19/month → 1 TB bandwidth
- Resend Pro: $20/month → 50 000 emails/month, custom sending domains

---

## 18. Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| "Supabase not configured" notice shows | Env vars not set or named wrong | Check that `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are both set in Vercel/Netlify project settings, then redeploy |
| Registration works but no email arrives | Supabase email templates / SMTP | Wait 1–2 minutes, check spam, or manually confirm the user in Supabase → Authentication → Users |
| Dashboard shows but data is empty | Realtime publication not enabled | Re-run the SQL script (the `alter publication supabase_realtime add table …` block) |
| "row-level security policy error" on insert | RLS not enabled or user_id missing | The SQL script handles this; if you skipped it, run it again |
| Login redirects back to login | Email not verified | Confirm email first; or in Supabase → Authentication → Users, click ✅ Confirm |
| Forgot-password email link doesn't work | Redirect URL not in allow-list | Add `https://YOUR-DOMAIN/#/reset-password` to Supabase → Authentication → URL Configuration → Redirect URLs |
| Changes on one device don't sync | Realtime not enabled OR env mismatch | Verify both devices are signed in to the same account; check browser console for websocket errors |
| "Strains" / "Photos" / "yield-per-watt" missing | SQL schema is out of date | Re-run the entire `supabase/schema.sql` script in the Supabase SQL editor — it is safe (uses `if not exists` and `drop policy if exists`). The new tables (`strains`, `harvest_photos`), the `strain_id` column on `harvests`, the storage bucket, and the realtime entries will all be added without losing data |
| Harvest photos fail to upload | Storage bucket not created or RLS missing | Re-run `supabase/schema.sql` (sections 13 + 14). In Supabase → Storage, verify a `harvest-photos` bucket exists with policies `harvest_photos_storage_select/insert/update/delete` |
| Photos upload but don't display | Signed URL expired or bucket marked public | Refresh the page (signed URLs last 1 hour); in Supabase → Storage → harvest-photos → ensure bucket is **private**, not public |
| Monthly email never arrives | Resend / cron not set up | Follow the steps in §14 of this guide: deploy the Edge Function, add the secrets, schedule the cron via `pg_net`. Test with `curl` to verify |
| Monthly email says "sent: 0" | No users had activity in the previous month | The function skips users with zero sales/expenses/harvests in the previous month. Add some test data and run again manually |
| Admin Panel section missing from sidebar | Not signed in as owner, or owner email didn't match | Sign in as `Kingsbud2k25@gmail.com`. Verify in Supabase → Table Editor → profiles → your row has `is_admin = true`. If not, re-run `supabase/schema.sql` (the trigger fires on insert OR update of email) |
| Admin Panel shows "Access denied" | `is_admin` is false on your profile | The SQL trigger only fires on insert OR update of email. If you registered BEFORE running the latest SQL script, manually run: `update public.profiles set is_admin = true where lower(email) = 'kingsbud2k25@gmail.com';` in the Supabase SQL editor |
| Site logo / hero image uploads fail | Storage bucket not created, or RLS policies missing | Re-run `supabase/schema.sql` (sections 15 + 16). Verify in Supabase → Storage → `site-assets` bucket exists and is **public** |
| Owner wants to change their password | Use the in-app Change Password page | Sidebar → Account → Change Password. Supabase Auth handles the rotation — no admin involvement needed |

---

## 19. Updating the app

After deploying, to push updates:

```bash
git add .
git commit -m "Describe your change"
git push origin main
```

Vercel / Netlify will automatically rebuild and deploy. No manual steps needed.

---

That's it — you now have a fully-functional, secure, cloud-based, multi-device, multi-user cultivation business assistant running entirely on free-tier infrastructure. 🌱
