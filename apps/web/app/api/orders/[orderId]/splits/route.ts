import { NextResponse } from "next/server";
import { attachSplitToOrder, currentUser, getOrder } from "@/lib/auth";
import { createSplit } from "@/lib/splits";

export async function POST(request: Request, { params }: { params: Promise<{ orderId: string }> }) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Sign in to split an order." }, { status: 401 });
  const { orderId } = await params;
  const order = await getOrder(user.id, orderId);
  if (!order) return NextResponse.json({ error: "Order was not found." }, { status: 404 });
  try {
    const body = await request.json();
    const created = await createSplit({ order, ownerId: user.id, ownerName: user.name, ownerVpa: String(body.ownerVpa ?? "") });
    await attachSplitToOrder(user.id, order.id, created.split.id);
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not create the split.";
    return NextResponse.json({ error: message, splitId: order.splitId }, { status: message.includes("already") ? 409 : 400 });
  }
}
