"use client";

import { useEffect, useState } from "react";

type Counts = { today: number; total: number };

export default function VisitorCounter({ className }: { className?: string }) {
  const [counts, setCounts] = useState<Counts | null>(null);

  useEffect(() => {
    let cancelled = false;
    // POST once per mount: the server dedupes by (visitor, day), so a refresh
    // records at most one visit per day regardless of how often this fires.
    void fetch("/api/visits", { method: "POST", cache: "no-store" })
      .then((res) => (res.ok ? (res.json() as Promise<Counts>) : null))
      .then((data) => {
        if (!cancelled && data) setCounts(data);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  if (!counts) return null;

  return (
    <small
      data-pagefind-ignore="all"
      className={className}
      title="Unique visitors, deduped per day">
      Today {counts.today.toLocaleString()} · Total {counts.total.toLocaleString()}
    </small>
  );
}
