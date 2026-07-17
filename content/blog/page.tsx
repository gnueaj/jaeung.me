import { getTimeStamp } from "@/utils";
import { getPageMap } from "nextra/page-map";
import PostItem from "./components/PostItem";

export default async function Page() {
  const posts = ((await getPageMap("/content/blog/posts")) as PageMapItem[]).sort(
    (a, b) => getTimeStamp(b.frontMatter?.date) - getTimeStamp(a.frontMatter?.date),
  );

  return (
    <ul className="not-prose flex flex-col gap-12">
      {posts.map((post) => (
        <PostItem key={`post-item-${post.route}`} post={post} />
      ))}
    </ul>
  );
}
