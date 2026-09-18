"use client";

import Link from "next/link";
import { Check, Clock3, MapPin, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { useCart } from "@/lib/cart-context";
import type { PublicUser } from "@/lib/auth";

export function CheckoutExperience({ user }: { user: PublicUser }) {
  const { items, count, total, clear } = useCart();
  const [orderId, setOrderId] = useState("");
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState("");
  async function placeOrder() {
    setPlacing(true); setError("");
    const response = await fetch("/api/orders", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ items: items.map(({ product, quantity }) => ({ productId: product.id, name: product.name, price: product.price, quantity })) }) });
    const data = await response.json();
    setPlacing(false);
    if (!response.ok) return setError(data.error ?? "Could not place the order.");
    clear(); setOrderId(data.order.id);
  }
  if (orderId) return <section className="order-success"><div><Check /></div><span>DEMO ORDER CONFIRMED</span><h1>Your basket is packed.</h1><p>Order {orderId} is now saved in your Zaply account.</p><Link className="primary-button" href="/account">View your orders</Link></section>;
  if (!items.length) return <section className="empty-cart"><h1>There is nothing to check out yet.</h1><Link className="primary-button" href="/">Browse the store</Link></section>;
  return (
    <div className="checkout-page"><header><span>CHECKOUT</span><h1>One last review</h1><p>This is a local prototype. Placing the order only demonstrates the flow.</p></header>
      <div className="checkout-layout"><section className="checkout-details">
        <article><MapPin /><div><span>DELIVERY DESTINATION</span><h2>{user.address?.label ?? "Add an address"}</h2><p>{user.address ? `${user.address.line1}, ${user.address.city} ${user.address.pincode}` : "Save an address in your account before delivery."}</p></div><Link href="/account">{user.address ? "Change" : "Configure"}</Link></article>
        <article><Clock3 /><div><span>AVAILABILITY</span><h2>{count} {count === 1 ? "item" : "items"} in stock</h2><p>A fulfilment service will calculate the delivery window.</p></div></article>
        <article><ShieldCheck /><div><span>PAYMENT</span><h2>Prototype payment</h2><p>No card, UPI, or personal data is requested.</p></div></article>
      </section><aside className="order-card"><span>PAYABLE</span><h2>₹{total}</h2><div>{items.map(({product,quantity})=><p key={product.id}><span>{quantity} × {product.name}</span><b>₹{product.price*quantity}</b></p>)}</div>{error && <p className="form-error">{error}</p>}<button className="primary-button" disabled={placing || !user.address} onClick={placeOrder}>{placing ? "Placing order…" : user.address ? "Place demo order" : "Add address to continue"}</button><small>By continuing, you confirm this is a product demonstration.</small></aside></div>
    </div>
  );
}
