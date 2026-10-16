import type { Instrumentation } from "next";

export async function register() {}

/** Every unhandled server error, from any page, action or route, lands in the activity log. */
export const onRequestError: Instrumentation.onRequestError = async (err, request, context) => {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { recordActivity } = await import("@/lib/activity");
  const { errorMessage } = await import("@/lib/activity-core");
  const digest = err && typeof err === "object" && "digest" in err ? String((err as { digest: unknown }).digest) : null;
  recordActivity({
    kind: "error",
    name: context.routePath || request.path,
    ok: false,
    status: "error",
    error: errorMessage(err),
    method: request.method,
    path: request.path,
    meta: { routerKind: context.routerKind, routeType: context.routeType, renderSource: context.renderSource, digest },
  });
};
