import { NextResponse } from "next/server";
import { createOrder, currentUser, type AccountOrder } from "@/lib/auth";
import { byId } from "@/lib/catalog";

export async function POST(request: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Sign in before placing an order." }, { status: 401 });
  const body = await request.json();
  const requestedItems: unknown[] = Array.isArray(body.items) ? body.items : [];
  const items = requestedItems.map((item) => {
    const record = (item && typeof item === "object" ? item : {}) as Record<string, unknown>;
    const product = byId(String(record.productId ?? "").slice(0, 80));
    if (!product || product.stock <= 0) return null;
    return {
      productId: product.id,
      name: product.name,
      quantity: Math.max(1, Math.min(product.stock, 50, Number(record.quantity) || 1)),
      price: product.price
    };
  }).filter((item): item is AccountOrder["items"][number] => item !== null);
  if (!items.length) return NextResponse.json({ error: "The basket is empty." }, { status: 400 });
  const calculatedTotal = items.reduce((sum: number, item: { price: number; quantity: number }) => sum + item.price * item.quantity, 0);
  const order = await createOrder(user.id, { items, total: calculatedTotal });
  return NextResponse.json({ order }, { status: 201 });
}
