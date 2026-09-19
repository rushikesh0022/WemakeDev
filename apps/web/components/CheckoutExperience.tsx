"use client";

import Link from "next/link";
import { Check, Clock3, MapPin, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { useCart } from "@/lib/cart-context";
import type { PublicUser } from "@/lib/auth";

type PaymentScenario = "success" | "pending" | "decline" | "timeout";

export function CheckoutExperience({ user, allowPaymentSimulation = false }: { user: PublicUser; allowPaymentSimulation?: boolean }) {
  const { items, count, total, clear } = useCart();
  const [orderId, setOrderId] = useState("");
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState("");
  const [paymentScenario, setPaymentScenario] = useState<PaymentScenario>("success");
  const [pendingMessage, setPendingMessage] = useState("");
  async function placeOrder() {
    setPlacing(true); setError(""); setPendingMessage("");
    const response = await fetch("/api/orders", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ paymentScenario, items: items.map(({ product, quantity }) => ({ productId: product.id, name: product.name, price: product.price, quantity })) }) });
    const data = await response.json();
    setPlacing(false);
    if (response.status === 202) return setPendingMessage(`Order ${data.order.id} was created, but payment is still pending verification.`);
    if (!response.ok) return setError(data.error ?? "Could not complete payment.");
    clear(); setOrderId(data.order.id);
  }
  if (orderId) return <section className="order-success"><div><Check /></div><span>PAYMENT CONFIRMED</span><h1>Your order is confirmed.</h1><p>Order {orderId} is paid. The store is preparing your basket now.</p><Link className="primary-button" href={`/orders/${orderId}`}>Track your order</Link></section>;
  if (!items.length) return <section className="empty-cart"><h1>There is nothing to check out yet.</h1><Link className="primary-button" href="/">Browse the store</Link></section>;
  return (
    <div className="checkout-page"><header><span>CHECKOUT</span><h1>One last review</h1><p>The local payment adapter mirrors the states required for Amazon Pay sandbox integration.</p></header>
      <div className="checkout-layout"><section className="checkout-details">
        <article><MapPin /><div><span>DELIVERY DESTINATION</span><h2>{user.address?.label ?? "Add an address"}</h2><p>{user.address ? `${user.address.line1}, ${user.address.city} ${user.address.pincode}` : "Save an address in your account before delivery."}</p></div><Link href="/account">{user.address ? "Change" : "Configure"}</Link></article>
        <article><Clock3 /><div><span>AVAILABILITY</span><h2>{count} {count === 1 ? "item" : "items"} in stock</h2><p>A fulfilment service will calculate the delivery window.</p></div></article>
        <article><ShieldCheck /><div><span>PAYMENT</span><h2>Amazon Pay</h2><p>Pico confirms the payment server-side before marking the order paid.</p></div></article>
      </section><aside className="order-card"><span>PAYABLE</span><h2>₹{total}</h2><div>{items.map(({product,quantity})=><p key={product.id}><span>{quantity} × {product.name}</span><b>₹{product.price*quantity}</b></p>)}</div>{allowPaymentSimulation && <label className="payment-simulator">LOCAL PAYMENT RESULT<select value={paymentScenario} onChange={(event) => setPaymentScenario(event.target.value as PaymentScenario)}><option value="success">Approved</option><option value="pending">Pending verification</option><option value="decline">Declined</option><option value="timeout">Timed out</option></select></label>}{error && <p className="form-error">{error}</p>}{pendingMessage && <p className="payment-pending">{pendingMessage}</p>}<button className="primary-button" disabled={placing || !user.address} onClick={placeOrder}>{placing ? "Confirming payment…" : user.address ? `Pay ₹${total}` : "Add address to continue"}</button><small>The MVP never asks for a UPI PIN or stores payment credentials.</small></aside></div>
    </div>
  );
}
