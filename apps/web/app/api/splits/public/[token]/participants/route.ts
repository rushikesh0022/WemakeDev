import { NextResponse } from "next/server";
import { joinSplit } from "@/lib/splits";

export async function POST(request: Request, { params }: { params: Promise<{ token: string }> }) {
  try {
    const body = await request.json();
    const result = await joinSplit((await params).token, String(body.displayName ?? ""));
    if (!result) return NextResponse.json({ error: "This split link is invalid." }, { status: 404 });
    const response = NextResponse.json({ split: result.split }, { status: 201 });
    response.cookies.set(result.cookieName, result.cookieValue, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 7 * 86400 });
    return response;
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not join the split." }, { status: 400 });
  }
}
