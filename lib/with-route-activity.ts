import "server-only";

import { recordActivity } from "@/lib/activity";
import { clientIp, errorMessage, statusForHttp } from "@/lib/activity-core";

type Handler<C> = (request: Request, context: C) => Promise<Response>;

/**
 * Wraps a route handler so every request is recorded with its status code,
 * duration and, for error responses, the `error` field of the JSON body.
 */
export function withRouteActivity<C>(name: string, handler: Handler<C>): Handler<C> {
  return async function logged(request: Request, context: C): Promise<Response> {
    const started = Date.now();
    const url = new URL(request.url);
    const base = {
      name,
      method: request.method,
      path: url.pathname,
      ip: clientIp((h) => request.headers.get(h)),
      userAgent: request.headers.get("user-agent"),
      requestId: request.headers.get("x-vercel-id"),
    };
    try {
      const response = await handler(request, context);
      let error: string | null = null;
      if (response.status >= 400) {
        try {
          const body = (await response.clone().json()) as { error?: unknown };
          if (typeof body?.error === "string") error = body.error;
        } catch {
          error = null;
        }
      }
      recordActivity({
        kind: "route",
        ...base,
        ok: response.status < 400,
        status: statusForHttp(response.status),
        httpStatus: response.status,
        error,
        durationMs: Date.now() - started,
      });
      return response;
    } catch (err) {
      recordActivity({
        kind: "route",
        ...base,
        ok: false,
        status: "error",
        httpStatus: 500,
        error: errorMessage(err),
        durationMs: Date.now() - started,
      });
      throw err;
    }
  };
}
