import Link from "next/link";
import { CheckCircle2, CircleDashed, ExternalLink, FlaskConical, PlugZap } from "lucide-react";
import { ANALYTICS_ENV_VARS } from "@/lib/analytics/config";
import { buttonVariants } from "@/components/ui/button";

const STEPS: { title: string; body: React.ReactNode }[] = [
  {
    title: "Copy the property ID",
    body: (
      <>
        In Google Analytics open <b className="font-medium text-foreground">Admin → Property details</b> for the
        “Jordan Create Website” property and copy the <b className="font-medium text-foreground">Property ID</b>, a
        number like 556218299. It is not the G-RQ7LFVTWWW measurement ID.
      </>
    ),
  },
  {
    title: "Create a read-only service account",
    body: (
      <>
        In Google Cloud, enable the <b className="font-medium text-foreground">Google Analytics Data</b>,{" "}
        <b className="font-medium text-foreground">IAM Service Account Credentials</b> and{" "}
        <b className="font-medium text-foreground">Security Token Service</b> APIs, then create a service account. No
        key file is needed. In Google Analytics, add its email as a <b className="font-medium text-foreground">Viewer</b>.
      </>
    ),
  },
  {
    title: "Let Vercel act as it, without a key",
    body: (
      <>
        Under <b className="font-medium text-foreground">IAM & Admin → Workload Identity Federation</b>, create a pool
        with an OIDC provider: issuer <code className="text-foreground">https://oidc.vercel.com/&lt;team&gt;</code>,
        allowed audience <code className="text-foreground">https://vercel.com/&lt;team&gt;</code>, and{" "}
        <code className="text-foreground">google.subject = assertion.sub</code>. Then grant the admin’s production
        principal <b className="font-medium text-foreground">Workload Identity User</b> on the service account.
      </>
    ),
  },
  {
    title: "Add three environment variables and redeploy",
    body: (
      <>
        Set them on the admin’s Vercel project for Production. None of them is a secret. Live figures only load on the
        deployed admin; locally, use the sample preview.
      </>
    ),
  },
];

export function SetupGuide({ missing, problem }: { missing: string[]; problem?: string }) {
  return (
    <section className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="border-b border-border bg-[linear-gradient(120deg,rgba(234,143,45,0.10),rgba(234,143,45,0)_55%)] p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-orange/15 text-orange">
            <PlugZap className="size-5" aria-hidden />
          </span>
          <div className="space-y-1.5">
            <h2 className="text-base font-semibold tracking-tight">Connect Google Analytics</h2>
            <p className="max-w-[62ch] text-sm leading-relaxed text-muted-foreground">
              The website already sends visits to Google Analytics. To show them here, the admin panel needs read-only
              access to the property, granted to the deployment itself, with no key file to store or leak. This is a
              one-time setup for a super admin.
            </p>
          </div>
        </div>
        {problem ? (
          <p className="mt-4 rounded-lg border border-red-400/30 bg-red-400/5 px-3 py-2 text-sm text-red-300">{problem}</p>
        ) : null}
        <ul className="mt-4 flex flex-wrap gap-2" aria-label="Environment variables">
          {ANALYTICS_ENV_VARS.map((name) => {
            const isMissing = missing.includes(name);
            return (
              <li
                key={name}
                className="inline-flex items-center gap-1.5 rounded-md border border-border bg-black/20 px-2 py-1 font-mono text-xs"
              >
                {isMissing ? (
                  <CircleDashed className="size-3.5 text-faint" aria-hidden />
                ) : (
                  <CheckCircle2 className="size-3.5 text-emerald-400" aria-hidden />
                )}
                <span className={isMissing ? "text-muted-foreground" : "text-foreground"}>{name}</span>
                <span className="sr-only">{isMissing ? "not set" : "set"}</span>
              </li>
            );
          })}
        </ul>
      </div>

      <ol className="grid gap-px bg-border sm:grid-cols-2">
        {STEPS.map((step, i) => (
          <li key={step.title} className="bg-card p-5">
            <p className="flex items-center gap-2 text-sm font-semibold">
              <span className="flex size-6 items-center justify-center rounded-full border border-orange/40 text-xs text-orange">
                {i + 1}
              </span>
              {step.title}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.body}</p>
            {i === 3 ? (
              <pre className="mt-3 overflow-x-auto rounded-lg border border-border bg-black/30 px-3 py-2 font-mono text-xs leading-relaxed text-foreground">
                {`GA4_PROPERTY_ID=556218299\nGA_SERVICE_ACCOUNT_EMAIL=ga-reader@<project>.iam.gserviceaccount.com\nGCP_WORKLOAD_IDENTITY_PROVIDER=projects/<number>/locations/global/workloadIdentityPools/vercel/providers/vercel`}
              </pre>
            ) : null}
          </li>
        ))}
      </ol>

      <div className="flex flex-wrap items-center gap-3 border-t border-border p-5">
        <Link href="/analytics?preview=sample" className={buttonVariants()}>
          <FlaskConical aria-hidden />
          Preview with sample data
        </Link>
        <a href="https://analytics.google.com/" target="_blank" rel="noreferrer" className={buttonVariants({ variant: "outline" })}>
          Open Google Analytics
          <ExternalLink aria-hidden />
        </a>
        <p className="text-xs text-faint">The sample preview uses made-up figures to show the layout.</p>
      </div>
    </section>
  );
}
