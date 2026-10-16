import "server-only";

import { getCurrentAdmin } from "@/lib/auth/current-admin";
import { recordActivity, requestContext } from "@/lib/activity";
import { classifyError, classifyOutcome, summarizeArgs, type ActivityKind } from "@/lib/activity-core";

type Options<A extends unknown[]> = {
  kind?: ActivityKind;
  /** Replaces the default argument summary (e.g. to record the email on a sign-in attempt). */
  summarize?: (args: A) => Record<string, unknown>;
};

async function actor() {
  try {
    const admin = await getCurrentAdmin();
    return admin ? { actorId: admin.id, actorEmail: admin.email, actorLevel: admin.admin_level } : {};
  } catch {
    return {};
  }
}

/**
 * Wraps a server action so every call is recorded: who, what, with which
 * arguments (summarised and redacted), whether it succeeded, how long it
 * took. A `{ success: false }` result counts as a failure; a thrown error is
 * recorded and rethrown; Next's redirect() and notFound() count as success.
 */
export function withActivity<A extends unknown[], R>(
  name: string,
  fn: (...args: A) => Promise<R>,
  options: Options<A> = {},
): (...args: A) => Promise<R> {
  const kind = options.kind ?? "action";
  return async function logged(...args: A): Promise<R> {
    const started = Date.now();
    let outcome: ReturnType<typeof classifyOutcome> | ReturnType<typeof classifyError>;
    try {
      const result = await fn(...args);
      outcome = classifyOutcome(result);
      return result;
    } catch (err) {
      outcome = classifyError(err);
      throw err;
    } finally {
      const durationMs = Date.now() - started;
      const meta = (() => {
        try {
          return options.summarize ? options.summarize(args) : summarizeArgs(args);
        } catch {
          return {};
        }
      })();
      void (async () => {
        const [who, ctx] = await Promise.all([actor(), requestContext()]);
        recordActivity({ kind, name, ...outcome!, durationMs, meta, ...who, ...ctx });
      })();
    }
  };
}
