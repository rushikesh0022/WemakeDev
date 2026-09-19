import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { groupCookieName, updateGroupClaims } from "@/lib/group-orders";

export async function PUT(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params; const id = token.split(".")[0]; const cookieValue = (await cookies()).get(groupCookieName(id))?.value;
  try {
    const body = await request.json(); const result = await updateGroupClaims(token, cookieValue, Number(body.version), Array.isArray(body.claims) ? body.claims : []);
    if (!result) return NextResponse.json({ error: "This basket link is invalid." }, { status: 404 });
    if (result.conflict) return NextResponse.json({ error: "Someone changed this basket. Review the latest quantities.", group: result.group }, { status: 409 });
    return NextResponse.json({ group: result.group });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Could not save your items." }, { status: 400 }); }
}
