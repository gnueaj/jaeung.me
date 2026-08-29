import { Date, TagBadge } from "@/components";
import { data } from "@/data";
import { countPostComments } from "@/lib/guestbook-comments";
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

export default async function PostItem({ post }: { post: PageMapItem }) {
  const teaserPath = getTeaserImagePath(post.route);
  const tags: string[] =
    typeof post.frontMatter?.tags === "string"
      ? [post.frontMatter?.tags]
      : (post.frontMatter?.tags ?? []);

  // The comment thread is keyed by the post's route (see app/[[...mdxPath]]).
  const postSlug = post.route.replace(/^\/content\//, "");
  const commentCount = await countPostComments(postSlug);

  return (
    <Link href={post.route.replace("/content", "")} target="_self">
      <li className="hover:bg-primary/10 dark:hover:bg-primary/20 -m-4 flex justify-between gap-8 rounded-lg p-4 transition-colors duration-300">
        <div className="flex flex-col gap-2">
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{post.title}</h3>
          {/* Title first, then name and date on one line — the same order, and the
              same two fields, the post itself opens with. Split across the top and
              bottom of the card they read as two unrelated notes. */}
          <div className="ml-0.5 flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
            <span>{data.meta().name}</span>
            {post.frontMatter?.date && (
              <>
                <span aria-hidden>·</span>
                <Date date={post.frontMatter.date} day={true} className="text-xs not-italic" />
              </>
            )}
          </div>
          {tags.length > 0 && (
            <ul className="mt-1 flex gap-2">
              {tags.map((tag) => (
                <li key={`tag-${post.title}-${tag}`}>
                  <TagBadge content={tag} />
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="flex flex-shrink-0 flex-col items-end gap-2">
          {teaserPath && (
            <div className="relative h-24 w-36 overflow-hidden rounded-lg">
              <Image
                src={teaserPath}
                alt={`thumbnail-${post.title}`}
                fill
                className="rounded-lg object-cover"
                unoptimized={teaserPath.startsWith("/api/asset/")}
              />
            </div>
          )}
          {/* mt-auto pins it to the bottom-right whether or not a teaser sits
              above it, so posts without an image still show it low. */}
          <span className="mt-auto text-xs text-zinc-400 dark:text-zinc-500">
            {commentCount} {commentCount === 1 ? "comment" : "comments"}
          </span>
        </div>
      </li>
    </Link>
  );
}
