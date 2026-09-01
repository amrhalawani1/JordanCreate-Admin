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
        <p className="jc-label">Admin Panel</p>
        <h1 className="jc-page-title mt-5 text-[3.5rem] leading-[1.05]">
          Jordan Create
        </h1>
        <p className="mt-6 max-w-sm text-base leading-relaxed text-muted-foreground">
          Where we build the frame
        </p>
      </div>

      <div className="flex items-center justify-center px-4 py-12 pt-[max(3rem,env(safe-area-inset-top))] pb-[max(3rem,env(safe-area-inset-bottom))] md:px-6 md:py-16">
        <div className="w-full max-w-sm">
          <p className="jc-label lg:hidden">Admin Panel</p>
          <h2 className="jc-page-title mt-3 lg:hidden">Jordan Create</h2>
          <p className="jc-label hidden lg:block">Sign in</p>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Admin and registry. Sign in to edit the data that feeds the app and the bot.
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
