"use client";

import { default as GiscusImpl } from "@giscus/react";
import { useTheme } from "next-themes";
import { isGiscusEnabled, siteConfig } from "@/site.config";

export default function Giscus() {
  const { resolvedTheme } = useTheme();

  if (!isGiscusEnabled) return null;
  const { repo, repoId, category, categoryId } = siteConfig.giscus;

  return (
    <GiscusImpl
      id="comments"
      repo={repo!}
      repoId={repoId!}
      category={category!}
      categoryId={categoryId!}
      mapping="pathname"
      strict="0"
      reactionsEnabled="0"
      emitMetadata="0"
      inputPosition="top"
      theme={`${siteConfig.url}/giscus_${resolvedTheme}.css`}
      lang="en"
      loading="eager"
    />
  );
}
