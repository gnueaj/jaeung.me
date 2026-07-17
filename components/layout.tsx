import { ThemeSwitch } from "@/components";
import type { FC, ReactNode } from "react";
import { twMerge } from "tailwind-merge";

export const Footer: FC<{
  children: ReactNode;
  className?: string;
}> = ({ className, children }) => {
  return (
    <footer
      className={twMerge([
        "footer footer-horizontal flex items-center justify-between",
        className,
      ])}>
      <ThemeSwitch className={"btn btn-ghost btn-xs flex w-16 items-center gap-2"} />
      <small data-pagefind-ignore="all">{children}</small>
      <div className="w-16" />
    </footer>
  );
};
