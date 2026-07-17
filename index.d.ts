declare interface IDateRange {
  from: string;
  to: string;
}

declare type TDate = DateRange | string;

declare interface FrontMatter {
  title: string;
  shortTitle?: string;
  description?: string;
  type?: string;
  filePath?: string;
  timestamp?: number;
  date?: TDate;
  tags?: string | string[];
  timestamp: number;
  [key: string]: string | number | boolean | string[] | Record<string, unknown> | undefined;
}

declare interface PageMapItem {
  name: string;
  route: string;
  frontMatter?: FrontMatter;
  title?: string;
  children?: PageMapItem[];
}
