import { getCachedGuestbookPage } from "@/lib/guestbook-comments";
import Comments, { type CommentsInitialData, type CommentsProps } from "./Comments";

const COMMENTS_PAGE_SIZE = 10;

type CommentsServerProps = Omit<CommentsProps, "initialData">;

/**
 * Supplies the first page in the server-rendered HTML. The client component
 * still owns posting, deletion, replies, and later pages, but visitors no
 * longer wait for hydration before the first database request can begin.
 */
export default async function CommentsServer(props: CommentsServerProps = {}) {
  let initialData: CommentsInitialData | undefined;

  try {
    const { comments, total } = await getCachedGuestbookPage(
      1,
      COMMENTS_PAGE_SIZE,
      props.postSlug ?? null,
    );
    initialData = {
      comments,
      pagination: {
        page: 1,
        pageSize: COMMENTS_PAGE_SIZE,
        total,
        totalPages: Math.max(1, Math.ceil(total / COMMENTS_PAGE_SIZE)),
      },
    };
  } catch {
    // Keep builds without guestbook credentials working. In that case the
    // client falls back to the existing API request and its normal error UI.
  }

  return <Comments {...props} initialData={initialData} />;
}
