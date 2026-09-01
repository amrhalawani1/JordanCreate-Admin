import { ArrowLeft } from "lucide-react";
import { logout } from "@/actions/auth";
import { Button } from "@/components/ui/button";

export function MissingAdminProfile({ email }: { email: string | undefined }) {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-4 py-12 pt-[max(3rem,env(safe-area-inset-top))] pb-[max(3rem,env(safe-area-inset-bottom))]">
      <div className="w-full max-w-md rounded-[4px] border border-border bg-card px-4 py-8 md:px-8 md:py-12">
        <p className="jc-label">Access</p>
        <h1 className="jc-page-title mt-3 text-[1.75rem] md:text-[2rem]">No admin profile</h1>
        <p className="mt-4 break-words text-base leading-relaxed text-muted-foreground">
          {email ? `${email} is signed in, but` : "This account is signed in, but"} it has no
          admin profile. Ask a super admin to add you, then sign in again.
        </p>
        <form action={logout} className="mt-8">
          <Button type="submit" className="w-full sm:w-auto">
            <ArrowLeft />
            Home page
          </Button>
        </form>
      </div>
    </div>
  );
}
