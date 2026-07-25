import { ThemeSwitch, VisitorCounter } from "@/components";
import type { FC, ReactNode } from "react";
import { twMerge } from "tailwind-merge";

export const Footer: FC<{
  children?: ReactNode;
  className?: string;
}> = ({ className, children }) => {
  return (
    <div className={twMerge(["flex flex-col items-center gap-1", className])}>
      <footer className="flex items-center justify-center gap-3">
        <ThemeSwitch
          showLabel
          size={16}
          className="btn btn-ghost btn-sm me-violet-hover flex items-center gap-2 rounded-lg"
        />
        {children ? <small data-pagefind-ignore="all">{children}</small> : null}
      </footer>
      <VisitorCounter className="text-[11px] text-zinc-400 dark:text-zinc-500" />
    </div>
  );
};
