-- ===========================================================================
-- Kings Bud Grow Assistant — Supabase Database Setup Script
-- ===========================================================================
-- This script:
--   1. Creates every required table with proper columns
--   2. Adds foreign-key relationships between tables
--   3. Adds useful indexes for performance
--   4. Enables Row Level Security (RLS) on every table
--   5. Creates RLS policies so each user can ONLY access their own records
--   6. Creates a trigger that auto-provisions a profile row + default settings
--      when a new auth.users row is created
--
-- HOW TO RUN THIS SCRIPT
--   1. Open your Supabase project dashboard: https://supabase.com/dashboard
--   2. In the left sidebar, click "SQL Editor"
--   3. Click "New query"
--   4. Paste this entire script
--   5. Click "Run" (or press Ctrl+Enter)
--   6. You should see "Success. No rows returned."
--   7. (Optional) Click "Table Editor" to verify the tables were created.
--
-- You can re-run this script safely — it uses CREATE TABLE IF NOT EXISTS
-- and DROP POLICY IF EXISTS, so existing data is preserved.
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- 1. Profiles
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users (id) on delete cascade,
  full_name    text,
  email        text,
  business_name text,
  is_admin     boolean not null default false,
  created_at   timestamptz not null default now(),
  unique (user_id)
);

-- Add is_admin to existing profiles tables (safe re-run).
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles' and column_name = 'is_admin'
  ) then
    alter table public.profiles add column is_admin boolean not null default false;
  end if;
end $$;

-- Auto-grant admin status to the configured owner email. The owner simply
-- registers an account with this email and they automatically become admin.
-- The password is whatever they chose during registration — it is NEVER
-- stored in the application code. To change the owner email, update the
-- constant below and re-run the script.
create or replace function public.set_admin_for_owner()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_owner_email text := lower('Kingsbud2k25@gmail.com');
begin
  if lower(new.email) = v_owner_email then
    new.is_admin := true;
  end if;
  return new;
end;
$$;

drop trigger if exists on_profiles_set_admin on public.profiles;
create trigger on_profiles_set_admin
  before insert or update of email on public.profiles
  for each row execute function public.set_admin_for_owner();

-- Anyone can read their own profile; only the owner can read all profiles.
alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = user_id or exists (
    select 1 from public.profiles p where p.user_id = auth.uid() and p.is_admin = true
  ));

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
  on public.profiles for insert
  with check (auth.uid() = user_id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = user_id or exists (
    select 1 from public.profiles p where p.user_id = auth.uid() and p.is_admin = true
  ))
  with check (auth.uid() = user_id or exists (
    select 1 from public.profiles p where p.user_id = auth.uid() and p.is_admin = true
  ));

drop policy if exists "profiles_delete_own" on public.profiles;
create policy "profiles_delete_own"
  on public.profiles for delete
  using (auth.uid() = user_id or exists (
    select 1 from public.profiles p where p.user_id = auth.uid() and p.is_admin = true
  ));

-- ---------------------------------------------------------------------------
-- 2. Settings
-- ---------------------------------------------------------------------------
create table if not exists public.settings (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references auth.users (id) on delete cascade,
  currency            text not null default 'ZAR',
  electricity_tariff numeric not null default 3.50,
  company_percentage  numeric not null default 25.0
                          check (company_percentage between 0 and 100),
  director_count      integer not null default 3,
  created_at          timestamptz not null default now(),
  unique (user_id)
);

alter table public.settings enable row level security;

drop policy if exists "settings_select_own" on public.settings;
create policy "settings_select_own"
  on public.settings for select
  using (auth.uid() = user_id);

drop policy if exists "settings_insert_own" on public.settings;
create policy "settings_insert_own"
  on public.settings for insert
  with check (auth.uid() = user_id);

drop policy if exists "settings_update_own" on public.settings;
create policy "settings_update_own"
  on public.settings for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "settings_delete_own" on public.settings;
create policy "settings_delete_own"
  on public.settings for delete
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- 3. Seasons
-- ---------------------------------------------------------------------------
create table if not exists public.seasons (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users (id) on delete cascade,
  name         text not null,
  start_date   date not null default current_date,
  end_date     date,
  status       text not null default 'active'
                  check (status in ('planning', 'active', 'completed')),
  created_at   timestamptz not null default now()
);

create index if not exists idx_seasons_user_id on public.seasons (user_id);
create index if not exists idx_seasons_start_date on public.seasons (start_date desc);

alter table public.seasons enable row level security;

drop policy if exists "seasons_select_own" on public.seasons;
create policy "seasons_select_own"
  on public.seasons for select
  using (auth.uid() = user_id);

drop policy if exists "seasons_insert_own" on public.seasons;
create policy "seasons_insert_own"
  on public.seasons for insert
  with check (auth.uid() = user_id);

drop policy if exists "seasons_update_own" on public.seasons;
create policy "seasons_update_own"
  on public.seasons for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "seasons_delete_own" on public.seasons;
create policy "seasons_delete_own"
  on public.seasons for delete
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- 3b. Strains — track genetics, lineage, expected yield, flowering time
-- ---------------------------------------------------------------------------
-- NOTE: Strains must be created BEFORE nutrient_logs / harvests because
-- those tables have foreign keys referencing public.strains.
create table if not exists public.strains (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users (id) on delete cascade,
  name            text not null,
  breeder         text,
  type            text check (type in ('indica', 'sativa', 'hybrid', 'ruderalis', 'cbd')),
  thc_percent     numeric check (thc_percent is null or (thc_percent >= 0 and thc_percent <= 100)),
  cbd_percent     numeric check (cbd_percent is null or (cbd_percent >= 0 and cbd_percent <= 100)),
  flowering_weeks numeric check (flowering_weeks is null or flowering_weeks > 0),
  expected_yield_grams numeric check (expected_yield_grams is null or expected_yield_grams >= 0),
  lineage         text,    -- e.g. "Northern Lights × Afghani"
  description     text,
  created_at      timestamptz not null default now()
);

create index if not exists idx_strains_user_id on public.strains (user_id);

alter table public.strains enable row level security;

drop policy if exists "strains_select_own" on public.strains;
create policy "strains_select_own"
  on public.strains for select
  using (auth.uid() = user_id);

drop policy if exists "strains_insert_own" on public.strains;
create policy "strains_insert_own"
  on public.strains for insert
  with check (auth.uid() = user_id);

drop policy if exists "strains_update_own" on public.strains;
create policy "strains_update_own"
  on public.strains for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "strains_delete_own" on public.strains;
create policy "strains_delete_own"
  on public.strains for delete
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- 4. Tents
-- ---------------------------------------------------------------------------
-- NOTE: Tents must be created BEFORE nutrient_logs / environment_logs /
-- lights / expenses / harvests because all of those have FKs to public.tents.
create table if not exists public.tents (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  name        text not null,
  location    text,
  dimensions  text,
  status      text not null default 'active'
                  check (status in ('active', 'inactive', 'maintenance')),
  notes       text,
  created_at  timestamptz not null default now()
);

create index if not exists idx_tents_user_id on public.tents (user_id);

alter table public.tents enable row level security;

drop policy if exists "tents_select_own" on public.tents;
create policy "tents_select_own"
  on public.tents for select
  using (auth.uid() = user_id);

drop policy if exists "tents_insert_own" on public.tents;
create policy "tents_insert_own"
  on public.tents for insert
  with check (auth.uid() = user_id);

drop policy if exists "tents_update_own" on public.tents;
create policy "tents_update_own"
  on public.tents for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "tents_delete_own" on public.tents;
create policy "tents_delete_own"
  on public.tents for delete
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- 4b. Nutrient logs — every feeding event per tent + (optional) strain
-- ---------------------------------------------------------------------------
-- Created AFTER tents + strains because of the FK references below.
create table if not exists public.nutrient_logs (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users (id) on delete cascade,
  tent_id         uuid references public.tents (id) on delete set null,
  strain_id       uuid references public.strains (id) on delete set null,
  season_id       uuid references public.seasons (id) on delete set null,
  logged_at       timestamptz not null default now(),
  nutrient_mix    text,             -- e.g. "FloraNova Bloom 2ml/L + CalMag 1ml/L"
  amount_ml       numeric check (amount_ml is null or amount_ml >= 0),
  water_ph        numeric check (water_ph is null or (water_ph between 0 and 14)),
  water_ec        numeric check (water_ec is null or water_ec >= 0),    -- mS/cm
  runoff_ph       numeric check (runoff_ph is null or (runoff_ph between 0 and 14)),
  runoff_ec       numeric check (runoff_ec is null or runoff_ec >= 0),  -- mS/cm
  notes           text,
  created_at      timestamptz not null default now()
);

create index if not exists idx_nutrient_logs_user_id on public.nutrient_logs (user_id);
create index if not exists idx_nutrient_logs_logged_at on public.nutrient_logs (logged_at desc);
create index if not exists idx_nutrient_logs_tent_id on public.nutrient_logs (tent_id);

alter table public.nutrient_logs enable row level security;

drop policy if exists "nutrient_logs_select_own" on public.nutrient_logs;
create policy "nutrient_logs_select_own"
  on public.nutrient_logs for select
  using (auth.uid() = user_id);

drop policy if exists "nutrient_logs_insert_own" on public.nutrient_logs;
create policy "nutrient_logs_insert_own"
  on public.nutrient_logs for insert
  with check (auth.uid() = user_id);

drop policy if exists "nutrient_logs_update_own" on public.nutrient_logs;
create policy "nutrient_logs_update_own"
  on public.nutrient_logs for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "nutrient_logs_delete_own" on public.nutrient_logs;
create policy "nutrient_logs_delete_own"
  on public.nutrient_logs for delete
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- 4c. Environment logs — temperature + humidity readings per tent
-- ---------------------------------------------------------------------------
create table if not exists public.environment_logs (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users (id) on delete cascade,
  tent_id         uuid references public.tents (id) on delete set null,
  logged_at       timestamptz not null default now(),
  temp_c          numeric not null check (temp_c between -10 and 60),     -- Celsius
  humidity_pct    numeric not null check (humidity_pct between 0 and 100), -- %
  notes           text,
  created_at      timestamptz not null default now()
);

create index if not exists idx_env_logs_user_id on public.environment_logs (user_id);
create index if not exists idx_env_logs_logged_at on public.environment_logs (logged_at desc);
create index if not exists idx_env_logs_tent_id on public.environment_logs (tent_id);

alter table public.environment_logs enable row level security;

drop policy if exists "env_logs_select_own" on public.environment_logs;
create policy "env_logs_select_own"
  on public.environment_logs for select
  using (auth.uid() = user_id);

drop policy if exists "env_logs_insert_own" on public.environment_logs;
create policy "env_logs_insert_own"
  on public.environment_logs for insert
  with check (auth.uid() = user_id);

drop policy if exists "env_logs_update_own" on public.environment_logs;
create policy "env_logs_update_own"
  on public.environment_logs for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "env_logs_delete_own" on public.environment_logs;
create policy "env_logs_delete_own"
  on public.environment_logs for delete
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- 5. Lights
-- ---------------------------------------------------------------------------
create table if not exists public.lights (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users (id) on delete cascade,
  tent_id        uuid references public.tents (id) on delete set null,
  name           text not null,
  wattage        numeric not null check (wattage > 0),
  quantity       integer not null default 1 check (quantity > 0),
  hours_per_day  numeric not null default 18 check (hours_per_day between 0 and 24),
  active         boolean not null default true,
  start_date     date,
  end_date       date,
  created_at     timestamptz not null default now()
);

create index if not exists idx_lights_user_id on public.lights (user_id);
create index if not exists idx_lights_tent_id on public.lights (tent_id);
create index if not exists idx_lights_active on public.lights (active);

alter table public.lights enable row level security;

drop policy if exists "lights_select_own" on public.lights;
create policy "lights_select_own"
  on public.lights for select
  using (auth.uid() = user_id);

drop policy if exists "lights_insert_own" on public.lights;
create policy "lights_insert_own"
  on public.lights for insert
  with check (auth.uid() = user_id);

drop policy if exists "lights_update_own" on public.lights;
create policy "lights_update_own"
  on public.lights for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "lights_delete_own" on public.lights;
create policy "lights_delete_own"
  on public.lights for delete
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- 6. Electricity
-- ---------------------------------------------------------------------------
create table if not exists public.electricity (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users (id) on delete cascade,
  month        text not null, -- format 'YYYY-MM'
  tariff       numeric not null check (tariff >= 0),
  fixed_charge numeric not null default 0 check (fixed_charge >= 0),
  notes        text,
  created_at   timestamptz not null default now(),
  unique (user_id, month)
);

create index if not exists idx_electricity_user_id on public.electricity (user_id);
create index if not exists idx_electricity_month on public.electricity (month desc);

alter table public.electricity enable row level security;

drop policy if exists "electricity_select_own" on public.electricity;
create policy "electricity_select_own"
  on public.electricity for select
  using (auth.uid() = user_id);

drop policy if exists "electricity_insert_own" on public.electricity;
create policy "electricity_insert_own"
  on public.electricity for insert
  with check (auth.uid() = user_id);

drop policy if exists "electricity_update_own" on public.electricity;
create policy "electricity_update_own"
  on public.electricity for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "electricity_delete_own" on public.electricity;
create policy "electricity_delete_own"
  on public.electricity for delete
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- 7. Expenses
-- ---------------------------------------------------------------------------
create table if not exists public.expenses (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  category    text not null,
  description text,
  amount      numeric not null check (amount > 0),
  date        date not null default current_date,
  tent_id     uuid references public.tents (id) on delete set null,
  season_id   uuid references public.seasons (id) on delete set null,
  created_at  timestamptz not null default now()
);

create index if not exists idx_expenses_user_id on public.expenses (user_id);
create index if not exists idx_expenses_date on public.expenses (date desc);
create index if not exists idx_expenses_season_id on public.expenses (season_id);

alter table public.expenses enable row level security;

drop policy if exists "expenses_select_own" on public.expenses;
create policy "expenses_select_own"
  on public.expenses for select
  using (auth.uid() = user_id);

drop policy if exists "expenses_insert_own" on public.expenses;
create policy "expenses_insert_own"
  on public.expenses for insert
  with check (auth.uid() = user_id);

drop policy if exists "expenses_update_own" on public.expenses;
create policy "expenses_update_own"
  on public.expenses for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "expenses_delete_own" on public.expenses;
create policy "expenses_delete_own"
  on public.expenses for delete
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- 8. Harvests
-- ---------------------------------------------------------------------------
create table if not exists public.harvests (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users (id) on delete cascade,
  tent_id       uuid references public.tents (id) on delete set null,
  strain_id     uuid references public.strains (id) on delete set null,
  cycle_name    text not null,
  start_date    date,
  harvest_date  date,
  wet_weight    numeric not null default 0 check (wet_weight >= 0),
  dry_weight     numeric not null default 0 check (dry_weight >= 0),
  notes         text,
  created_at    timestamptz not null default now()
);

-- Add strain_id to existing harvests tables (safe re-run via DO block).
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'harvests' and column_name = 'strain_id'
  ) then
    alter table public.harvests
      add column if not exists strain_id uuid references public.strains (id) on delete set null;
  end if;
end $$;

create index if not exists idx_harvests_user_id on public.harvests (user_id);
create index if not exists idx_harvests_harvest_date on public.harvests (harvest_date desc);
create index if not exists idx_harvests_strain_id on public.harvests (strain_id);

alter table public.harvests enable row level security;

drop policy if exists "harvests_select_own" on public.harvests;
create policy "harvests_select_own"
  on public.harvests for select
  using (auth.uid() = user_id);

drop policy if exists "harvests_insert_own" on public.harvests;
create policy "harvests_insert_own"
  on public.harvests for insert
  with check (auth.uid() = user_id);

drop policy if exists "harvests_update_own" on public.harvests;
create policy "harvests_update_own"
  on public.harvests for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "harvests_delete_own" on public.harvests;
create policy "harvests_delete_own"
  on public.harvests for delete
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- 9. Sales
-- ---------------------------------------------------------------------------
create table if not exists public.sales (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users (id) on delete cascade,
  date            date not null default current_date,
  product         text not null,
  quantity        numeric not null check (quantity > 0),
  price_per_gram  numeric not null check (price_per_gram >= 0),
  revenue         numeric generated always as (quantity * price_per_gram) stored,
  season_id       uuid references public.seasons (id) on delete set null,
  created_at      timestamptz not null default now()
);

create index if not exists idx_sales_user_id on public.sales (user_id);
create index if not exists idx_sales_date on public.sales (date desc);
create index if not exists idx_sales_season_id on public.sales (season_id);

alter table public.sales enable row level security;

drop policy if exists "sales_select_own" on public.sales;
create policy "sales_select_own"
  on public.sales for select
  using (auth.uid() = user_id);

drop policy if exists "sales_insert_own" on public.sales;
create policy "sales_insert_own"
  on public.sales for insert
  with check (auth.uid() = user_id);

drop policy if exists "sales_update_own" on public.sales;
create policy "sales_update_own"
  on public.sales for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "sales_delete_own" on public.sales;
create policy "sales_delete_own"
  on public.sales for delete
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- 10. Directors
-- ---------------------------------------------------------------------------
create table if not exists public.directors (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  name        text not null,
  percentage  numeric not null default 0 check (percentage between 0 and 100),
  created_at  timestamptz not null default now()
);

create index if not exists idx_directors_user_id on public.directors (user_id);

alter table public.directors enable row level security;

drop policy if exists "directors_select_own" on public.directors;
create policy "directors_select_own"
  on public.directors for select
  using (auth.uid() = user_id);

drop policy if exists "directors_insert_own" on public.directors;
create policy "directors_insert_own"
  on public.directors for insert
  with check (auth.uid() = user_id);

drop policy if exists "directors_update_own" on public.directors;
create policy "directors_update_own"
  on public.directors for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "directors_delete_own" on public.directors;
create policy "directors_delete_own"
  on public.directors for delete
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- 11. Auto-provisioning triggers
-- ---------------------------------------------------------------------------
-- When a new auth.users row is created, automatically create a profile and
-- default settings row. (Optional — the frontend also handles this, but
-- doing it server-side is more reliable.)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (user_id, full_name, email, business_name)
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    new.email,
    new.raw_user_meta_data ->> 'business_name'
  )
  on conflict (user_id) do nothing;

  insert into public.settings (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- 12. Harvest photos — metadata table (the actual image bytes live in
--     Supabase Storage; this table tracks which photo belongs to which
--     harvest + who uploaded it).
-- ---------------------------------------------------------------------------
create table if not exists public.harvest_photos (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  harvest_id  uuid not null references public.harvests (id) on delete cascade,
  storage_path text not null,           -- e.g. "<user_id>/<harvest_id>/<uuid>.jpg"
  file_name   text,
  mime_type   text not null default 'image/jpeg',
  size_bytes  integer,
  caption     text,
  created_at  timestamptz not null default now()
);

create index if not exists idx_harvest_photos_user_id on public.harvest_photos (user_id);
create index if not exists idx_harvest_photos_harvest_id on public.harvest_photos (harvest_id);

alter table public.harvest_photos enable row level security;

drop policy if exists "harvest_photos_select_own" on public.harvest_photos;
create policy "harvest_photos_select_own"
  on public.harvest_photos for select
  using (auth.uid() = user_id);

drop policy if exists "harvest_photos_insert_own" on public.harvest_photos;
create policy "harvest_photos_insert_own"
  on public.harvest_photos for insert
  with check (auth.uid() = user_id);

drop policy if exists "harvest_photos_update_own" on public.harvest_photos;
create policy "harvest_photos_update_own"
  on public.harvest_photos for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "harvest_photos_delete_own" on public.harvest_photos;
create policy "harvest_photos_delete_own"
  on public.harvest_photos for delete
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- 14. Storage bucket for harvest photos
-- ---------------------------------------------------------------------------
-- Creates a private bucket named "harvest-photos". Photos are NOT public —
-- users can only access their own files via signed URLs generated with
-- their authenticated session. The RLS policies below enforce per-user
-- isolation at the storage layer.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'harvest-photos',
  'harvest-photos',
  false,
  10485760,                          -- 10 MB max per image
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Storage RLS policies — only the authenticated owner can CRUD their photos.
-- Files are stored under a path that starts with the user_id, so we can
-- enforce ownership at the path level.
drop policy if exists "harvest_photos_storage_select" on storage.objects;
create policy "harvest_photos_storage_select"
  on storage.objects for select
  using (
    bucket_id = 'harvest-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "harvest_photos_storage_insert" on storage.objects;
create policy "harvest_photos_storage_insert"
  on storage.objects for insert
  with check (
    bucket_id = 'harvest-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "harvest_photos_storage_update" on storage.objects;
create policy "harvest_photos_storage_update"
  on storage.objects for update
  using (
    bucket_id = 'harvest-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'harvest-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "harvest_photos_storage_delete" on storage.objects;
create policy "harvest_photos_storage_delete"
  on storage.objects for delete
  using (
    bucket_id = 'harvest-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ---------------------------------------------------------------------------
-- 15. Site-wide assets + settings (admin-managed)
-- ---------------------------------------------------------------------------
-- These tables power the Admin Panel. Only users with is_admin = true can
-- INSERT / UPDATE / DELETE. Everyone (including unauthenticated visitors
-- on the landing page) can SELECT so the branding renders for all visitors.
-- ---------------------------------------------------------------------------

-- Site-wide settings (one row, keyed by id=1). The admin updates this from
-- the Admin Panel — business name shown in the sidebar, hero headline,
-- theme color, contact email, etc.
create table if not exists public.site_settings (
  id              integer primary key default 1 check (id = 1),
  brand_name       text not null default 'Kings Bud',
  brand_tagline    text not null default 'Grow Assistant',
  hero_headline    text not null default 'Grow smarter. Track every gram, watt, and rand from any device.',
  hero_subtext     text,
  primary_color    text not null default '#16a34a',
  contact_email    text,
  announcement     text,
  updated_at       timestamptz not null default now()
);

insert into public.site_settings (id) values (1)
  on conflict (id) do nothing;

alter table public.site_settings enable row level security;

drop policy if exists "site_settings_select_any" on public.site_settings;
create policy "site_settings_select_any"
  on public.site_settings for select
  using (true);

drop policy if exists "site_settings_write_admin" on public.site_settings;
create policy "site_settings_write_admin"
  on public.site_settings for all
  using (exists (
    select 1 from public.profiles p
    where p.user_id = auth.uid() and p.is_admin = true
  ))
  with check (exists (
    select 1 from public.profiles p
    where p.user_id = auth.uid() and p.is_admin = true
  ));

-- Site assets — logos, hero images, marketing photos managed from the Admin
-- Panel. Files live in the public `site-assets` storage bucket; this table
-- holds the metadata (which asset is the "current logo", captions, etc.).
create table if not exists public.site_assets (
  id           uuid primary key default gen_random_uuid(),
  -- Who uploaded it (always the admin in practice).
  uploaded_by  uuid references auth.users (id) on delete set null,
  -- Logical slot this asset fills. Apps query by slot to know what to render.
  -- Examples: 'logo', 'logo_dark', 'favicon', 'hero_background',
  -- 'login_background', 'landing_hero_image', 'footer_image'
  slot         text not null,
  storage_path text not null,
  file_name    text,
  mime_type    text not null default 'image/png',
  size_bytes   integer,
  caption      text,
  is_active    boolean not null default true,
  created_at   timestamptz not null default now()
);

create index if not exists idx_site_assets_slot on public.site_assets (slot);
create index if not exists idx_site_assets_active on public.site_assets (is_active);

alter table public.site_assets enable row level security;

-- Public read (landing page renders without auth).
drop policy if exists "site_assets_select_any" on public.site_assets;
create policy "site_assets_select_any"
  on public.site_assets for select
  using (true);

-- Only admin can insert / update / delete.
drop policy if exists "site_assets_insert_admin" on public.site_assets;
create policy "site_assets_insert_admin"
  on public.site_assets for insert
  with check (exists (
    select 1 from public.profiles p
    where p.user_id = auth.uid() and p.is_admin = true
  ));

drop policy if exists "site_assets_update_admin" on public.site_assets;
create policy "site_assets_update_admin"
  on public.site_assets for update
  using (exists (
    select 1 from public.profiles p
    where p.user_id = auth.uid() and p.is_admin = true
  ))
  with check (exists (
    select 1 from public.profiles p
    where p.user_id = auth.uid() and p.is_admin = true
  ));

drop policy if exists "site_assets_delete_admin" on public.site_assets;
create policy "site_assets_delete_admin"
  on public.site_assets for delete
  using (exists (
    select 1 from public.profiles p
    where p.user_id = auth.uid() and p.is_admin = true
  ));

-- ---------------------------------------------------------------------------
-- 16. Storage bucket for site-wide assets (logos, hero images, photos)
-- ---------------------------------------------------------------------------
-- Public bucket so logos/hero images can be served to unauthenticated
-- visitors on the landing page. Only admins can write — enforced by the
-- storage RLS policies below.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'site-assets',
  'site-assets',
  true,
  10485760,                                  -- 10 MB max per asset
  array['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml', 'image/gif']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Public read.
drop policy if exists "site_assets_storage_select_any" on storage.objects;
create policy "site_assets_storage_select_any"
  on storage.objects for select
  using (bucket_id = 'site-assets');

-- Admin-only write/update/delete. We can't check is_admin directly inside
-- storage RLS (no join), so we check whether the current user has a profile
-- row with is_admin = true via a sub-query on public.profiles.
drop policy if exists "site_assets_storage_insert_admin" on storage.objects;
create policy "site_assets_storage_insert_admin"
  on storage.objects for insert
  with check (
    bucket_id = 'site-assets'
    and exists (
      select 1 from public.profiles p
      where p.user_id = auth.uid() and p.is_admin = true
    )
  );

drop policy if exists "site_assets_storage_update_admin" on storage.objects;
create policy "site_assets_storage_update_admin"
  on storage.objects for update
  using (
    bucket_id = 'site-assets'
    and exists (
      select 1 from public.profiles p
      where p.user_id = auth.uid() and p.is_admin = true
    )
  )
  with check (
    bucket_id = 'site-assets'
    and exists (
      select 1 from public.profiles p
      where p.user_id = auth.uid() and p.is_admin = true
    )
  );

drop policy if exists "site_assets_storage_delete_admin" on storage.objects;
create policy "site_assets_storage_delete_admin"
  on storage.objects for delete
  using (
    bucket_id = 'site-assets'
    and exists (
      select 1 from public.profiles p
      where p.user_id = auth.uid() and p.is_admin = true
    )
  );

-- ---------------------------------------------------------------------------
-- 17. Realtime publication (must come AFTER all tables are created)
-- ---------------------------------------------------------------------------
-- Enable realtime for all data tables so the frontend can subscribe to
-- changes. This is required for the multi-device sync feature.
-- IMPORTANT: This block must run AFTER every CREATE TABLE statement above,
-- including harvest_photos, site_settings, and site_assets. Otherwise
-- PostgreSQL will abort with error 42P01 (relation does not exist).
do $$
begin
  -- Drop existing publication items first (safe re-run).
  begin alter publication supabase_realtime drop table public.profiles;        exception when others then null; end;
  begin alter publication supabase_realtime drop table public.settings;        exception when others then null; end;
  begin alter publication supabase_realtime drop table public.seasons;         exception when others then null; end;
  begin alter publication supabase_realtime drop table public.strains;         exception when others then null; end;
  begin alter publication supabase_realtime drop table public.tents;           exception when others then null; end;
  begin alter publication supabase_realtime drop table public.nutrient_logs;   exception when others then null; end;
  begin alter publication supabase_realtime drop table public.environment_logs; exception when others then null; end;
  begin alter publication supabase_realtime drop table public.lights;          exception when others then null; end;
  begin alter publication supabase_realtime drop table public.electricity;      exception when others then null; end;
  begin alter publication supabase_realtime drop table public.expenses;        exception when others then null; end;
  begin alter publication supabase_realtime drop table public.harvests;        exception when others then null; end;
  begin alter publication supabase_realtime drop table public.harvest_photos;  exception when others then null; end;
  begin alter publication supabase_realtime drop table public.sales;            exception when others then null; end;
  begin alter publication supabase_realtime drop table public.directors;       exception when others then null; end;
  begin alter publication supabase_realtime drop table public.site_settings;   exception when others then null; end;
  begin alter publication supabase_realtime drop table public.site_assets;     exception when others then null; end;
end $$;

alter publication supabase_realtime add table public.profiles;
alter publication supabase_realtime add table public.settings;
alter publication supabase_realtime add table public.seasons;
alter publication supabase_realtime add table public.strains;
alter publication supabase_realtime add table public.tents;
alter publication supabase_realtime add table public.nutrient_logs;
alter publication supabase_realtime add table public.environment_logs;
alter publication supabase_realtime add table public.lights;
alter publication supabase_realtime add table public.electricity;
alter publication supabase_realtime add table public.expenses;
alter publication supabase_realtime add table public.harvests;
alter publication supabase_realtime add table public.harvest_photos;
alter publication supabase_realtime add table public.sales;
alter publication supabase_realtime add table public.directors;
alter publication supabase_realtime add table public.site_settings;
alter publication supabase_realtime add table public.site_assets;

-- ===========================================================================
-- Done. To verify:
--   select table_name, row_security
--   from information_schema.tables
--   where table_schema = 'public'
--   order by table_name;
-- ===========================================================================
