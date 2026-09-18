import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getPublicSplit, splitCookieName } from "@/lib/splits";

export async function GET(_request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const splitId = token.split(".")[0];
  const cookieValue = (await cookies()).get(splitCookieName(splitId))?.value;
  const split = await getPublicSplit(token, cookieValue);
  return split ? NextResponse.json({ split }) : NextResponse.json({ error: "This split link is invalid or has been replaced." }, { status: 404 });
}
