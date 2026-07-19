# Guestbook setup

The guestbook uses Supabase only as a private server-side database. Visitors never receive a
Supabase key and can delete only their own notes with the password they chose when posting.

## 1. Create the database

1. Create a Supabase project.
2. Open **SQL Editor** in the Supabase Dashboard.
3. Paste and run [`guestbook_comments.sql`](./guestbook_comments.sql).

The script is safe to re-run. Existing projects should run the latest full file once more after
pulling changes because it also installs `get_guestbook_page`, the single-query function used by
the optimized comment loader.

## 2. Configure local development

Copy these values into `.env.local`:

```dotenv
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SECRET_KEY=sb_secret_xxxxxxxxxx
GUESTBOOK_ADMIN_PASSWORD=replace-with-a-long-random-password
```

Find them in **Project Settings → API Keys**. Older projects can use
`SUPABASE_SERVICE_ROLE_KEY` instead of `SUPABASE_SECRET_KEY`.

Never prefix the secret with `NEXT_PUBLIC_`, commit `.env.local`, or paste the secret into
browser code.

## 3. Configure Vercel

Add the same two environment variables in **Vercel → Project Settings → Environment
Variables**, plus `GUESTBOOK_ADMIN_PASSWORD` if you want owner moderation through the regular
delete form. Then redeploy the site.

### Function region

Keep the Vercel Function region close to the Supabase database region. Check the database region
in Supabase first, then open **Vercel → Project Settings → Functions → Function Regions** and
select the closest match. For a Supabase project in Seoul (`ap-northeast-2`), select Vercel's
Seoul region (`icn1`). A region change applies to the next deployment.

## Loading performance

The first page is server-rendered so visitors do not wait for client hydration before seeing
messages. Page reads call `get_guestbook_page` once for top-level messages, replies, and the total
count. Results are cached for 30 seconds and the cache is expired immediately after posting,
replying, or deleting, so moderation and new messages remain consistent.

## Blog comments

Blog posts share this table. A post's comments carry its route in `post_slug`; the site-wide
guestbook leaves that column null, which is what separates the two threads. Replies inherit
their parent's slug on the server, so a reply can never be filed under a different post.

## Replies

Only the owner can reply. Every note shows a **Reply** button, and posting one requires
`GUESTBOOK_ADMIN_PASSWORD`; the server rejects anything else with a 403. Replies are one level
deep and are posted under the site name from `data/meta.yml`, so nobody can post as the owner.

## Rate limiting

Posting is capped at 3 notes per minute per address. The check stores a salted SHA-256 hash of
the IP in `ip_hash`, never the address itself, and runs before the password hash so a flood costs
one indexed lookup rather than a key derivation. If the lookup itself fails the guestbook stays
open rather than locking everyone out.

## Moderation

Open **Supabase Dashboard → Table Editor → guestbook_comments**. To hide a note while keeping
it recoverable, set its `deleted_at` value to the current time. To remove it permanently, delete
the row. Alternatively, enter `GUESTBOOK_ADMIN_PASSWORD` in any note's regular deletion-password
field. The UI does not reveal that this owner password exists, and the public guestbook never
exposes either the password or `password_hash`.
