import { getTimeStamp } from "@/utils";
import { getPageMap } from "nextra/page-map";
import PostItem from "./components/PostItem";

export default async function Page() {
  // Nextra throws when the folder holds no MDX at all (it never makes it into
  // the page map), so an empty blog must not take the build down.
  let items: PageMapItem[] = [];
  try {
    items = ((await getPageMap("/content/blog/posts")) ?? []) as PageMapItem[];
  } catch {
    items = [];
  }

  const posts = items.sort(
    (a, b) => getTimeStamp(b.frontMatter?.date) - getTimeStamp(a.frontMatter?.date),
  );

  if (posts.length === 0) {
    return <p className="not-prose text-zinc-500 dark:text-zinc-400">No posts yet.</p>;
  }

  return (
    <ul className="not-prose flex flex-col gap-12">
      {posts.map((post) => (
        <PostItem key={`post-item-${post.route}`} post={post} />
      ))}
    </ul>
  );
}
