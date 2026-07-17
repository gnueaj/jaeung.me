import cn from "clsx";
import JavaScriptIcon from "react-devicons/javascript/plain";
import ReactIcon from "react-devicons/react/original";
import TypeScriptIcon from "react-devicons/typescript/plain";
import { twMerge } from "tailwind-merge";

const ICONS = new Map([
  ["React", { color: "#61DAFB", icon: ReactIcon, text: "black" }],
  ["TypeScript", { color: "#007ACC", icon: TypeScriptIcon, text: "white" }],
  ["JavaScript", { color: "#F7DF1E", icon: JavaScriptIcon, text: "black" }],
]);

const DEFAULT_CONFIG = {
  icon: null,
  color: "zinc-200",
  text: "black",
};

export default function TagBadge({ content }: { content: string }) {
  const config = ICONS.get(content) || DEFAULT_CONFIG;
  const { icon: Icon, color: bgColorValue, text: textColorName } = config;

  const style: React.CSSProperties = {};
  const classNames = [
    "-ml-0.5",
    "flex",
    "items-center",
    "gap-1",
    "rounded-sm",
    "px-1",
    "text-[11px]",
    "font-semibold",
    "text-black dark:text-white",
    "bg-zinc-200 dark:bg-zinc-200",
  ];

  // 배경색 처리
  if (bgColorValue.startsWith("#")) {
    style.backgroundColor = bgColorValue;
  } else {
    classNames.push(`bg-${bgColorValue} dark:bg-${bgColorValue}`);
  }

  classNames.push(`text-${textColorName} dark:text-${textColorName}`);

  return (
    <span style={style} className={twMerge(cn(classNames))}>
      {Icon && <Icon color={textColorName} />}
      {content}
    </span>
  );
}
