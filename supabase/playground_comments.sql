-- Run this once in Supabase Dashboard → SQL Editor.
create extension if not exists pgcrypto;

create table if not exists public.playground_comments (
  id uuid primary key default gen_random_uuid(),
  nickname varchar(20) not null check (char_length(nickname) between 1 and 20),
  -- Optional badge shown before the nickname. The API only ever writes a value
  -- from its own palette, so the length cap is just a backstop.
  emoji text check (emoji is null or char_length(emoji) between 1 and 24),
  content varchar(500) not null check (char_length(content) between 1 and 500),
  password_hash text not null,
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists playground_comments_visible_created_at_idx
  on public.playground_comments (created_at desc)
  where deleted_at is null;

alter table public.playground_comments enable row level security;

-- The browser never accesses this table directly. With no public RLS policies,
-- only the server-side Supabase secret key and the project owner can manage it.
revoke all on table public.playground_comments from anon, authenticated;

-- Migration for a table created before `emoji` existed. Safe to re-run.
alter table public.playground_comments
  add column if not exists emoji text
  check (emoji is null or char_length(emoji) between 1 and 24);

