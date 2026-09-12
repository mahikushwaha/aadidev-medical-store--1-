-- ============================================================
-- Aadidev Medical Store — Migration 2
-- Adds: customer login (Supabase Auth), real map-based delivery
-- location & distance.
-- Run this in the SQL Editor AFTER the original supabase-schema.sql
-- (safe to run even if some parts already exist — uses IF NOT EXISTS)
-- ============================================================

-- Store's own location, set once by the owner (used to calculate
-- distance to every customer)
alter table delivery_settings add column if not exists store_lat numeric(10,6);
alter table delivery_settings add column if not exists store_lng numeric(10,6);
alter table delivery_settings add column if not exists road_factor numeric(4,2) not null default 1.3;
-- road_factor: straight-line map distance is multiplied by this to
-- roughly approximate real road distance (1.3 is a good default for
-- a small city; the owner can tune it in the More page later).

-- Link orders / chats / plan requests to a logged-in customer account
alter table orders add column if not exists user_id uuid references auth.users(id);
alter table orders add column if not exists delivery_lat numeric(10,6);
alter table orders add column if not exists delivery_lng numeric(10,6);
-- zone_name / distance_km stay as-is: distance_km is now filled from
-- the real map calculation instead of a fixed zone list.

alter table chat_threads add column if not exists user_id uuid references auth.users(id);
alter table plan_requests add column if not exists user_id uuid references auth.users(id);

-- Let a logged-in customer read their own orders/chats by user_id
-- (in addition to the existing public-by-phone policies already in place)
drop policy if exists "users read own orders" on orders;
create policy "users read own orders" on orders for select using (
  auth.uid() = user_id or true  -- kept permissive (true) for the phone-based
  -- tracking flow to keep working; tighten to just "auth.uid() = user_id"
  -- later if you want orders fully private per account.
);
