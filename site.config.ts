/**
 * Central deploy / runtime configuration.
 *
 * Use this for values needed in contexts where `data/meta.yml` (read from disk
 * via `fs` at runtime through `@/data`) is NOT available:
 *   - the Edge OG route (`app/api/og/route.tsx`)
 *   - Client Components (`components/Giscus.tsx`)
 *   - build-time analytics wiring (`app/layout.tsx`)
 *
 * Everything here is overridable per-environment via `NEXT_PUBLIC_*` env vars
 * (e.g. Vercel Project Settings). The defaults below are the fallback used when
 * the env var is unset. See `.env.example`.
 *
 * NOTE: `name` / `tagline` are mirrored from `data/meta.yml` because the Edge
 * runtime cannot read the YAML at request time. Keep them in sync (or set the
 * env vars) when rebranding.
 */
export const siteConfig = {
  /** Canonical site URL, no trailing slash. Used for absolute links (Giscus CSS, OG). */
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://jaeung.me",

  /** Display name — OG image footer + default page title fallback. */
  name: process.env.NEXT_PUBLIC_SITE_NAME ?? "Jaeung Lee",

  /** Short subtitle — OG image subtitle + default meta description fallback. */
  tagline: process.env.NEXT_PUBLIC_SITE_TAGLINE ?? "Software Engineer",

  /** Google Analytics measurement id (e.g. "G-XXXXXXXXXX"). Unset ⇒ GA is not loaded. */
  gaId: process.env.NEXT_PUBLIC_GA_ID,

  /** Giscus (GitHub Discussions) comments. All four required; any unset ⇒ comments hidden. */
  giscus: {
    repo: process.env.NEXT_PUBLIC_GISCUS_REPO as `${string}/${string}` | undefined,
    repoId: process.env.NEXT_PUBLIC_GISCUS_REPO_ID,
    category: process.env.NEXT_PUBLIC_GISCUS_CATEGORY,
    categoryId: process.env.NEXT_PUBLIC_GISCUS_CATEGORY_ID,
  },
} as const;

/** True only when every Giscus field is configured. */
export const isGiscusEnabled = Boolean(
  siteConfig.giscus.repo &&
  siteConfig.giscus.repoId &&
  siteConfig.giscus.category &&
  siteConfig.giscus.categoryId,
);
