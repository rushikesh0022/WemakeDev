import { NextResponse } from "next/server";
import { joinGroup } from "@/lib/group-orders";

export async function POST(request: Request, { params }: { params: Promise<{ token: string }> }) {
  try {
    const body = await request.json(); const result = await joinGroup((await params).token, String(body.displayName ?? ""));
    if (!result) return NextResponse.json({ error: "This basket link is invalid." }, { status: 404 });
    const response = NextResponse.json({ group: result.group }, { status: 201 });
    response.cookies.set(result.cookieName, result.cookieValue, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 7 * 86400 }); return response;
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Could not join this basket." }, { status: 400 }); }
}
