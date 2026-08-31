import { ArrowLeft } from "lucide-react";
import { logout } from "@/actions/auth";
import { Button } from "@/components/ui/button";

export function MissingAdminProfile({ email }: { email: string | undefined }) {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-6">
      <div className="w-full max-w-md rounded-[4px] border border-border bg-card px-8 py-12">
        <p className="jc-label">Access</p>
        <h1 className="jc-page-title mt-3 text-[2rem]">No admin profile</h1>
        <p className="mt-4 text-base leading-relaxed text-muted-foreground">
          {email ? `${email} is signed in, but` : "This account is signed in, but"} it has no
          admin profile. Ask a super admin to add you, then sign in again.
        </p>
        <form action={logout} className="mt-8">
          <Button type="submit">
            <ArrowLeft />
            Home page
          </Button>
        </form>
      </div>
    </div>
  );
}
