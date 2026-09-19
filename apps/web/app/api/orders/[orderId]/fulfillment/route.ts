import { NextResponse } from "next/server";
import { currentUser, updateOrderFulfillment, type AccountOrder } from "@/lib/auth";

const allowed = new Set<AccountOrder["fulfillmentStatus"]>(["confirmed", "packing", "out_for_delivery", "delivered"]);

export async function PATCH(request: Request, { params }: { params: Promise<{ orderId: string }> }) {
  if (process.env.NODE_ENV === "production") return NextResponse.json({ error: "Local fulfilment simulation is disabled in production." }, { status: 404 });
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Sign in to update this order." }, { status: 401 });
  const value = String((await request.json()).status ?? "") as AccountOrder["fulfillmentStatus"];
  if (!allowed.has(value)) return NextResponse.json({ error: "Unknown fulfilment state." }, { status: 400 });
  try {
    const order = await updateOrderFulfillment(user.id, (await params).orderId, value);
    return order ? NextResponse.json({ order }) : NextResponse.json({ error: "Order was not found." }, { status: 404 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not update fulfilment." }, { status: 400 });
  }
}
