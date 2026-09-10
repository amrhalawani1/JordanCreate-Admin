"use client";

import { useActionState, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { login } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(login, undefined);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="grid min-h-dvh bg-canvas-deeper lg:grid-cols-2">
      <div className="hidden flex-col justify-end border-r border-white/10 bg-canvas-deeper p-12 lg:flex">
        <p className="jc-label">Admin</p>
        <h1 className="mt-4 font-[family-name:var(--font-ui)] text-4xl font-semibold tracking-tight text-foreground">
          Jordan Create
        </h1>
        <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">
          Sign in to manage event data for the app and concierge bot.
        </p>
      </div>

      <div className="flex items-center justify-center px-4 py-12 pt-[max(3rem,env(safe-area-inset-top))] pb-[max(3rem,env(safe-area-inset-bottom))] md:px-6 md:py-16">
        <div className="w-full max-w-sm rounded-xl border border-border bg-card p-6 sm:p-7">
          <p className="jc-label">Sign in</p>
          <h2 className="mt-2 font-[family-name:var(--font-ui)] text-xl font-semibold tracking-tight text-foreground lg:hidden">
            Jordan Create
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Use your admin account to continue.
          </p>

          <form action={formAction} className="mt-8 space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" autoComplete="email" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  className="pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((open) => !open)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                  className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-faint transition-colors hover:text-foreground focus-visible:text-foreground focus-visible:outline-none"
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            {state?.error && (
              <p className="text-sm text-destructive" role="alert">
                {state.error}
              </p>
            )}

            <Button type="submit" disabled={pending} className="mt-2 w-full">
              {pending ? "Signing in…" : "Sign in"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
