import { logout } from "@/actions/auth";
import { Button } from "@/components/ui/button";

export function TopBar({ email }: { email: string | undefined }) {
  return (
    <header className="flex h-14 shrink-0 items-center justify-end gap-4 border-b border-border bg-background px-6">
      {email && <span className="text-sm text-muted-foreground">{email}</span>}
      <form action={logout}>
        <Button type="submit" variant="outline" size="sm">
          Log out
        </Button>
      </form>
    </header>
  );
}
