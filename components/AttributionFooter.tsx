"use client";

import { usePathname } from "next/navigation";
import VisitorCounter from "./VisitorCounter";

/**
 * The footer under the main column: the visitor count on every page, plus a
 * credit to the theme this site started from on the home page only. That credit
 * is for the layout the home page actually wears; repeating it under every
 * project and post read as a site-wide byline.
 *
 * Client-side because both pieces need the browser — the pathname here, a fetch
 * in the counter.
 */
export default function AttributionFooter() {
  const pathname = usePathname();
  // Both the credit and the visit count belong to the home page only: the credit
  // is for the layout the home page wears, and the count is a personal footer,
  // not something to repeat under every project and post.
  if (pathname !== "/") return null;

  return (
    <footer className="mt-3 flex flex-wrap items-center justify-center gap-x-2 gap-y-0.5 px-4 pb-4 text-center text-[11px] text-zinc-500 md:pb-0 dark:text-zinc-400">
      <span>
        © 2026 Jaeung Lee · Template by{" "}
        <a href="https://jiwnchoi.me" target="_blank" rel="noopener noreferrer" className="me-hover">
          Jiwon Choi
        </a>
      </span>
      <span aria-hidden>·</span>
      <VisitorCounter />
    </footer>
  );
}
