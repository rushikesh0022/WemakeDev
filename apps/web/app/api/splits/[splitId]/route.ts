import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { getSplitForOwner } from "@/lib/splits";

export async function GET(_request: Request, { params }: { params: Promise<{ splitId: string }> }) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Sign in to manage this split." }, { status: 401 });
  const split = await getSplitForOwner(user.id, (await params).splitId);
  return split ? NextResponse.json({ split }) : NextResponse.json({ error: "Split was not found." }, { status: 404 });
}
