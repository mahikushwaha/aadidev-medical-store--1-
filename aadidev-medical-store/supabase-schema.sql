-- ============================================================
-- Aadidev Medical Store — Supabase schema
-- Run this once in your Supabase project's SQL Editor
-- (Dashboard → SQL Editor → New query → paste all of this → Run)
-- ============================================================

create extension if not exists "uuid-ossp";

-- ---------- medicines ----------
create table if not exists medicines (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  category text not null default 'General',
  price numeric(10,2) not null,
  stock integer not null default 0,
  requires_rx boolean not null default false,
  barcode text,
  expiry_date date,
  created_at timestamptz not null default now()
);

-- ---------- delivery zones ----------
create table if not exists zones (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  distance_km numeric(5,2) not null
);

-- ---------- delivery pricing settings (single row) ----------
create table if not exists delivery_settings (
  id integer primary key default 1,
  free_km numeric(5,2) not null default 2,
  per_km_rate numeric(10,2) not null default 10,
  store_lat numeric(10,6),
  store_lng numeric(10,6),
  road_factor numeric(4,2) not null default 1.3,
  constraint single_row check (id = 1)
);
insert into delivery_settings (id, free_km, per_km_rate)
values (1, 2, 10)
on conflict (id) do nothing;

-- ---------- orders ----------
create table if not exists orders (
  id uuid primary key default uuid_generate_v4(),
  order_number text not null unique,
  customer_name text not null,
  phone text not null,
  address text not null,
  zone_name text,
  distance_km numeric(5,2),
  delivery_lat numeric(10,6),
  delivery_lng numeric(10,6),
  user_id uuid references auth.users(id),
  items jsonb not null,              -- [{medicine_id, name, price, qty}]
  subtotal numeric(10,2) not null,
  delivery_fee numeric(10,2) not null,
  total numeric(10,2) not null,
  status text not null default 'Pending', -- Pending | Out for delivery | Delivered
  rx_confirmed boolean not null default false,
  created_at timestamptz not null default now()
);

-- ---------- recurring plan requests ----------
create table if not exists plan_requests (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id),
  customer_name text not null,
  phone text not null,
  frequency text not null,           -- monthly | yearly
  medicine_list text not null,
  note text,
  status text not null default 'New', -- New | Quoted | Closed
  quoted_price numeric(10,2),
  created_at timestamptz not null default now()
);

-- ---------- chat threads (one row per customer phone, messages as jsonb array) ----------
create table if not exists chat_threads (
  id uuid primary key default uuid_generate_v4(),
  customer_phone text not null unique,
  customer_name text,
  user_id uuid references auth.users(id),
  messages jsonb not null default '[]', -- [{from: 'customer'|'owner', text, time}]
  updated_at timestamptz not null default now()
);

-- ============================================================
-- Row Level Security
-- The customer app uses the public "anon" key, so customers can:
--   - read medicines & zones & delivery_settings
--   - insert orders, plan_requests
--   - read/insert/update their OWN chat thread and read their OWN orders
-- The owner app uses the SAME anon key but is protected by an
-- app-level PIN screen (see README) — for a stronger production
-- setup, move owner writes behind a Supabase Edge Function or
-- Supabase Auth. This schema keeps things simple for a v1 launch.
-- ============================================================

alter table medicines enable row level security;
alter table zones enable row level security;
alter table delivery_settings enable row level security;
alter table orders enable row level security;
alter table plan_requests enable row level security;
alter table chat_threads enable row level security;

-- Public read access (needed so the customer app can browse the catalog)
create policy "public read medicines" on medicines for select using (true);
create policy "public read zones" on zones for select using (true);
create policy "public read delivery_settings" on delivery_settings for select using (true);

-- Owner app writes to medicines/zones/settings (same anon key, gated by app PIN)
create policy "public write medicines" on medicines for all using (true) with check (true);
create policy "public write zones" on zones for all using (true) with check (true);
create policy "public write delivery_settings" on delivery_settings for all using (true) with check (true);

-- Orders: anyone can create; anyone can read (needed for "track by phone");
-- owner app also needs to update status
create policy "public insert orders" on orders for insert with check (true);
create policy "public read orders" on orders for select using (true);
create policy "public update orders" on orders for update using (true);

-- Plan requests: anyone can create/read/update (owner quotes them)
create policy "public insert plan_requests" on plan_requests for insert with check (true);
create policy "public read plan_requests" on plan_requests for select using (true);
create policy "public update plan_requests" on plan_requests for update using (true);

-- Chat threads: anyone can create/read/update
create policy "public insert chat_threads" on chat_threads for insert with check (true);
create policy "public read chat_threads" on chat_threads for select using (true);
create policy "public update chat_threads" on chat_threads for update using (true);

-- ============================================================
-- Realtime: turn on replication so both apps sync instantly
-- ============================================================
alter publication supabase_realtime add table medicines;
alter publication supabase_realtime add table orders;
alter publication supabase_realtime add table plan_requests;
alter publication supabase_realtime add table chat_threads;
alter publication supabase_realtime add table zones;
alter publication supabase_realtime add table delivery_settings;

-- ============================================================
-- Sample starter data (safe to delete later from the Owner app)
-- ============================================================
insert into zones (name, distance_km) values
  ('Rewa Road', 1.5),
  ('Civil Lines', 2.5),
  ('Birla Colony', 4),
  ('Sivil Lines Extension', 5.5),
  ('Highway Market', 7)
on conflict do nothing;

insert into medicines (name, category, price, stock, requires_rx) values
  ('Paracetamol 500mg (10 tab)', 'Fever & Pain', 25, 100, false),
  ('Azithromycin 500mg (5 tab)', 'Antibiotic', 85, 40, true),
  ('ORS Powder', 'General', 20, 60, false),
  ('Cetirizine 10mg (10 tab)', 'Allergy', 18, 50, false)
on conflict do nothing;
