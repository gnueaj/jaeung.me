import { format, isValid, parse } from "date-fns";

const possibleFormats: string[] = ["yyyy.MM.dd", "yyyy-MM-dd", "yyyy.MM", "yyyy-MM"];

function parseDate(dateString: string): Date | null {
  let parsedDate: Date | null = null;

  for (const formatString of possibleFormats) {
    const potentialDate = parse(dateString, formatString, new Date());
    if (isValid(potentialDate)) {
      parsedDate = potentialDate;
      break;
    }
  }

  return parsedDate;
}

function _formatDate(dateString: string, day?: boolean): string {
  const parsedDate = parseDate(dateString);

  if (!parsedDate || !isValid(parsedDate)) {
    return "Invalid Date";
  }

  const month = format(parsedDate, "MMM");
  const year = format(parsedDate, "yyyy");
  const dayOfMonth = format(parsedDate, "dd");

  if (day) return `${month} ${dayOfMonth}, ${year}`;
  else return `${month} ${year}`;
}

export function formatDate(date: TDate | null, day?: boolean): string | null {
  if (date === null) {
    return null;
  }
  if (typeof date === "string") {
    return _formatDate(date, day);
  }

  if (typeof date === "object" && "from" in date && "to" in date) {
    const fromDate = _formatDate(date.from, day);
    const toDate = _formatDate(date.to, day);

    return `${fromDate} ─ ${toDate}`;
  }
  return null;
}

export function getTimeStamp(date: TDate): number {
  if (typeof date === "string") {
    const parsedDate = parseDate(date);
    return parsedDate ? parsedDate.getTime() : 0;
  }

  if (typeof date === "object" && "from" in date && "to" in date) {
    const fromDate = parseDate(date.from);

    return fromDate ? fromDate.getTime() : 0;
  }

  return 0;
}
