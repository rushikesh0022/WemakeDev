import { NextResponse } from "next/server";
import { currentUser, updateUser } from "@/lib/auth";

export async function PATCH(request: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Sign in to update your account." }, { status: 401 });
  try {
    const body = await request.json();
    const address = body.address === null ? null : body.address ? {
      label: String(body.address.label ?? "Home").slice(0, 30),
      line1: String(body.address.line1 ?? "").trim().slice(0, 180),
      city: String(body.address.city ?? "").trim().slice(0, 80),
      pincode: String(body.address.pincode ?? "").trim().slice(0, 12)
    } : undefined;
    const updated = await updateUser(user.id, { name: body.name === undefined ? undefined : String(body.name), phone: body.phone === undefined ? undefined : String(body.phone), address });
    return NextResponse.json({ user: updated });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not update the account." }, { status: 400 });
  }
}
