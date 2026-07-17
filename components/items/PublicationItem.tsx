import MDXContent from "@/components/MDXContent";
import { data, type Publication } from "@/data";
import Link from "next/link";
import { FaFilePdf, FaGithub, FaGlobe, FaVideo } from "react-icons/fa6";
import { twMerge } from "tailwind-merge";

async function AuthorNames({ authorList }: { authorList: string[] }) {
  const authors = data.authors().authors;
  const authorMap = Object.fromEntries(authors.map((author) => [author.name, author]));

  return (
    <p className="not-prose text-md">
      {authorList.map((authorName, index) => (
        <span key={`author${index}`} className="italic">
          {authorMap?.[authorName]?.url ? (
            <Link
              href={authorMap[authorName].url}
              className="me-hover"
              target={authorMap[authorName].url.startsWith("http") ? "_blank" : "_self"}>
              <span className={authorName === "Jiwon Choi" ? "text-primary font-semibold" : ""}>
                {authorName}
              </span>
            </Link>
          ) : (
            <span>{authorName}</span>
          )}
          <span>
            {index === authorList.length - 2
              ? authorList.length === 2
                ? " and "
                : ", and "
              : index === authorList.length - 1
                ? ""
                : ", "}
          </span>
        </span>
      ))}
    </p>
  );
}

async function PublicationButton({
  href,
  icon: Icon,
  children,
}: {
  href: string;
  icon: React.ComponentType;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={twMerge(
        "not-prose me-hover m-0 flex items-center gap-1 text-xs",
        "!no-underline",
      )}>
      <Icon />
      {children}
    </Link>
  );
}

const URL_ICON = {
  pdf: FaFilePdf,
  git: FaGithub,
  web: FaGlobe,
  video: FaVideo,
};

const URL_FULLNAME = {
  pdf: "PDF",
  git: "GitHub",
  web: "Demo",
  video: "Video",
};

export default async function PublicationItem(props: Publication) {
  const { title, authors, url, venue } = props;

  return (
    <li className="m-0 flex flex-col p-0">
      <div className="flex flex-col">
        {typeof title === "string" ? <MDXContent mdxSource={`### ${title}`} /> : title}
        <AuthorNames authorList={authors} />
        <p className="not-prose text-sm text-zinc-500 dark:text-zinc-400">{venue}</p>

        <div className="mt-2 flex flex-wrap gap-2">
          {Object.entries(url).map(
            ([key, value]) =>
              value && (
                <PublicationButton
                  key={key}
                  href={value}
                  icon={URL_ICON[key as keyof typeof URL_ICON]}>
                  {URL_FULLNAME[key as keyof typeof URL_FULLNAME]}
                </PublicationButton>
              ),
          )}
        </div>
      </div>
    </li>
  );
}
