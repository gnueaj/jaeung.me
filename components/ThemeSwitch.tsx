"use client";

import { Moon02Icon, Sun01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useTheme } from "next-themes";
import { usePathname } from "next/navigation";
import { useMounted } from "nextra/hooks";

export default function ThemeSwitch({
  className,
  size = 18,
  showLabel = false,
  homeOnly = false,
}: {
  className?: string;
  size?: number;
  showLabel?: boolean;
  homeOnly?: boolean;
}) {
  const { setTheme, resolvedTheme } = useTheme();
  const pathname = usePathname();
  const mounted = useMounted();
  const isDark = resolvedTheme === "dark";

  const IconToUse = mounted && isDark ? Moon02Icon : Sun01Icon;

  if (homeOnly && pathname !== "/") return null;

  return (
    <button
      className={className}
      aria-label="Toggle dark mode"
      title="Toggle dark mode"
      onClick={() => setTheme(isDark ? "light" : "dark")}>
      <HugeiconsIcon icon={IconToUse} size={size} />
      {showLabel && (
        <>
          <span className="dark:hidden">Light</span>
          <span className="hidden dark:inline">Dark</span>
        </>
      )}
    </button>
  );
}
