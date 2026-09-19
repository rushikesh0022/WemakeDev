"use client";

import Link from "next/link";
import { Check, Clock3, CreditCard, MapPin, PackageCheck, ShieldCheck } from "lucide-react";
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
  if (orderId) return <section className="order-success order-success--nesto"><img src="/nesto/delivery-journey.webp" alt="Nesto scooter beginning a delivery" /><div className="order-success__badge"><Check /></div><span>ORDER CONFIRMED</span><h1>Your delivery is in motion.</h1><p>Payment for {orderId} is verified. We are checking and packing every item now.</p><div className="order-success__steps"><span className="active"><Check /> Confirmed</span><i /><span><PackageCheck /> Packing</span><i /><span><Clock3 /> On the way</span></div><Link className="primary-button" href={`/orders/${orderId}`}>Track live order</Link><Link className="text-link" href="/">Continue shopping</Link></section>;
  if (!items.length) return <section className="empty-cart"><h1>There is nothing to check out yet.</h1><Link className="primary-button" href="/">Browse the store</Link></section>;
  return (
    <div className="checkout-page"><header className="checkout-head"><span>SECURE CHECKOUT</span><h1>Review and place your order</h1><p>Confirm the address and pay securely. Nesto marks an order paid only after server verification.</p><div className="checkout-steps"><span className="done"><Check /> Cart</span><i /><span className="active">2</span><b>Payment</b><i /><span>3</span><b>Confirmation</b></div></header>
      <div className="checkout-layout"><section className="checkout-details">
        <article><MapPin /><div><span>DELIVERY DESTINATION</span><h2>{user.address?.label ?? "Add an address"}</h2><p>{user.address ? `${user.address.line1}, ${user.address.city} ${user.address.pincode}` : "Save an address in your account before delivery."}</p></div><Link href="/account">{user.address ? "Change" : "Configure"}</Link></article>
        <article><Clock3 /><div><span>DELIVERY SLOT</span><h2>Arrives in 10–15 minutes</h2><p>{count} {count === 1 ? "item is" : "items are"} reserved at the nearest store.</p></div><b className="checkout-free">FREE</b></article>
        <article><CreditCard /><div><span>PAYMENT METHOD</span><h2>Amazon Pay</h2><p>Use Amazon Pay balance or a supported UPI instrument after merchant onboarding.</p></div><span className="payment-secure"><ShieldCheck /> Secure</span></article>
      </section><aside className="order-card"><span>PAYABLE</span><h2>₹{total}</h2><div>{items.map(({product,quantity})=><p key={product.id}><span>{quantity} × {product.name}</span><b>₹{product.price*quantity}</b></p>)}</div>{allowPaymentSimulation && <label className="payment-simulator">LOCAL PAYMENT RESULT<select value={paymentScenario} onChange={(event) => setPaymentScenario(event.target.value as PaymentScenario)}><option value="success">Approved</option><option value="pending">Pending verification</option><option value="decline">Declined</option><option value="timeout">Timed out</option></select></label>}{error && <p className="form-error">{error}</p>}{pendingMessage && <p className="payment-pending">{pendingMessage}</p>}<button className="primary-button" disabled={placing || !user.address} onClick={placeOrder}>{placing ? "Confirming payment…" : user.address ? `Pay ₹${total}` : "Add address to continue"}</button><small>The MVP never asks for a UPI PIN or stores payment credentials.</small></aside></div>
    </div>
  );
}
