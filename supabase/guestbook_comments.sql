-- Run this once in Supabase Dashboard → SQL Editor. Safe to re-run.
create extension if not exists pgcrypto;

-- Rename from the old `playground_comments` table, carrying existing notes over.
-- This has to run BEFORE the create below: the other order would leave a fresh,
-- empty `guestbook_comments` here and strand every existing note in the old table.
-- Renaming a table leaves its indexes under their original names, so fix that too.
do $$
begin
  if to_regclass('public.playground_comments') is not null
     and to_regclass('public.guestbook_comments') is null then
    alter table public.playground_comments rename to guestbook_comments;
  end if;

  if to_regclass('public.playground_comments_visible_created_at_idx') is not null then
    alter index public.playground_comments_visible_created_at_idx
      rename to guestbook_comments_visible_created_at_idx;
  end if;
end $$;

create table if not exists public.guestbook_comments (
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

create index if not exists guestbook_comments_visible_created_at_idx
  on public.guestbook_comments (created_at desc)
  where deleted_at is null;

alter table public.guestbook_comments enable row level security;

-- The browser never accesses this table directly. With no public RLS policies,
-- only the server-side Supabase secret key and the project owner can manage it.
revoke all on table public.guestbook_comments from anon, authenticated;

-- Migration for a table created before `emoji` existed. Safe to re-run.
alter table public.guestbook_comments
  add column if not exists emoji text
  check (emoji is null or char_length(emoji) between 1 and 24);

