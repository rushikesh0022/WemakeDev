import { NextResponse } from "next/server";
import { getAwsRuntimeStatus } from "@/lib/aws-runtime";

export const dynamic = "force-dynamic";

export async function GET() {
  const status = getAwsRuntimeStatus();
  let health: { reachable: boolean; status: number | null } = { reachable: false, status: null };

  if (status.apiUrl) {
    try {
      const response = await fetch(`${status.apiUrl.replace(/\/$/, "")}/health`, {
        cache: "no-store",
        signal: AbortSignal.timeout(3000)
      });
      health = { reachable: response.ok, status: response.status };
    } catch {
      health = { reachable: false, status: null };
    }
  }

  return NextResponse.json({ ...status, health });
}
