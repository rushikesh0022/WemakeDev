import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { splitCookieName, updateClaims } from "@/lib/splits";

export async function PUT(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const splitId = token.split(".")[0];
  const cookieValue = (await cookies()).get(splitCookieName(splitId))?.value;
  try {
    const body = await request.json();
    const claims = Array.isArray(body.claims) ? body.claims : [];
    const result = await updateClaims(token, cookieValue, Number(body.version), claims);
    if (!result) return NextResponse.json({ error: "This split link is invalid." }, { status: 404 });
    if (result.conflict) return NextResponse.json({ error: "Someone else changed these items. Review the latest quantities.", split: result.split }, { status: 409 });
    return NextResponse.json({ split: result.split });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not save claims." }, { status: 400 });
  }
}
