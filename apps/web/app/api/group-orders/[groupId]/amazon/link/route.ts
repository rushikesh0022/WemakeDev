import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { linkOwnerAmazon } from "@/lib/group-orders";

export async function POST(_request: Request, { params }: { params: Promise<{ groupId: string }> }) {
  const user = await currentUser(); if (!user) return NextResponse.json({ error: "Sign in to link Amazon Pay." }, { status: 401 });
  const group = await linkOwnerAmazon(user.id, (await params).groupId);
  return group ? NextResponse.json({ group }) : NextResponse.json({ error: "Group order was not found." }, { status: 404 });
}
