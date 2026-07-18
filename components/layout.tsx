import { ThemeSwitch } from "@/components";
import type { FC, ReactNode } from "react";
import { twMerge } from "tailwind-merge";

export const Footer: FC<{
  children?: ReactNode;
  className?: string;
}> = ({ className, children }) => {
  return (
    <footer className={twMerge(["flex items-center justify-center gap-3", className])}>
      <ThemeSwitch
        showLabel
        size={16}
        className="btn btn-ghost btn-sm me-violet-hover flex items-center gap-2 rounded-lg"
      />
      {children ? <small data-pagefind-ignore="all">{children}</small> : null}
    </footer>
  );
};
