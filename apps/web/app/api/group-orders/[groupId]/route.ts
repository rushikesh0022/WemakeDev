import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { getOwnerGroup } from "@/lib/group-orders";

export async function GET(_request: Request, { params }: { params: Promise<{ groupId: string }> }) {
  const user = await currentUser(); if (!user) return NextResponse.json({ error: "Sign in to manage this order." }, { status: 401 });
  const group = await getOwnerGroup(user.id, (await params).groupId);
  return group ? NextResponse.json({ group }) : NextResponse.json({ error: "Group order was not found." }, { status: 404 });
}
