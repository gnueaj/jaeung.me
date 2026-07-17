import { formatDate } from "@/utils";
import Image from "next/image";
import Link from "next/link";
import { twMerge } from "tailwind-merge";
import TagBadge from "./TagBadge";

interface CardProps {
  title: string;
  description?: string;
  route: string;
  imagePath?: string | null;
  tags: string[];
  date?: TDate;
}

export default async function Card({
  title,
  description,
  route,
  imagePath,
  tags,
  date,
}: CardProps) {
  const unoptimized = imagePath?.startsWith("/api/asset/") ?? false;
  return (
    <Link href={route.replace("/content", "")} prefetch={true} className="not-prose">
      <div
        className={twMerge([
          "group h-[230px] overflow-hidden rounded-xl border transition-all duration-300 ease-in-out hover:-translate-y-1",
          "hover:shadow-primary/50 border-zinc-200 bg-white hover:border-zinc-300 hover:shadow-lg",
          "dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700",
          "relative mt-2",
        ])}>
        {imagePath && (
          <div className="relative z-1 h-[120px] w-full overflow-hidden bg-zinc-100 dark:bg-zinc-800">
            <Image
              src={imagePath}
              alt={`${title} thumbnail`}
              sizes="500px"
              fill
              unoptimized={unoptimized}
              className="not-prose absoute z-1 scale-[110%] border-none object-cover"
              priority={true}
            />
            <div className="absolute inset-0 z-2 border-0 border-none bg-gradient-to-b from-transparent to-white transition-opacity duration-300 dark:from-black/10 dark:to-zinc-900" />
          </div>
        )}
        <div className="absolute bottom-0 z-1 flex flex-col gap-2 p-4">
          <h3 className="text-base font-bold no-underline">{title}</h3>
          {description && (
            <p className="line-clamp-2 text-xs text-zinc-500 dark:text-zinc-400">{description}</p>
          )}
          <p className="mt-1 flex gap-2">
            {tags.map((t) => (
              <TagBadge key={`tag-${title}-${t}`} content={t} />
            ))}
          </p>
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400">{date && formatDate(date)}</p>
        </div>
      </div>
    </Link>
  );
}
