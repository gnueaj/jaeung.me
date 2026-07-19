import { normalizeGuestbookEmoji } from "@/lib/guestbook-emoji";
import {
  CommentsNotConfiguredError,
  getCommentsDatabase,
  hashClientIp,
  hashCommentPassword,
  verifyCommentPassword,
  verifyGuestbookAdminPassword,
} from "@/lib/guestbook-comments";
import { siteConfig } from "@/site.config";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NICKNAME_MAX_LENGTH = 20;
const CONTENT_MAX_LENGTH = 500;
const PASSWORD_MIN_LENGTH = 4;
const PASSWORD_MAX_LENGTH = 72;
const COMMENTS_PAGE_SIZE = 10;

// At most this many notes from one address per window. Generous for a person
// signing a guestbook, useless for a script.
const RATE_LIMIT_MAX_POSTS = 3;
const RATE_LIMIT_WINDOW_MINUTES = 1;

const AUTHOR_REPLY_EMOJI = "👾";

const COMMENT_FIELDS = "id,nickname,emoji,content,created_at,parent_id,post_slug";

// Guestbook notes carry no slug; blog comments carry the post's route. Kept in
// one table so replies, deletion, rate limiting and moderation have one
// implementation rather than two that drift.
function readSlug(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > 200) return null;
  // Route-shaped only, so the column can never become a second content field.
  if (!/^[a-z0-9/_-]+$/i.test(trimmed)) return null;
  return trimmed;
}

type CommentRow = {
  id: string;
  nickname: string;
  emoji: string | null;
  content: string;
  created_at: string;
  parent_id: string | null;
  post_slug: string | null;
};

type CommentWithPasswordRow = CommentRow & {
  password_hash: string;
};

type PublicComment = {
  id: string;
  nickname: string;
  emoji: string | null;
  content: string;
  createdAt: string;
  isAuthorReply: boolean;
  replies: PublicComment[];
};

const publicComment = (row: CommentRow, replies: CommentRow[] = []): PublicComment => ({
  id: row.id,
  nickname: row.nickname,
  emoji: row.emoji,
  content: row.content,
  createdAt: row.created_at,
  // Only the owner can reply, so having a parent is what marks a row as theirs.
  isAuthorReply: row.parent_id !== null,
  replies: replies.map((reply) => publicComment(reply)),
});

function errorResponse(error: unknown) {
  if (error instanceof CommentsNotConfiguredError) {
    return NextResponse.json(
      { error: "The guestbook is being prepared." },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }

  console.error("Playground comments error", error);
  return NextResponse.json(
    { error: "Comments are temporarily unavailable." },
    { status: 500, headers: { "Cache-Control": "no-store" } },
  );
}

function validateCommentInput(input: unknown) {
  if (!input || typeof input !== "object") return null;

  const body = input as Record<string, unknown>;
  const nickname = typeof body.nickname === "string" ? body.nickname.trim() : "";
  const content = typeof body.content === "string" ? body.content.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";
  const website = typeof body.website === "string" ? body.website.trim() : "";
  const parentId = typeof body.parentId === "string" && body.parentId ? body.parentId : null;
  const postSlug = readSlug(body.postSlug);

  if (website) return null;
  if (!content || content.length > CONTENT_MAX_LENGTH || content.includes("\0")) return null;
  if (password.length < PASSWORD_MIN_LENGTH || password.length > PASSWORD_MAX_LENGTH) return null;

  // A reply is always the owner's, so its nickname and badge come from the site
  // config rather than the request — nobody gets to post under Jaeung's name.
  if (parentId) {
    return {
      nickname: siteConfig.name,
      emoji: AUTHOR_REPLY_EMOJI,
      content,
      password,
      parentId,
      postSlug,
    };
  }

  if (!nickname || nickname.length > NICKNAME_MAX_LENGTH || /[\r\n\t]/.test(nickname)) {
    return null;
  }

  // Optional. Any single emoji is fine; anything else is dropped.
  const emoji = normalizeGuestbookEmoji(body.emoji);

  return { nickname, emoji, content, password, parentId: null, postSlug };
}

/**
 * Counts recent notes from the same address. Runs before the password hash so a
 * flood costs a cheap indexed lookup instead of a full scrypt derivation.
 */
async function isRateLimited(
  database: ReturnType<typeof getCommentsDatabase>,
  ipHash: string,
): Promise<boolean> {
  const since = new Date(Date.now() - RATE_LIMIT_WINDOW_MINUTES * 60_000).toISOString();
  const { count, error } = await database
    .from("guestbook_comments")
    .select("id", { count: "exact", head: true })
    .eq("ip_hash", ipHash)
    .gte("created_at", since);

  // Fail open: a hiccup in the limiter should not take the guestbook down.
  if (error) {
    console.error("Guestbook rate-limit check failed", error);
    return false;
  }

  return (count ?? 0) >= RATE_LIMIT_MAX_POSTS;
}

export async function GET(request: NextRequest) {
  try {
    const requestedPage = Number.parseInt(request.nextUrl.searchParams.get("page") ?? "1", 10);
    const page = Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1;
    const from = (page - 1) * COMMENTS_PAGE_SIZE;
    const to = from + COMMENTS_PAGE_SIZE - 1;
    const postSlug = readSlug(request.nextUrl.searchParams.get("postSlug"));
    const database = getCommentsDatabase();
    // Paginate over top-level notes only, so a heavily-replied note still
    // counts as one entry and page sizes stay predictable.
    const scoped = database
      .from("guestbook_comments")
      .select(COMMENT_FIELDS, { count: "exact" })
      .is("deleted_at", null)
      .is("parent_id", null);
    const { data, error, count } = await (
      postSlug ? scoped.eq("post_slug", postSlug) : scoped.is("post_slug", null)
    )
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) throw error;

    const comments = (data ?? []) as unknown as CommentRow[];

    // One extra query for the whole page rather than one per note.
    const repliesByParent = new Map<string, CommentRow[]>();
    if (comments.length > 0) {
      const { data: replyData, error: replyError } = await database
        .from("guestbook_comments")
        .select(COMMENT_FIELDS)
        .is("deleted_at", null)
        .in(
          "parent_id",
          comments.map((comment) => comment.id),
        )
        .order("created_at", { ascending: true });

      if (replyError) throw replyError;

      for (const reply of (replyData ?? []) as unknown as CommentRow[]) {
        if (!reply.parent_id) continue;
        const existing = repliesByParent.get(reply.parent_id);
        if (existing) existing.push(reply);
        else repliesByParent.set(reply.parent_id, [reply]);
      }
    }

    const total = count ?? 0;

    return NextResponse.json(
      {
        comments: comments.map((comment) =>
          publicComment(comment, repliesByParent.get(comment.id) ?? []),
        ),
        pagination: {
          page,
          pageSize: COMMENTS_PAGE_SIZE,
          total,
          totalPages: Math.max(1, Math.ceil(total / COMMENTS_PAGE_SIZE)),
        },
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const input = validateCommentInput(await request.json());
    if (!input) {
      return NextResponse.json(
        { error: "Check the nickname, message, and password." },
        { status: 400 },
      );
    }

    const database = getCommentsDatabase();
    let postSlug = input.postSlug;

    if (input.parentId) {
      // Replies are owner-only, and the password is the sole gate.
      if (!verifyGuestbookAdminPassword(input.password)) {
        return NextResponse.json({ error: "Incorrect password." }, { status: 403 });
      }

      const { data: parent, error: parentError } = await database
        .from("guestbook_comments")
        .select("id,parent_id,post_slug")
        .eq("id", input.parentId)
        .is("deleted_at", null)
        .maybeSingle();

      if (parentError) throw parentError;
      if (!parent) return NextResponse.json({ error: "Comment not found." }, { status: 404 });
      // Keep the thread one level deep.
      if (parent.parent_id) {
        return NextResponse.json({ error: "Cannot reply to a reply." }, { status: 400 });
      }
      // Inherit the thread's slug instead of trusting the request, so a reply
      // can never be filed under a different post than the note it answers.
      postSlug = parent.post_slug as string | null;
    } else {
      const ipHash = hashClientIp(request);
      if (await isRateLimited(database, ipHash)) {
        return NextResponse.json(
          { error: "You've posted a few times just now. Please try again in a little while." },
          { status: 429, headers: { "Retry-After": String(RATE_LIMIT_WINDOW_MINUTES * 60) } },
        );
      }
    }

    const passwordHash = await hashCommentPassword(input.password);
    const { data, error } = await database
      .from("guestbook_comments")
      .insert({
        nickname: input.nickname,
        emoji: input.emoji,
        content: input.content,
        password_hash: passwordHash,
        parent_id: input.parentId,
        post_slug: postSlug,
        // Replies come from the owner, so there is nothing to rate-limit.
        ip_hash: input.parentId ? null : hashClientIp(request),
      })
      .select(COMMENT_FIELDS)
      .single();

    if (error) throw error;

    return NextResponse.json(
      { comment: publicComment(data as unknown as CommentRow) },
      {
        status: 201,
      },
    );
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    }
    return errorResponse(error);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const input = (await request.json()) as Record<string, unknown>;
    const id = typeof input.id === "string" ? input.id : "";
    const password = typeof input.password === "string" ? input.password : "";

    if (!id || password.length < PASSWORD_MIN_LENGTH || password.length > PASSWORD_MAX_LENGTH) {
      return NextResponse.json({ error: "Enter the deletion password." }, { status: 400 });
    }

    const database = getCommentsDatabase();
    const { data, error: readError } = await database
      .from("guestbook_comments")
      .select(`${COMMENT_FIELDS},password_hash`)
      .eq("id", id)
      .is("deleted_at", null)
      .maybeSingle();

    if (readError) throw readError;
    if (!data) return NextResponse.json({ error: "Comment not found." }, { status: 404 });

    const comment = data as CommentWithPasswordRow;
    const isAuthor = await verifyCommentPassword(password, comment.password_hash);
    const isAdmin = verifyGuestbookAdminPassword(password);
    if (!isAuthor && !isAdmin) {
      return NextResponse.json({ error: "Incorrect password." }, { status: 403 });
    }

    const { error: deleteError } = await database
      .from("guestbook_comments")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id)
      .is("deleted_at", null);

    if (deleteError) throw deleteError;
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    }
    return errorResponse(error);
  }
}
