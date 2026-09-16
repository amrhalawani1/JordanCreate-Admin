import { Badge } from "@/components/ui/badge";

/** Interest tags as labelled badges; flags a row that has none. */
export function InterestTagBadges({
  ids,
  options,
}: {
  ids: string[] | null | undefined;
  options: { value: string; label: string }[];
}) {
  if (!ids?.length) return <span className="text-destructive">None</span>;
  return (
    <div className="flex flex-wrap gap-1">
      {ids.map((id) => (
        <Badge key={id} variant="outline">
          {options.find((option) => option.value === id)?.label ?? id}
        </Badge>
      ))}
    </div>
  );
}
