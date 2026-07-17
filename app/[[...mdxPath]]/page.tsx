import { useMDXComponents as getMDXComponents } from "@/mdx-components";
import { data } from "@/data";
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
      apple: "/apple-touch-icon.png",
      icon: [
        { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
        { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
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

const Page: FC<PageProps> = async (props) => {
  const params = await props.params;
  const result = await importPage(params.mdxPath, params.lang);
  const { default: MDXContent, toc, metadata } = result;

  return (
    <Wrapper toc={toc} metadata={metadata}>
      <MDXContent {...props} params={params} />
    </Wrapper>
  );
};

export default Page;
