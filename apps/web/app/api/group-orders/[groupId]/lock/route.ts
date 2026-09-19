import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { lockGroup } from "@/lib/group-orders";

export async function POST(_request: Request, { params }: { params: Promise<{ groupId: string }> }) {
  const user = await currentUser(); if (!user) return NextResponse.json({ error: "Sign in to lock this basket." }, { status: 401 });
  try {
    const group = await lockGroup(user.id, (await params).groupId);
    return group ? NextResponse.json({ group }) : NextResponse.json({ error: "Group order was not found." }, { status: 404 });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Could not lock this basket." }, { status: 400 }); }
}
