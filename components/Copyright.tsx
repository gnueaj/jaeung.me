import { data } from "@/data";

/**
 * Renders the footer copyright line, e.g. "Copyright © 2026 Jaeung Lee".
 * Name comes from `data/meta.yml`; the year is always the current year.
 */
export default async function Copyright() {
  const { name } = data.meta();
  return (
    <>
      Copyright © {new Date().getFullYear()} {name}
    </>
  );
}
