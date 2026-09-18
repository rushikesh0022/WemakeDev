import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { markSettlementSent, splitCookieName } from "@/lib/splits";

export async function POST(_request: Request, { params }: { params: Promise<{ token: string; settlementId: string }> }) {
  const { token, settlementId } = await params;
  const splitId = token.split(".")[0];
  const cookieValue = (await cookies()).get(splitCookieName(splitId))?.value;
  try {
    const split = await markSettlementSent(token, cookieValue, settlementId);
    return split ? NextResponse.json({ split }) : NextResponse.json({ error: "This split link is invalid." }, { status: 404 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not report payment." }, { status: 400 });
  }
}
