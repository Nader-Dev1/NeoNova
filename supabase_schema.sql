-- ============================================================
-- NEO NOVA — Supabase Database Schema
-- Run this in: Supabase Dashboard → SQL Editor
-- ============================================================

-- Enable UUID extension
create extension if not exists "pgcrypto";

-- ============================================================
-- ZONES
-- ============================================================
create table if not exists zones (
  id         uuid primary key default gen_random_uuid(),
  code       text not null unique,          -- e.g. "R2"
  label      text,                          -- e.g. "Zone R2"
  engineer   text,                          -- e.g. "Ahmed Ali"
  created_at timestamptz default now()
);

-- ============================================================
-- UNITS
-- ============================================================
create table if not exists units (
  id                 uuid primary key default gen_random_uuid(),
  zone_id            uuid not null references zones(id) on delete cascade,
  unit_code          text not null,         -- e.g. "17A"
  fortigate_status   text default 'pending',
  fortiswitch_status text default 'pending',
  ap_status          text default 'pending',
  ap_patch_status    text,                  -- e.g. "12,13,14,15"
  overall_status     text default 'pending',
  notes              text,
  created_at         timestamptz default now(),
  updated_at         timestamptz default now(),
  unique (zone_id, unit_code)
);

-- Auto-update updated_at on any row change
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger units_updated_at
  before update on units
  for each row execute procedure set_updated_at();

-- ============================================================
-- STATUS HISTORY
-- ============================================================
create table if not exists status_history (
  id         uuid primary key default gen_random_uuid(),
  unit_id    uuid not null references units(id) on delete cascade,
  field      text not null,                -- e.g. "fortigate_status"
  old_value  text,
  new_value  text,
  changed_by uuid references auth.users(id),
  changed_at timestamptz default now()
);

-- ============================================================
-- UNIT PHOTOS
-- ============================================================
create table if not exists unit_photos (
  id           uuid primary key default gen_random_uuid(),
  unit_id      uuid not null references units(id) on delete cascade,
  storage_path text not null,              -- path inside "unit-photos" bucket
  uploaded_by  uuid references auth.users(id),
  uploaded_at  timestamptz default now()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- All tables: authenticated users can read and write.
-- Adjust policies to restrict by role if needed.
-- ============================================================

alter table zones         enable row level security;
alter table units         enable row level security;
alter table status_history enable row level security;
alter table unit_photos   enable row level security;

-- Zones
create policy "auth users select zones"  on zones for select  using (auth.role() = 'authenticated');
create policy "auth users insert zones"  on zones for insert  with check (auth.role() = 'authenticated');
create policy "auth users update zones"  on zones for update  using (auth.role() = 'authenticated');
create policy "auth users delete zones"  on zones for delete  using (auth.role() = 'authenticated');

-- Units
create policy "auth users select units"  on units for select  using (auth.role() = 'authenticated');
create policy "auth users insert units"  on units for insert  with check (auth.role() = 'authenticated');
create policy "auth users update units"  on units for update  using (auth.role() = 'authenticated');
create policy "auth users delete units"  on units for delete  using (auth.role() = 'authenticated');

-- Status history
create policy "auth users select history" on status_history for select using (auth.role() = 'authenticated');
create policy "auth users insert history" on status_history for insert with check (auth.role() = 'authenticated');

-- Photos
create policy "auth users select photos" on unit_photos for select using (auth.role() = 'authenticated');
create policy "auth users insert photos" on unit_photos for insert with check (auth.role() = 'authenticated');
create policy "auth users delete photos" on unit_photos for delete using (auth.role() = 'authenticated');

-- ============================================================
-- STORAGE BUCKET
-- Run this separately in: Supabase Dashboard → Storage → Buckets
-- Or execute via SQL below (requires storage schema access)
-- ============================================================

-- Create the "unit-photos" storage bucket (public read)
insert into storage.buckets (id, name, public)
values ('unit-photos', 'unit-photos', true)
on conflict (id) do nothing;

-- Storage policies
create policy "public read unit-photos"
  on storage.objects for select
  using (bucket_id = 'unit-photos');

create policy "auth upload unit-photos"
  on storage.objects for insert
  with check (bucket_id = 'unit-photos' and auth.role() = 'authenticated');

create policy "auth delete unit-photos"
  on storage.objects for delete
  using (bucket_id = 'unit-photos' and auth.role() = 'authenticated');
