"use client";

import { GUESTBOOK_EMOJI_SUGGESTIONS, normalizeGuestbookEmoji } from "@/lib/guestbook-emoji";
import { FormEvent, useEffect, useRef, useState } from "react";

export type GuestbookComment = {
  id: string;
  nickname: string;
  emoji: string | null;
  content: string;
  createdAt: string;
  isAuthorReply: boolean;
  replies: GuestbookComment[];
};

export type GuestbookPagination = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

const COMMENTS_PAGE_SIZE = 10;

const inputClassName =
  "w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-primary focus:ring-2 focus:ring-primary/15 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-500";

async function responseError(response: Response) {
  const payload = (await response.json().catch(() => null)) as { error?: string } | null;
  return payload?.error ?? "Something went wrong. Please try again.";
}

function formatCommentDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(date);
}

export type CommentsInitialData = {
  comments: GuestbookComment[];
  pagination: GuestbookPagination;
};

export type CommentsProps = {
  /**
   * Scopes the thread. Omitted on the guestbook, which is the site-wide thread;
   * a blog post passes its route so each post gets its own.
   */
  postSlug?: string;
  emptyTitle?: string;
  emptyHint?: string;
  initialData?: CommentsInitialData;
};

export default function Comments({
  postSlug,
  emptyTitle = "No messages yet.",
  emptyHint = "Be the first to sign the guestbook.",
  initialData,
}: CommentsProps = {}) {
  const scopeQuery = postSlug ? `&postSlug=${encodeURIComponent(postSlug)}` : "";
  const [comments, setComments] = useState<GuestbookComment[]>(initialData?.comments ?? []);
  const [nickname, setNickname] = useState("");
  const [emoji, setEmoji] = useState<string | null>(null);
  const [content, setContent] = useState("");
  const [password, setPassword] = useState("");
  const [website, setWebsite] = useState("");
  const [isLoading, setIsLoading] = useState(!initialData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConfigured, setIsConfigured] = useState(true);
  const [message, setMessage] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deletePassword, setDeletePassword] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEmojiOpen, setIsEmojiOpen] = useState(false);
  const [page, setPage] = useState(initialData?.pagination.page ?? 1);
  const [totalComments, setTotalComments] = useState(initialData?.pagination.total ?? 0);
  const [totalPages, setTotalPages] = useState(initialData?.pagination.totalPages ?? 1);
  const [reloadKey, setReloadKey] = useState(0);
  const [replyTarget, setReplyTarget] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [replyPassword, setReplyPassword] = useState("");
  const [isReplying, setIsReplying] = useState(false);
  const emojiRef = useRef<HTMLDivElement>(null);
  const skipInitialFetchRef = useRef(Boolean(initialData));

  // Dismiss the badge picker the way any popover should: click away or Escape.
  useEffect(() => {
    if (!isEmojiOpen) return;

    const onPointerDown = (event: MouseEvent) => {
      if (!emojiRef.current?.contains(event.target as Node)) setIsEmojiOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsEmojiOpen(false);
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [isEmojiOpen]);

  useEffect(() => {
    if (skipInitialFetchRef.current) {
      skipInitialFetchRef.current = false;
      return;
    }

    let cancelled = false;

    void fetch(`/api/comments?page=${page}${scopeQuery}`, { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) {
          if (response.status === 503 && !cancelled) setIsConfigured(false);
          throw new Error(await responseError(response));
        }
        return (await response.json()) as {
          comments: GuestbookComment[];
          pagination: GuestbookPagination;
        };
      })
      .then((payload) => {
        if (cancelled) return;
        setComments(payload.comments);
        setTotalComments(payload.pagination.total);
        setTotalPages(payload.pagination.totalPages);
        setIsConfigured(true);
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setMessage(error instanceof Error ? error.message : "Comments are unavailable.");
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [page, reloadKey, scopeQuery]);

  function goToPage(nextPage: number) {
    if (nextPage < 1 || nextPage > totalPages || nextPage === page) return;
    setIsLoading(true);
    setDeleteTarget(null);
    setDeletePassword("");
    setMessage("");
    setPage(nextPage);
  }

  async function submitComment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage("");

    try {
      const response = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nickname, emoji, content, password, website, postSlug }),
      });

      if (!response.ok) throw new Error(await responseError(response));

      const payload = (await response.json()) as { comment: GuestbookComment };
      const nextTotal = totalComments + 1;
      setTotalComments(nextTotal);
      setTotalPages(Math.max(1, Math.ceil(nextTotal / COMMENTS_PAGE_SIZE)));

      if (page === 1) {
        setComments((current) => [payload.comment, ...current].slice(0, COMMENTS_PAGE_SIZE));
      } else {
        setIsLoading(true);
        setPage(1);
      }
      setContent("");
      setPassword("");
      setMessage("Thanks for the note!");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not post your note.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function submitReply(parentId: string) {
    setIsReplying(true);
    setMessage("");

    try {
      const response = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ parentId, content: replyContent, password: replyPassword }),
      });

      if (!response.ok) throw new Error(await responseError(response));

      const payload = (await response.json()) as { comment: GuestbookComment };
      setComments((current) =>
        current.map((comment) =>
          comment.id === parentId
            ? { ...comment, replies: [...comment.replies, payload.comment] }
            : comment,
        ),
      );

      setReplyTarget(null);
      setReplyContent("");
      // Deliberately keep the password so a run of replies needs it typed once.
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not post the reply.");
    } finally {
      setIsReplying(false);
    }
  }

  async function deleteComment(id: string, parentId?: string) {
    setIsDeleting(true);
    setMessage("");

    try {
      const response = await fetch("/api/comments", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, password: deletePassword }),
      });

      if (!response.ok) throw new Error(await responseError(response));

      setDeleteTarget(null);
      setDeletePassword("");

      // Replies don't affect the counts — pagination is over top-level notes
      // only — so drop it in place instead of refetching the page.
      if (parentId) {
        setComments((current) =>
          current.map((comment) =>
            comment.id === parentId
              ? { ...comment, replies: comment.replies.filter((reply) => reply.id !== id) }
              : comment,
          ),
        );
        return;
      }

      const nextTotal = Math.max(0, totalComments - 1);
      const nextTotalPages = Math.max(1, Math.ceil(nextTotal / COMMENTS_PAGE_SIZE));
      setIsLoading(true);
      if (page > nextTotalPages) {
        setPage(nextTotalPages);
      } else {
        setReloadKey((current) => current + 1);
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not delete the note.");
    } finally {
      setIsDeleting(false);
    }
  }

  const isBusy = !isConfigured || isSubmitting;

  return (
    <section className="not-prose mt-5 flex flex-col gap-5">
      {message && (
        <p
          role="status"
          aria-live="polite"
          className="m-0 rounded-xl bg-violet-500/10 px-4 py-2.5 text-sm text-zinc-700 dark:text-zinc-200">
          {message}
        </p>
      )}

      {/* Messages come first: visitors read the wall before deciding to sign it. */}
      {isLoading ? (
        <p className="m-0 py-10 text-center text-sm text-zinc-500 dark:text-zinc-400">
          Loading messages…
        </p>
      ) : comments.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-300 py-10 text-center dark:border-zinc-700">
          <p className="m-0 text-sm font-medium text-zinc-600 dark:text-zinc-300">{emptyTitle}</p>
          <p className="m-0 mt-1 text-xs text-zinc-400 dark:text-zinc-500">{emptyHint}</p>
        </div>
      ) : (
        <>
          <p className="m-0 text-xs font-medium tracking-wide text-zinc-400 uppercase dark:text-zinc-500">
            {totalComments} {totalComments === 1 ? "message" : "messages"}
          </p>
          <ol className="m-0 flex list-none flex-col gap-3 p-0">
            {comments.map((comment) => (
              <li
                key={comment.id}
                className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
                <div className="flex items-start gap-3">
                  <span
                    aria-hidden="true"
                    className="relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-lg dark:bg-zinc-800">
                    {comment.emoji ?? "👾"}
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-2">
                      <p className="m-0 truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                        {comment.nickname}
                      </p>
                      <p className="m-0 shrink-0 text-xs text-zinc-400 dark:text-zinc-500">
                        {formatCommentDate(comment.createdAt)}
                      </p>
                    </div>
                    <p className="mt-1.5 mb-0 text-sm leading-6 break-words whitespace-pre-wrap text-zinc-700 dark:text-zinc-300">
                      {comment.content}
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-1">
                    {/* Shown to everyone. The password check on the server is
                        the real gate, so there is nothing to hide behind a flag. */}
                    <button
                      type="button"
                      onClick={() => {
                        setReplyTarget((current) => (current === comment.id ? null : comment.id));
                        setReplyContent("");
                        setMessage("");
                      }}
                      aria-expanded={replyTarget === comment.id}
                      className="hover:text-primary px-1 py-0.5 text-xs text-zinc-400 transition dark:text-zinc-500">
                      Reply
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDeleteTarget((current) => (current === comment.id ? null : comment.id));
                        setDeletePassword("");
                        setMessage("");
                      }}
                      aria-expanded={deleteTarget === comment.id}
                      className="hover:text-primary px-1 py-0.5 text-xs text-zinc-400 transition dark:text-zinc-500">
                      Delete
                    </button>
                  </div>
                </div>

                {comment.replies.length > 0 && (
                  <ol className="me-reply-thread mt-5">
                    {comment.replies.map((reply) => (
                      <li key={reply.id}>
                        <div className="flex items-start gap-3">
                          <span
                            aria-hidden="true"
                            className="me-reply-avatar relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-base">
                            {reply.emoji ?? "👾"}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-baseline gap-2">
                              <p className="m-0 truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                                {reply.nickname}
                              </p>
                              <span className="bg-primary/15 text-primary m-0 shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-medium">
                                Author
                              </span>
                              <p className="m-0 shrink-0 text-xs text-zinc-400 dark:text-zinc-500">
                                {formatCommentDate(reply.createdAt)}
                              </p>
                            </div>
                            <p className="mt-1.5 mb-0 text-sm leading-6 break-words whitespace-pre-wrap text-zinc-700 dark:text-zinc-300">
                              {reply.content}
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              setDeleteTarget((current) =>
                                current === reply.id ? null : reply.id,
                              );
                              setDeletePassword("");
                              setMessage("");
                            }}
                            aria-expanded={deleteTarget === reply.id}
                            className="hover:text-primary shrink-0 px-1 py-0.5 text-xs text-zinc-400 transition dark:text-zinc-500">
                            Delete
                          </button>
                        </div>

                        {deleteTarget === reply.id && (
                          <div className="mt-2 flex flex-col gap-2 rounded-xl bg-zinc-100 p-3 sm:flex-row dark:bg-zinc-800/70">
                            <input
                              type="password"
                              minLength={4}
                              maxLength={72}
                              autoFocus
                              autoComplete="current-password"
                              value={deletePassword}
                              onChange={(event) => setDeletePassword(event.target.value)}
                              onKeyDown={(event) => {
                                if (event.key === "Enter") void deleteComment(reply.id, comment.id);
                              }}
                              className={inputClassName}
                              placeholder="Owner password"
                              aria-label="Owner password"
                            />
                            <button
                              type="button"
                              disabled={isDeleting || deletePassword.length < 4}
                              onClick={() => void deleteComment(reply.id, comment.id)}
                              className="rounded-xl bg-zinc-900 px-3 py-2 text-sm font-medium whitespace-nowrap text-white transition hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white">
                              {isDeleting ? "Deleting…" : "Confirm delete"}
                            </button>
                          </div>
                        )}
                      </li>
                    ))}
                  </ol>
                )}

                {replyTarget === comment.id && (
                  <div className="mt-3 flex flex-col gap-2 rounded-xl bg-zinc-100 p-3 dark:bg-zinc-800/70">
                    <textarea
                      rows={2}
                      maxLength={500}
                      autoFocus
                      value={replyContent}
                      onChange={(event) => setReplyContent(event.target.value)}
                      className={`${inputClassName} resize-y`}
                      placeholder="Write a reply…"
                      aria-label="Reply"
                    />
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <input
                        type="password"
                        minLength={4}
                        maxLength={72}
                        autoComplete="current-password"
                        value={replyPassword}
                        onChange={(event) => setReplyPassword(event.target.value)}
                        className={inputClassName}
                        placeholder="Owner password"
                        aria-label="Owner password"
                      />
                      <button
                        type="button"
                        disabled={isReplying || !replyContent.trim() || replyPassword.length < 4}
                        onClick={() => void submitReply(comment.id)}
                        className="rounded-xl bg-zinc-900 px-3 py-2 text-sm font-medium whitespace-nowrap text-white transition hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white">
                        {isReplying ? "Posting…" : "Post reply"}
                      </button>
                    </div>
                  </div>
                )}

                {deleteTarget === comment.id && (
                  <div className="mt-3 flex flex-col gap-2 rounded-xl bg-zinc-100 p-3 sm:flex-row dark:bg-zinc-800/70">
                    <input
                      type="password"
                      minLength={4}
                      maxLength={72}
                      autoFocus
                      autoComplete="current-password"
                      value={deletePassword}
                      onChange={(event) => setDeletePassword(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") void deleteComment(comment.id);
                      }}
                      className={inputClassName}
                      placeholder="Deletion password"
                      aria-label="Deletion password"
                    />
                    <button
                      type="button"
                      disabled={isDeleting || deletePassword.length < 4}
                      onClick={() => void deleteComment(comment.id)}
                      className="rounded-xl bg-zinc-900 px-3 py-2 text-sm font-medium whitespace-nowrap text-white transition hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white">
                      {isDeleting ? "Deleting…" : "Confirm delete"}
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ol>

          <nav
            aria-label="Guestbook pages"
            className="mt-1 flex items-center justify-center gap-4 text-sm">
            <button
              type="button"
              disabled={page === 1 || isLoading}
              onClick={() => goToPage(page - 1)}
              className="hover:text-primary rounded-lg px-2 py-1.5 text-zinc-500 transition disabled:cursor-not-allowed disabled:opacity-30 dark:text-zinc-400">
              ← Previous
            </button>
            <span className="min-w-14 text-center font-medium text-zinc-600 tabular-nums dark:text-zinc-300">
              {page} / {totalPages}
            </span>
            <button
              type="button"
              disabled={page === totalPages || isLoading}
              onClick={() => goToPage(page + 1)}
              className="hover:text-primary rounded-lg px-2 py-1.5 text-zinc-500 transition disabled:cursor-not-allowed disabled:opacity-30 dark:text-zinc-400">
              Next →
            </button>
          </nav>
        </>
      )}

      {/* …then the form, the way a comment section reads. */}
      <form
        onSubmit={submitComment}
        className="relative rounded-2xl border border-zinc-200 bg-zinc-50/70 p-4 dark:border-zinc-800 dark:bg-zinc-950/40">
        <p className="m-0 mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          Leave a message
        </p>

        <div className="mb-2 grid gap-2 sm:grid-cols-2">
          <div ref={emojiRef} className="relative flex gap-2">
            <button
              type="button"
              onClick={() => setIsEmojiOpen((open) => !open)}
              disabled={isBusy}
              aria-haspopup="true"
              aria-expanded={isEmojiOpen}
              aria-label="Choose a badge"
              className="hover:border-primary flex h-[38px] w-11 shrink-0 items-center justify-center rounded-xl border border-zinc-200 bg-white text-lg transition disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-950">
              {normalizeGuestbookEmoji(emoji) ?? "👾"}
            </button>

            <label className="sr-only" htmlFor="guestbook-nickname">
              Nickname
            </label>
            <input
              id="guestbook-nickname"
              required
              maxLength={20}
              autoComplete="nickname"
              value={nickname}
              onChange={(event) => setNickname(event.target.value)}
              className={inputClassName}
              placeholder="Nickname"
              disabled={isBusy}
            />

            {isEmojiOpen && (
              <div className="absolute top-full left-0 z-20 mt-1.5 w-64 rounded-xl border border-zinc-200 bg-white p-3 shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
                <div className="grid grid-cols-6 gap-1">
                  {GUESTBOOK_EMOJI_SUGGESTIONS.map((option) => {
                    const selected = emoji === option;
                    return (
                      <button
                        key={option}
                        type="button"
                        onClick={() => {
                          setEmoji(selected ? null : option);
                          setIsEmojiOpen(false);
                        }}
                        aria-pressed={selected}
                        aria-label={`Badge ${option}`}
                        className={`flex h-8 w-8 items-center justify-center rounded-lg text-base transition ${
                          selected
                            ? "ring-primary bg-primary/15 ring-2"
                            : "hover:bg-zinc-100 dark:hover:bg-zinc-800"
                        }`}>
                        {option}
                      </button>
                    );
                  })}
                </div>

                <div className="mt-3 border-t border-zinc-200 pt-3 dark:border-zinc-700">
                  <label
                    className="mb-1.5 block text-xs text-zinc-500 dark:text-zinc-400"
                    htmlFor="guestbook-emoji-input">
                    Or any emoji — press{" "}
                    <kbd className="rounded bg-zinc-100 px-1 font-mono dark:bg-zinc-800">Win</kbd> +{" "}
                    <kbd className="rounded bg-zinc-100 px-1 font-mono dark:bg-zinc-800">.</kbd>
                  </label>
                  <div className="flex gap-2">
                    <input
                      id="guestbook-emoji-input"
                      value={emoji ?? ""}
                      onChange={(event) => setEmoji(event.target.value || null)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          setIsEmojiOpen(false);
                        }
                      }}
                      className={`${inputClassName} text-center`}
                      placeholder="🎉"
                      aria-label="Custom badge emoji"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setEmoji(null);
                        setIsEmojiOpen(false);
                      }}
                      className="shrink-0 rounded-xl px-2 text-xs text-zinc-500 transition hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800">
                      Clear
                    </button>
                  </div>
                  {emoji && !normalizeGuestbookEmoji(emoji) && (
                    <p className="m-0 mt-1.5 text-xs text-red-500">Enter exactly one emoji.</p>
                  )}
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="sr-only" htmlFor="guestbook-password">
              Password for deletion
            </label>
            <input
              id="guestbook-password"
              required
              type="password"
              minLength={4}
              maxLength={72}
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className={inputClassName}
              placeholder="Password (to delete later)"
              disabled={isBusy}
            />
          </div>
        </div>

        <label className="sr-only" htmlFor="guestbook-message">
          Message
        </label>
        <textarea
          id="guestbook-message"
          required
          maxLength={500}
          rows={3}
          value={content}
          onChange={(event) => setContent(event.target.value)}
          className={`${inputClassName} resize-y`}
          placeholder="Say hello…"
          disabled={isBusy}
        />

        {/* Honeypot: bots fill it, humans never see it. */}
        <label className="absolute -left-[10000px]" aria-hidden="true">
          Website
          <input
            tabIndex={-1}
            autoComplete="off"
            value={website}
            onChange={(event) => setWebsite(event.target.value)}
          />
        </label>

        <div className="mt-3 flex items-center justify-between gap-4">
          <span className="text-xs text-zinc-500 dark:text-zinc-400">{content.length}/500</span>
          <button
            type="submit"
            disabled={isBusy}
            className="bg-primary text-primary-content rounded-xl px-4 py-2 text-sm font-semibold transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50">
            {isSubmitting ? "Posting…" : "Post"}
          </button>
        </div>
      </form>
    </section>
  );
}
