import {
  CommentsNotConfiguredError,
  getCommentsDatabase,
  hashClientIp,
} from "@/lib/guestbook-comments";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function todayUtc() {
  return new Date().toISOString().slice(0, 10);
}

async function readCounts(database: ReturnType<typeof getCommentsDatabase>) {
  const [{ count: total }, { count: today }] = await Promise.all([
    database.from("site_visits").select("ip_hash", { count: "exact", head: true }),
    database
      .from("site_visits")
      .select("ip_hash", { count: "exact", head: true })
      .eq("day", todayUtc()),
  ]);
  return { total: total ?? 0, today: today ?? 0 };
}

function errorResponse(error: unknown) {
  if (error instanceof CommentsNotConfiguredError) {
    return NextResponse.json(
      { error: "Visit counts are not configured." },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
  console.error("Site visits error", error);
  return NextResponse.json(
    { error: "Visit counts are temporarily unavailable." },
    { status: 500, headers: { "Cache-Control": "no-store" } },
  );
}

// GET returns the counts without recording; POST records this visitor for today
// (deduped by the primary key) and then returns the fresh counts.
export async function GET() {
  try {
    const database = getCommentsDatabase();
    return NextResponse.json(await readCounts(database), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const database = getCommentsDatabase();
    const ipHash = hashClientIp(request);

    // First visit of the day inserts; later ones hit the primary key and are
    // ignored, so a refresh never inflates the count.
    const { error } = await database
      .from("site_visits")
      .upsert(
        { ip_hash: ipHash, day: todayUtc() },
        { onConflict: "ip_hash,day", ignoreDuplicates: true },
      );
    if (error) throw error;

    return NextResponse.json(await readCounts(database), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
