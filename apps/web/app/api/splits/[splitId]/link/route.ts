import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { rotatePublicLink } from "@/lib/splits";

export async function POST(_request: Request, { params }: { params: Promise<{ splitId: string }> }) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Sign in to share this split." }, { status: 401 });
  const result = await rotatePublicLink(user.id, (await params).splitId);
  return result ? NextResponse.json(result) : NextResponse.json({ error: "Split was not found." }, { status: 404 });
}
