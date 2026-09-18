import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { lockSplit } from "@/lib/splits";

export async function POST(_request: Request, { params }: { params: Promise<{ splitId: string }> }) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Sign in to lock this split." }, { status: 401 });
  try {
    const split = await lockSplit(user.id, (await params).splitId);
    return split ? NextResponse.json({ split }) : NextResponse.json({ error: "Split was not found." }, { status: 404 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not lock the split." }, { status: 400 });
  }
}
