import { normalizeGuestbookEmoji } from "@/lib/guestbook-emoji";
import {
  CommentsNotConfiguredError,
  getCommentsDatabase,
  hashCommentPassword,
  verifyCommentPassword,
  verifyGuestbookAdminPassword,
} from "@/lib/guestbook-comments";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NICKNAME_MAX_LENGTH = 20;
const CONTENT_MAX_LENGTH = 500;
const PASSWORD_MIN_LENGTH = 4;
const PASSWORD_MAX_LENGTH = 72;
const COMMENTS_PAGE_SIZE = 10;

type CommentRow = {
  id: string;
  nickname: string;
  emoji: string | null;
  content: string;
  created_at: string;
};

type CommentWithPasswordRow = CommentRow & {
  password_hash: string;
};

const publicComment = (row: CommentRow) => ({
  id: row.id,
  nickname: row.nickname,
  emoji: row.emoji,
  content: row.content,
  createdAt: row.created_at,
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

  if (website) return null;
  if (!nickname || nickname.length > NICKNAME_MAX_LENGTH || /[\r\n\t]/.test(nickname)) {
    return null;
  }
  if (!content || content.length > CONTENT_MAX_LENGTH || content.includes("\0")) return null;
  if (password.length < PASSWORD_MIN_LENGTH || password.length > PASSWORD_MAX_LENGTH) return null;

  // Optional. Any single emoji is fine; anything else is dropped.
  const emoji = normalizeGuestbookEmoji(body.emoji);

  return { nickname, emoji, content, password };
}

export async function GET(request: NextRequest) {
  try {
    const requestedPage = Number.parseInt(request.nextUrl.searchParams.get("page") ?? "1", 10);
    const page = Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1;
    const from = (page - 1) * COMMENTS_PAGE_SIZE;
    const to = from + COMMENTS_PAGE_SIZE - 1;
    const database = getCommentsDatabase();
    const { data, error, count } = await database
      .from("guestbook_comments")
      .select("id,nickname,emoji,content,created_at", { count: "exact" })
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) throw error;

    const total = count ?? 0;

    return NextResponse.json(
      {
        comments: ((data ?? []) as CommentRow[]).map(publicComment),
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
    const passwordHash = await hashCommentPassword(input.password);
    const { data, error } = await database
      .from("guestbook_comments")
      .insert({
        nickname: input.nickname,
        emoji: input.emoji,
        content: input.content,
        password_hash: passwordHash,
      })
      .select("id,nickname,emoji,content,created_at")
      .single();

    if (error) throw error;

    return NextResponse.json({ comment: publicComment(data as CommentRow) }, { status: 201 });
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
      .select("id,nickname,emoji,content,created_at,password_hash")
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
