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
  -- Salted hash of the poster's IP, used only to rate-limit. The raw address is
  -- never stored, so this identifies repeat posters without keeping personal data.
  ip_hash text,
  -- Set only on the owner's replies. One level deep: the API refuses to reply to
  -- a row that already has a parent.
  parent_id uuid references public.guestbook_comments (id) on delete cascade,
  -- Null for the site-wide guestbook; a post route for a blog post's thread.
  post_slug text,
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

-- Migration for a table created before rate limiting and replies existed.
alter table public.guestbook_comments
  add column if not exists ip_hash text;

alter table public.guestbook_comments
  add column if not exists parent_id uuid
  references public.guestbook_comments (id) on delete cascade;

-- Serves the "how many posts from this address recently?" rate-limit lookup.
create index if not exists guestbook_comments_rate_limit_idx
  on public.guestbook_comments (ip_hash, created_at desc)
  where ip_hash is not null;

-- Serves the reply fetch for a page of top-level notes.
create index if not exists guestbook_comments_parent_idx
  on public.guestbook_comments (parent_id, created_at)
  where deleted_at is null and parent_id is not null;

-- Migration for a table created before blog comments existed. Null means the
-- site-wide guestbook; a route means that post's own thread.
alter table public.guestbook_comments
  add column if not exists post_slug text;

-- Serves a blog post's thread listing.
create index if not exists guestbook_comments_post_slug_idx
  on public.guestbook_comments (post_slug, created_at desc)
  where deleted_at is null and parent_id is null;

-- Fetches a page, its replies, and the total top-level count in one database
-- round trip. `is not distinct from` makes null the site-wide guestbook scope
-- while a non-null slug selects one blog post's thread.
create or replace function public.get_guestbook_page(
  p_page integer default 1,
  p_page_size integer default 10,
  p_post_slug text default null
)
returns jsonb
language sql
stable
set search_path = public
as $$
  with normalized as (
    select
      greatest(coalesce(p_page, 1), 1) as page,
      least(greatest(coalesce(p_page_size, 10), 1), 50) as page_size
  ),
  top_level as (
    select c.*
    from public.guestbook_comments c
    where c.deleted_at is null
      and c.parent_id is null
      and c.post_slug is not distinct from p_post_slug
    order by c.created_at desc
    limit (select page_size from normalized)
    offset (select (page - 1) * page_size from normalized)
  ),
  serialized as (
    select
      c.created_at,
      jsonb_build_object(
        'id', c.id,
        'nickname', c.nickname,
        'emoji', c.emoji,
        'content', c.content,
        'createdAt', c.created_at,
        'isAuthorReply', false,
        'replies', coalesce(
          (
            select jsonb_agg(
              jsonb_build_object(
                'id', r.id,
                'nickname', r.nickname,
                'emoji', r.emoji,
                'content', r.content,
                'createdAt', r.created_at,
                'isAuthorReply', true,
                'replies', '[]'::jsonb
              )
              order by r.created_at asc
            )
            from public.guestbook_comments r
            where r.parent_id = c.id
              and r.deleted_at is null
          ),
          '[]'::jsonb
        )
      ) as item
    from top_level c
  )
  select jsonb_build_object(
    'comments', coalesce(
      (select jsonb_agg(item order by created_at desc) from serialized),
      '[]'::jsonb
    ),
    'total', (
      select count(*)
      from public.guestbook_comments c
      where c.deleted_at is null
        and c.parent_id is null
        and c.post_slug is not distinct from p_post_slug
    )
  );
$$;

-- The browser never calls RPC directly; only the server-side secret may run it.
revoke all on function public.get_guestbook_page(integer, integer, text)
  from public, anon, authenticated;
grant execute on function public.get_guestbook_page(integer, integer, text)
  to service_role;
