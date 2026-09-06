import { Badge } from "@/components/ui/badge";
import { isArchivedRow } from "@/lib/archive";

export function ArchiveStatusBadge({ archived }: { archived?: boolean | null }) {
  return isArchivedRow({ archived }) ? (
    <Badge variant="secondary">Hidden from app</Badge>
  ) : (
    <Badge variant="outline">On the app</Badge>
  );
}
