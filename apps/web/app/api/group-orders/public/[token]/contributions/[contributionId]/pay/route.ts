import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { groupCookieName, payContribution } from "@/lib/group-orders";

export async function POST(request: Request, { params }: { params: Promise<{ token: string; contributionId: string }> }) {
  const { token, contributionId } = await params; const id = token.split(".")[0]; const cookieValue = (await cookies()).get(groupCookieName(id))?.value;
  const sourceIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip");
  const sourceUserAgent = request.headers.get("user-agent");
  try { const group = await payContribution(token, cookieValue, contributionId, { sourceIp, sourceUserAgent }); return group ? NextResponse.json({ group }) : NextResponse.json({ error: "This basket link is invalid." }, { status: 404 }); }
  catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Amazon Pay could not complete this contribution." }, { status: 400 }); }
}
