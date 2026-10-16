import pino from "pino";
import { currentDeploymentId } from "@/lib/deployment-id";

/**
 * Structured server log. One JSON line per event, picked up by Vercel's Logs
 * tab (filter on `activity.name` or `level`). Secrets are redacted by key.
 */
export const logger = pino({
  level: process.env.LOG_LEVEL?.trim() || "info",
  base: { app: "jordan-create-admin", deployment: currentDeploymentId() },
  timestamp: pino.stdTimeFunctions.isoTime,
  redact: {
    paths: ["*.password", "*.token", "*.secret", "*.authorization", "*.cookie", "*.qr_token", "req.headers.authorization", "req.headers.cookie"],
    censor: "[redacted]",
  },
});
