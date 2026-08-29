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
    // A hairline between entries. gap alone had carried the separation, which was
    // enough when each card was three rows tall; now that the date sits beside the
    // byline the rows are shorter and more alike, and space by itself stopped
    // reading as a boundary.
    <ul className="not-prose flex flex-col divide-y divide-zinc-200 dark:divide-zinc-800">
      {posts.map((post) => (
        <PostItem key={`post-item-${post.route}`} post={post} />
      ))}
    </ul>
  );
}
