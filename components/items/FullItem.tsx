import Date from "../Date";
import MDXContent from "../MDXContent";

interface FullItemProps extends React.HTMLAttributes<HTMLLIElement> {
  heading: string | React.ReactNode;
  subheading?: string | React.ReactNode;
  date?: TDate;
  location?: string;
  description?: string;
}

export default async function FullItem(props: FullItemProps) {
  const { heading, subheading, date, location, description, ...rest } = props;
  return (
    <li className="m-0 my-0 mt-0 mb-0 flex flex-col gap-1 p-0" {...rest}>
      <div className="flex flex-col justify-between gap-1 md:flex-row">
        <div className="flex w-full grow flex-col">
          {typeof heading === "string" ? <MDXContent mdxSource={`### ${heading}`} /> : heading}
          {typeof subheading === "string" ? (
            <MDXContent mdxSource={subheading} className="italic" />
          ) : (
            subheading
          )}
        </div>
        <div className="flex w-full flex-row items-end gap-2 text-xs md:w-fit md:min-w-[150px] md:flex-col md:gap-0 md:text-sm">
          {location && (
            <p className="not-prose text-zinc-500 italic dark:text-zinc-400">{location}</p>
          )}
          {date && <Date className="md:flex-row" date={date} />}
        </div>
      </div>
      {description && (
        <div className="border-primary border-opacity-50 mt-1 ml-0.5 border-l-2 pl-4 text-sm md:mt-0">
          <MDXContent mdxSource={description} />
        </div>
      )}
    </li>
  );
}
