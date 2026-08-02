// The date is baked in at build time by next.config.ts (NEXT_PUBLIC_LAST_UPDATED),
// so this stays a plain component with no runtime git dependency. Renders nothing
// when the value is absent.
const lastUpdated = process.env.NEXT_PUBLIC_LAST_UPDATED;

export default function LastUpdated({ className }: { className?: string }) {
  if (!lastUpdated) return null;
  return <span className={className}>Last updated {lastUpdated}</span>;
}
