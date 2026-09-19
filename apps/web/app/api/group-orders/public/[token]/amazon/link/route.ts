import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { beginParticipantAmazonLink, groupCookieName } from "@/lib/group-orders";

export async function POST(_request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params; const id = token.split(".")[0]; const cookieValue = (await cookies()).get(groupCookieName(id))?.value;
  try { const result = await beginParticipantAmazonLink(token, cookieValue); return result ? NextResponse.json(result) : NextResponse.json({ error: "This basket link is invalid." }, { status: 404 }); }
  catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Could not link Amazon Pay." }, { status: 400 }); }
}
