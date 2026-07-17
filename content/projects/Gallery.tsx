import { Card } from "@/components";
import { getTimeStamp } from "@/utils";
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
  title: string;
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
        date: item.frontMatter?.date, // date 추가
      };
    })
    .sort((a, b) => getTimeStamp(b.date) - getTimeStamp(a.date));

  return (
    <>
      <h2 className="not-prose mt-4 mb-4 text-3xl font-bold md:mt-0">{title}</h2>
      <div
        className="mb-16 grid auto-rows-auto grid-cols-1 gap-6"
        style={{
          gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
        }}>
        {items.map((item) => (
          <Card
            key={`project-card-${item.key}`}
            title={item.title}
            description={item.description}
            route={item.route}
            imagePath={item.imagePath}
            tags={item.tags}
            date={item.date}
          />
        ))}
      </div>
    </>
  );
}
