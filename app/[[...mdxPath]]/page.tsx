import { CommentsServer } from "@/components";
import { useMDXComponents as getMDXComponents } from "@/mdx-components";
import { data } from "@/data";
import { siteConfig } from "@/site.config";
import { Metadata } from "next";
import { generateStaticParamsFor, importPage } from "nextra/pages";
import type { FC } from "react";

type PageProps = Readonly<{
  params: Promise<{
    mdxPath: string[];
    lang: string;
  }>;
}>;
type ReadingTime = {
  text: string;
  minutes: number;
  time: number;
  words: number;
};

type NetraMetadata = Omit<Metadata, "title"> & {
  title: string;
  filePath: string;
  timestamp?: number;
  readingTime?: ReadingTime;
};

export const generateStaticParams = generateStaticParamsFor("mdxPath");

export async function generateMetadata(props: PageProps) {
  const params = await props.params;
  const { metadata } = await importPage(params.mdxPath, params.lang);
  return getCustomMetadata(metadata);
}

function getCustomMetadata(metadata: NetraMetadata): NetraMetadata {
  const title = metadata.title === "Index" ? data.meta().name : metadata.title;
  return {
    ...metadata,
    metadataBase: new URL(siteConfig.url),
    title,
    icons: {
      apple: "/apple-touch-icon.png?v=purple-alien-v2",
      icon: [
        {
          url: "/favicon-32x32.png?v=purple-alien-v2",
          sizes: "32x32",
          type: "image/png",
        },
        {
          url: "/favicon-16x16.png?v=purple-alien-v2",
          sizes: "16x16",
          type: "image/png",
        },
      ],
    },
    manifest: "/site.webmanifest",
    openGraph: {
      images: [
        {
          url: `/api/og?title=${title}&description=${metadata.description}`,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
  };
}

// @ts-expect-error nextra's wrapper type is not exported
const Wrapper = getMDXComponents().wrapper;

/**
 * Blog posts get their own comment thread, keyed by route. Everything else —
 * the home page, /projects, the blog index — has no thread, and the guestbook
 * mounts its own site-wide one from MDX.
 */
function getPostSlug(mdxPath: string[] | undefined) {
  if (!mdxPath || mdxPath.length < 3) return null;
  const [section, collection] = mdxPath;
  if (section !== "blog" || collection !== "posts") return null;
  return mdxPath.join("/");
}

const Page: FC<PageProps> = async (props) => {
  const params = await props.params;
  const result = await importPage(params.mdxPath, params.lang);
  const { default: MDXContent, toc, metadata } = result;
  const postSlug = getPostSlug(params.mdxPath);

  return (
    <Wrapper toc={toc} metadata={metadata}>
      <MDXContent {...props} params={params} />
      {postSlug && (
        <section className="mt-12 border-t border-zinc-200 pt-8 dark:border-zinc-800">
          <h2 className="mt-0">Comments</h2>
          <CommentsServer
            postSlug={postSlug}
            emptyTitle="No comments yet."
            emptyHint="Be the first to leave one."
          />
        </section>
      )}
    </Wrapper>
  );
};

export default Page;
