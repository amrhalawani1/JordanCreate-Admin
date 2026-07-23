export function UpdatedAtBadge({ value }: { value: string | null | undefined }) {
  if (!value) return null;

  const formatted = new Date(value).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return <span className="text-xs text-faint">Updated {formatted}</span>;
}
