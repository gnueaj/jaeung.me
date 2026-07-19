import { Card } from "@/components";
import { existsSync } from "fs";
import { getPageMap } from "nextra/page-map";
import path from "path";

const extensions = [".jpg", ".jpeg", ".png", ".webp", ".avif", ".svg"];
const stripLeadingSlashes = (value: string) => value.replace(/^\/+/, "");

export default async function Gallery({
  title,
  contentPath,
  contentTypes = ["paper", "project"],
}: {
  title?: string;
  contentPath: string;
  contentTypes: string[];
}) {
  const contentMap = (await getPageMap(contentPath)) as PageMapItem[]; // PageMapItem 타입 정의 필요
  const items = contentMap
    .filter(
      (item) =>
        contentTypes.includes(item.frontMatter?.type || "") &&
        item.name !== "index" &&
        item.frontMatter?.type !== "private",
    )
    .map((item) => {
      const extensionPaths = extensions.map((ext) =>
        path.posix.join(item.route, `${item.name}${ext}`),
      );
      const foundPath = extensionPaths.find((routePath) =>
        existsSync(path.join(process.cwd(), stripLeadingSlashes(routePath))),
      );
      const imagePath = foundPath ? `/api/asset${foundPath}` : null;
      return {
        key: item.name,
        ...item.frontMatter,
        title: item.frontMatter?.shortTitle || item.frontMatter?.title || item.title || "",
        route: item.route,
        imagePath,
        tags:
          typeof item.frontMatter?.tags === "string"
            ? [item.frontMatter?.tags]
            : (item.frontMatter?.tags ?? []),
        order: Number(item.frontMatter?.order ?? 0),
      };
    })
    .sort((a, b) => b.order - a.order);

  return (
    <>
      {title && (
        <h2 className="not-prose mt-4 mb-4 text-3xl font-bold text-zinc-900 md:mt-0 dark:text-zinc-100">
          {title}
        </h2>
      )}
      {/* Two columns rather than auto-fill: the cards carry wide teaser images,
          and letting the track count follow the viewport made them shrink to
          thumbnails on large screens. */}
      <div className="mb-16 grid auto-rows-auto grid-cols-1 gap-6 md:grid-cols-2">
        {items.map((item) => (
          <Card
            key={`project-card-${item.key}`}
            title={item.title}
            description={item.description}
            route={item.route}
            imagePath={item.imagePath}
            tags={item.tags}
          />
        ))}
      </div>
    </>
  );
}
