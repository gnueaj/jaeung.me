"use client";

import { usePathname } from "next/navigation";

// Pages that are Jaeung's own work rather than the borrowed template layout.
const PAGES_WITHOUT_ATTRIBUTION = new Set(["/guestbook"]);

/**
 * Credits the theme this site started from. Client-side only because it needs
 * the pathname, which a server layout cannot read.
 */
export default function AttributionFooter() {
  const pathname = usePathname();
  if (PAGES_WITHOUT_ATTRIBUTION.has(pathname)) return null;

  return (
    <footer className="mt-3 px-4 pb-4 text-center text-[11px] text-zinc-500 md:pb-0 dark:text-zinc-400">
      Copyright © 2025{" "}
      <a href="https://jiwnchoi.me" target="_blank" rel="noopener noreferrer" className="me-hover">
        Jiwon Jason Choi
      </a>
    </footer>
  );
}
