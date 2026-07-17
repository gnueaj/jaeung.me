import { twMerge } from "tailwind-merge";
import MDXContent from "../MDXContent";

interface SimpleItemProps extends React.HTMLAttributes<HTMLLIElement> {
  left?: string | React.ReactNode;
  right?: string | React.ReactNode;

  leftProps?: React.HTMLAttributes<HTMLDivElement>;
  rightProps?: React.HTMLAttributes<HTMLDivElement>;
}

export default async function SimpleItem(props: SimpleItemProps) {
  const { left, right, leftProps, rightProps, className, ...rest } = props;
  return (
    <li
      className={twMerge(["flex flex-col gap-1 pl-0 md:mt-0 md:flex-row md:gap-4", className])}
      {...rest}>
      {left && (
        <div
          {...leftProps}
          className="w-fit text-end text-sm font-semibold text-zinc-500 md:w-[80px] md:min-w-[80px] md:text-sm dark:text-zinc-400">
          {typeof left === "string" ? <MDXContent mdxSource={left} /> : left}
        </div>
      )}
      {right && (
        <div {...rightProps} className="mb-2 text-base md:mb-0">
          {typeof right === "string" ? <MDXContent mdxSource={right} /> : right}
        </div>
      )}
    </li>
  );
}
