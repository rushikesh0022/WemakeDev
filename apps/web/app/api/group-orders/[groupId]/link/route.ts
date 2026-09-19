import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { rotateGroupLink } from "@/lib/group-orders";

export async function POST(_request: Request, { params }: { params: Promise<{ groupId: string }> }) {
  const user = await currentUser(); if (!user) return NextResponse.json({ error: "Sign in to share this basket." }, { status: 401 });
  const result = await rotateGroupLink(user.id, (await params).groupId);
  return result ? NextResponse.json(result) : NextResponse.json({ error: "Group order was not found." }, { status: 404 });
}
