# Guestbook setup

The guestbook uses Supabase only as a private server-side database. Visitors never receive a
Supabase key and can delete only their own notes with the password they chose when posting.

## 1. Create the database

1. Create a Supabase project.
2. Open **SQL Editor** in the Supabase Dashboard.
3. Paste and run [`guestbook_comments.sql`](./guestbook_comments.sql).

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

## Moderation

Open **Supabase Dashboard → Table Editor → guestbook_comments**. To hide a note while keeping
it recoverable, set its `deleted_at` value to the current time. To remove it permanently, delete
the row. Alternatively, enter `GUESTBOOK_ADMIN_PASSWORD` in any note's regular deletion-password
field. The UI does not reveal that this owner password exists, and the public guestbook never
exposes either the password or `password_hash`.
