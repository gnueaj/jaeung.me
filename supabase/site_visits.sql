-- Run this once in Supabase Dashboard → SQL Editor. Safe to re-run.
--
-- One row per (visitor, day). A visitor is identified by a salted hash of their
-- IP, the same scheme the guestbook uses, so no raw address is ever stored.
-- "Today" counts rows for the current UTC day; "Total" counts every row, i.e.
-- the running sum of daily unique visitors.
create table if not exists public.site_visits (
  ip_hash text not null,
  day date not null default (now() at time zone 'utc')::date,
  created_at timestamptz not null default now(),
  primary key (ip_hash, day)
);

create index if not exists site_visits_day_idx on public.site_visits (day);

alter table public.site_visits enable row level security;

-- The browser never touches this table directly; only the server-side secret key
-- and the project owner can read or write it.
revoke all on table public.site_visits from anon, authenticated;
