import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { beginOwnerAmazonLink } from "@/lib/group-orders";

export async function POST(_request: Request, { params }: { params: Promise<{ groupId: string }> }) {
  const user = await currentUser(); if (!user) return NextResponse.json({ error: "Sign in to link Amazon Pay." }, { status: 401 });
  try {
    const result = await beginOwnerAmazonLink(user.id, (await params).groupId);
    return result ? NextResponse.json(result) : NextResponse.json({ error: "Group order was not found." }, { status: 404 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not start Amazon Pay." }, { status: 400 });
  }
}
