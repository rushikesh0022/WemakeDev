import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getPublicGroup, groupCookieName } from "@/lib/group-orders";

export async function GET(_request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params; const id = token.split(".")[0]; const cookieValue = (await cookies()).get(groupCookieName(id))?.value;
  const group = await getPublicGroup(token, cookieValue);
  return group ? NextResponse.json({ group }) : NextResponse.json({ error: "This private basket link is invalid or has been replaced." }, { status: 404 });
}
