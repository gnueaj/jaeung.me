"use client";

import { usePathname } from "next/navigation";

/**
 * Credits the theme this site started from. The home page is the one that
 * actually wears that layout, so the credit belongs there and nowhere else —
 * repeating it under every project and post read as a site-wide byline.
 *
 * Client-side only because it needs the pathname, which a server layout cannot
 * read.
 */
export default function AttributionFooter() {
  const pathname = usePathname();
  if (pathname !== "/") return null;

  return (
    <footer className="mt-3 px-4 pb-4 text-center text-[11px] text-zinc-500 md:pb-0 dark:text-zinc-400">
      Copyright © 2025{" "}
      <a href="https://jiwnchoi.me" target="_blank" rel="noopener noreferrer" className="me-hover">
        Jiwon Jason Choi
      </a>
    </footer>
  );
}
