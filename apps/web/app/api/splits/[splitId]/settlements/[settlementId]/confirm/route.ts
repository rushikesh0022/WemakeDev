import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { reviewSettlement } from "@/lib/splits";

export async function POST(_request: Request, { params }: { params: Promise<{ splitId: string; settlementId: string }> }) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Sign in to confirm this payment." }, { status: 401 });
  const { splitId, settlementId } = await params;
  try {
    const split = await reviewSettlement(user.id, splitId, settlementId, "confirm");
    return split ? NextResponse.json({ split }) : NextResponse.json({ error: "Settlement was not found." }, { status: 404 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not confirm payment." }, { status: 400 });
  }
}
