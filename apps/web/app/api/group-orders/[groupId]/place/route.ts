import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { placeGroupOrder } from "@/lib/group-orders";

export async function POST(_request: Request, { params }: { params: Promise<{ groupId: string }> }) {
  const user = await currentUser(); if (!user) return NextResponse.json({ error: "Sign in to place this order." }, { status: 401 });
  if (!user.address) return NextResponse.json({ error: "Add a delivery address in your account before placing this order." }, { status: 400 });
  try {
    const group = await placeGroupOrder(user.id, (await params).groupId);
    return group ? NextResponse.json({ group }) : NextResponse.json({ error: "Group order was not found." }, { status: 404 });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Could not place the order." }, { status: 400 }); }
}
