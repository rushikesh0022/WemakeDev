import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { byId } from "@/lib/catalog";
import { createGroup, type GroupItem } from "@/lib/group-orders";

export async function POST(request: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Sign in before starting a group order." }, { status: 401 });
  const body = await request.json();
  const requested: unknown[] = Array.isArray(body.items) ? body.items : [];
  const items = requested.map((item, index): GroupItem | null => {
    const record = item && typeof item === "object" ? item as Record<string, unknown> : {};
    const product = byId(String(record.productId ?? ""));
    if (!product || product.stock <= 0) return null;
    return { lineId: `line_${index + 1}`, productId: product.id, name: product.name, image: `/products/${product.id}.webp`, quantity: Math.max(1, Math.min(product.stock, 50, Number(record.quantity) || 1)), unitPricePaise: product.price * 100 };
  }).filter((item): item is GroupItem => item !== null);
  try {
    return NextResponse.json(await createGroup({ ownerId: user.id, ownerName: user.name, items }), { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not start a group order." }, { status: 400 });
  }
}
