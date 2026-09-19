import { NextResponse } from "next/server";
import { confirmRegistration } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    await confirmRegistration(String(body.email ?? ""), String(body.code ?? ""));
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not verify the account." }, { status: 400 });
  }
}
