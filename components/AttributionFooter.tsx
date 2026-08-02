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
  // The copyright now belongs to Jaeung, so it rides along on every page. The
  // visit count stays home-only — it's a personal touch, not something to repeat
  // under every project and post.
  const isHome = pathname === "/";

  return (
    <footer className="mt-3 flex flex-wrap items-center justify-center gap-x-2 gap-y-0.5 px-4 pb-4 text-center text-[11px] text-zinc-500 md:pb-0 dark:text-zinc-400">
      <span>
        © 2026 Jaeung Lee · Template by{" "}
        <a href="https://jiwnchoi.me" target="_blank" rel="noopener noreferrer" className="me-hover">
          Jiwon Choi
        </a>
      </span>
      {isHome && <span aria-hidden>·</span>}
      {isHome && <VisitorCounter />}
    </footer>
  );
}
