import { NextResponse } from "next/server";
import { currentDeploymentId } from "@/lib/deployment-id";

export const dynamic = "force-dynamic";

/** Polled by open admin tabs; a different id means a newer deployment is live. */
export function GET() {
  return NextResponse.json(
    { id: currentDeploymentId() },
    { headers: { "Cache-Control": "no-store" } },
  );
}
