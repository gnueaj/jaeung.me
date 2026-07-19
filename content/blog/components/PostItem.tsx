import { Date, TagBadge } from "@/components";
import { data } from "@/data";
import { existsSync } from "fs";
import Image from "next/image";
import Link from "next/link";
import path from "path";

function getTeaserImagePath(route: string) {
  const imageExtensions = [".jpg", ".jpeg", ".png", ".webp"];
  const imagePaths = imageExtensions.map((ext) => path.posix.join(route, `teaser${ext}`));
  const foundPath = imagePaths.find((imagePath) =>
    existsSync(path.join(process.cwd(), imagePath.replace(/^\/+/, ""))),
  );
  return foundPath ? `/api/asset${foundPath}` : null;
}

export default function PostItem({ post }: { post: PageMapItem }) {
  const teaserPath = getTeaserImagePath(post.route);
  const tags: string[] =
    typeof post.frontMatter?.tags === "string"
      ? [post.frontMatter?.tags]
      : (post.frontMatter?.tags ?? []);

  return (
    <Link href={post.route.replace("/content", "")} target="_self">
      <li className="hover:bg-primary/10 dark:hover:bg-primary/20 -m-4 flex justify-between gap-8 rounded-lg p-4 transition-colors duration-300">
        <div className="flex flex-col gap-2">
          <Date date={post.frontMatter?.date} day={true} className="ml-0.5 text-xs" />
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{post.title}</h3>
          {tags.length > 0 && (
            <ul className="mt-1 flex gap-2">
              {tags.map((tag) => (
                <li key={`tag-${post.title}-${tag}`}>
                  <TagBadge content={tag} />
                </li>
              ))}
            </ul>
          )}
          {/* A date and a title alone read like an index entry; the byline
              makes each row look like a post. */}
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{data.meta().name}</p>
        </div>
        {teaserPath && (
          <div className="relative h-24 w-36 flex-shrink-0 overflow-hidden rounded-lg">
            <Image
              src={teaserPath}
              alt={`thumbnail-${post.title}`}
              fill
              className="rounded-lg object-cover"
              unoptimized={teaserPath.startsWith("/api/asset/")}
            />
          </div>
        )}
      </li>
    </Link>
  );
}
