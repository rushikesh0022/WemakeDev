import { NextResponse } from "next/server";
import { authenticateUser, createSessionToken, SESSION_COOKIE, sessionCookieOptions } from "@/lib/auth";

export async function POST(request: Request) {
  const body = await request.json();
  const user = await authenticateUser(String(body.email ?? ""), String(body.password ?? ""));
  if (!user) return NextResponse.json({ error: "The email or password is incorrect." }, { status: 401 });
  const response = NextResponse.json({ user });
  response.cookies.set(SESSION_COOKIE, createSessionToken(user), sessionCookieOptions);
  return response;
}
