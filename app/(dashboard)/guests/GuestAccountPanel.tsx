import type { GuestProfile } from "@/types/entities";

function formatWhen(value: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" });
}

/** Same rule as the app: the last four characters of the guest id, upper-cased. */
export function guestNumber(guestId: string): string {
  return guestId.replaceAll("-", "").slice(-4).toUpperCase();
}

const rows: { label: string; value: (guest: GuestProfile) => string }[] = [
  { label: "Guest number", value: (g) => guestNumber(g.guest_id) },
  { label: "App account", value: (g) => (g.auth_user_id ? "Signed up on the app" : "Not signed up yet") },
  { label: "Auth user ID", value: (g) => g.auth_user_id ?? "—" },
  { label: "Created", value: (g) => formatWhen(g.created_at) },
  { label: "Last updated", value: (g) => formatWhen(g.updated_at) },
  { label: "Last bot interaction", value: (g) => formatWhen(g.last_interaction_time) },
];

/** Read-only facts the app and bot maintain; admins can see them but not edit them. */
export function GuestAccountPanel({ guest }: { guest: GuestProfile }) {
  return (
    <section className="rounded-xl border border-border bg-white/[0.02] p-4">
      <p className="jc-label mb-3">Account</p>
      <dl className="grid grid-cols-1 gap-x-4 gap-y-2 text-sm sm:grid-cols-[auto_1fr]">
        {rows.map((row) => (
          <div key={row.label} className="contents">
            <dt className="text-muted-foreground">{row.label}</dt>
            <dd className="break-all text-foreground">{row.value(guest)}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
