import { NextResponse } from "next/server";
import { createSessionToken, registerUser, SESSION_COOKIE, sessionCookieOptions } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const user = await registerUser({ name: String(body.name ?? ""), email: String(body.email ?? ""), phone: String(body.phone ?? ""), password: String(body.password ?? "") });
    const response = NextResponse.json({ user }, { status: 201 });
    response.cookies.set(SESSION_COOKIE, createSessionToken(user), sessionCookieOptions);
    return response;
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not create the account." }, { status: 400 });
  }
}
