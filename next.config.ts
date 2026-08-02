import { execSync } from "node:child_process";
import type { NextConfig } from "next";
import nextra from "nextra";

const withNextra = nextra({
  contentDirBasePath: "/content",
  latex: true,
});

// Resolved here, at build time, where git is available; baked into the client
// bundle as an env var so the "Last updated" label needs no runtime git.
function lastCommitDate(): string {
  try {
    const iso = execSync("git log -1 --format=%cs", { encoding: "utf8" }).trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso.replace(/-/g, ".");
  } catch {
    // no git — leave it blank and the label won't render
  }
  return "";
}

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_LAST_UPDATED: lastCommitDate(),
  },
  images: {
    minimumCacheTTL: 60 * 60 * 24 * 30,
  },
  outputFileTracingIncludes: {
    "/api/asset/**/*": ["./content/**/*"],
  },
  turbopack: {
    resolveAlias: {
      "next-mdx-import-source-file": "./mdx-components.tsx",
    },
  },
};

const config = withNextra(nextConfig);

export default config;
