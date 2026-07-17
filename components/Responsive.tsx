import React from "react";
import { twMerge } from "tailwind-merge";

interface ResponsiveProps<T extends React.ElementType = "div"> {
  component?: T;
  base?: React.ReactNode;
  sm?: React.ReactNode;
  md?: React.ReactNode;
  lg?: React.ReactNode;
  xl?: React.ReactNode;
  "2xl"?: React.ReactNode;
}

type ResponsivePropsWithComponent<T extends React.ElementType> = ResponsiveProps<T> &
  Omit<React.ComponentPropsWithoutRef<T>, keyof ResponsiveProps | "children">;

type Breakpoints = "base" | "sm" | "md" | "lg" | "xl" | "2xl";

const random = Math.random().toString(36).slice(0, 4);

const displayClassNames = [
  "inline", // display: inline;
  "block", // display: block;
  "inline-block", // display: inline-block;
  "flow-root", // display: flow-root;
  "flex", // display: flex;
  "inline-flex", // display: inline-flex;
  "grid", // display: grid;
  "inline-grid", // display: inline-grid;
  "contents", // display: contents;
  "table", // display: table;
  "inline-table", // display: inline-table;
  "table-caption", // display: table-caption;
  "table-cell", // display: table-cell;
  "table-column", // display: table-column;
  "table-column-group", // display: table-column-group;
  "table-footer-group", // display: table-footer-group;
  "table-header-group", // display: table-header-group;
  "table-row-group", // display: table-row-group;
  "table-row", // display: table-row;
  "list-item", // display: list-item;
] as const;

const Responsive = <T extends React.ElementType = "div">({
  component,
  base,
  sm,
  md,
  lg,
  xl,
  "2xl": xl2,
  className,
  ...props
}: ResponsivePropsWithComponent<T>) => {
  const Component = (component || "div") as React.ElementType;
  const breakpoints = [
    { content: base, prefix: "" as const, key: "base" as const },
    { content: sm, prefix: "sm:" as const, key: "sm" as const },
    { content: md, prefix: "md:" as const, key: "md" as const },
    { content: lg, prefix: "lg:" as const, key: "lg" as const },
    { content: xl, prefix: "xl:" as const, key: "xl" as const },
    { content: xl2, prefix: "2xl:" as const, key: "2xl" as const },
  ].filter((bp) => bp.content !== undefined);

  const displayClass = displayClassNames.find((cls) => className?.includes(cls)) ?? "block";

  function getResponsiveClassName(target: Breakpoints): string {
    const index = breakpoints.findIndex((bp) => bp.key === target);
    if (index === -1) return "";
    const nextPrefix = breakpoints[index + 1]?.prefix || "";
    if (target === "base") return `${displayClass} ${nextPrefix ? `${nextPrefix}hidden` : ""}`;
    return `hidden ${target}:${displayClass} ${nextPrefix ? `${nextPrefix}hidden` : ""}`;
  }

  return (
    <>
      {breakpoints.map(({ content, key }) => (
        <Component
          key={`breakpoint-${random}-${key}`}
          className={twMerge(getResponsiveClassName(key), className)}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          {...(props as any)}>
          {content}
        </Component>
      ))}
    </>
  );
};

export default Responsive;
