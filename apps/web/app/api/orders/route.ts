import { NextResponse } from "next/server";
import { createOrder, currentUser, updateOrderPayment } from "@/lib/auth";
import { byId } from "@/lib/catalog";
import { capturePayment, createPaymentTransaction, type FakePaymentScenario } from "@/lib/payments";

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
  }).filter((item): item is { productId: string; name: string; quantity: number; price: number } => item !== null);
  if (!items.length) return NextResponse.json({ error: "The basket is empty." }, { status: 400 });
  const calculatedTotal = items.reduce((sum: number, item: { price: number; quantity: number }) => sum + item.price * item.quantity, 0);
  const scenarioInput = process.env.NODE_ENV === "production" ? "success" : String(body.paymentScenario ?? "success");
  const scenario: FakePaymentScenario = ["success", "pending", "decline", "timeout"].includes(scenarioInput) ? scenarioInput as FakePaymentScenario : "success";
  const transaction = await createPaymentTransaction(calculatedTotal * 100, scenario);
  const pendingOrder = await createOrder(user.id, { items, total: calculatedTotal, paymentTransactionId: transaction.id, paymentProvider: transaction.provider });
  if (!pendingOrder) return NextResponse.json({ error: "Could not create the order." }, { status: 500 });
  try {
    const payment = await capturePayment(transaction.id);
    const order = await updateOrderPayment(user.id, pendingOrder.id, payment.status);
    if (payment.status === "approved") return NextResponse.json({ order, payment }, { status: 201 });
    if (payment.status === "pending") return NextResponse.json({ order, payment, message: "Payment is still pending verification." }, { status: 202 });
    return NextResponse.json({ order, payment, error: payment.status === "declined" ? "The payment was declined." : "The payment timed out." }, { status: 402 });
  } catch (error) {
    return NextResponse.json({ order: pendingOrder, error: error instanceof Error ? error.message : "Payment could not be started." }, { status: 503 });
  }
}
