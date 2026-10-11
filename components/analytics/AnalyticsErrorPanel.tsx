"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { CircleAlert, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AnalyticsErrorPanel({ message, hint }: { message: string; hint: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <section role="alert" className="rounded-xl border border-red-400/30 bg-red-400/[0.04] p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <CircleAlert className="mt-0.5 size-5 shrink-0 text-red-400" aria-hidden />
        <div className="min-w-0 space-y-1.5">
          <h2 className="text-base font-semibold tracking-tight">{message}</h2>
          <p className="max-w-[65ch] text-sm leading-relaxed text-muted-foreground">{hint}</p>
          <div className="pt-2">
            <Button variant="outline" size="sm" disabled={pending} onClick={() => startTransition(() => router.refresh())}>
              <RefreshCw className={pending ? "animate-spin" : undefined} aria-hidden />
              {pending ? "Trying…" : "Try again"}
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
