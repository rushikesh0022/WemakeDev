"use client";

import { Bike, Check, ChevronRight, Clock3, House, MapPin, PackageCheck, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { AccountOrder, Address } from "@/lib/auth";

const stages = [
  { id: "confirmed", label: "Confirmed", detail: "Payment verified", icon: Check },
  { id: "packing", label: "Packing", detail: "Store is preparing", icon: ShoppingBag },
  { id: "out_for_delivery", label: "On the way", detail: "Rider has your order", icon: Bike },
  { id: "delivered", label: "Delivered", detail: "At your doorstep", icon: PackageCheck }
] as const;

export function OrderTrackingExperience({ order, address, allowFulfillmentSimulation = false }: { order: AccountOrder; address: Address; allowFulfillmentSimulation?: boolean }) {
  const [liveOrder, setLiveOrder] = useState(order);
  const [now, setNow] = useState(Date.now());
  const [updating, setUpdating] = useState("");
  const [error, setError] = useState("");
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(timer);
  }, []);
  const currentIndex = stages.findIndex((stage) => stage.id === liveOrder.fulfillmentStatus);
  const remainingMinutes = Math.max(0, Math.ceil((Date.parse(liveOrder.estimatedDeliveryAt) - now) / 60_000));
  const eta = useMemo(() => new Date(liveOrder.estimatedDeliveryAt).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" }), [liveOrder.estimatedDeliveryAt]);

  async function simulate(status: AccountOrder["fulfillmentStatus"]) {
    setUpdating(status); setError("");
    const response = await fetch(`/api/orders/${liveOrder.id}/fulfillment`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ status }) });
    const data = await response.json(); setUpdating("");
    if (response.ok) setLiveOrder(data.order); else setError(data.error ?? "Could not update this delivery.");
  }

  return <main className="tracking-page">
    <section className="tracking-hero page-enter">
      <div className="tracking-hero__glow" aria-hidden="true" />
      <img className="tracking-hero__art" src="/nesto/motion/order-journey-v2.webp" alt="Nesto scooter delivering an order" />
      <div className="tracking-hero__copy"><span>ORDER {liveOrder.id}</span><h1>{liveOrder.fulfillmentStatus === "delivered" ? "Delivered with care." : `${remainingMinutes || 1} min to your door`}</h1><p>{liveOrder.fulfillmentStatus === "confirmed" ? "Your payment is confirmed. The store has started preparing your basket." : liveOrder.fulfillmentStatus === "packing" ? "Your products are being checked and packed." : liveOrder.fulfillmentStatus === "out_for_delivery" ? "Your rider is heading to you now." : "We hope everything arrived just right."}</p></div>
      <div className="tracking-eta"><Clock3 /><span><small>ARRIVING BY</small><strong>{eta}</strong></span></div>
      <div className="tracking-route" aria-hidden="true"><span className="tracking-store"><ShoppingBag /></span><i /><span className="tracking-rider"><Bike /></span><i /><span className="tracking-home"><House /></span></div>
    </section>

    <section className="tracking-grid">
      <div className="tracking-card tracking-timeline page-enter"><header><span>LIVE STATUS</span><h2>Your delivery</h2></header><div className="tracking-steps">{stages.map((stage, index) => { const Icon = stage.icon; const complete = index <= currentIndex; return <article className={complete ? "is-complete" : ""} key={stage.id}><div><Icon /></div><span><strong>{stage.label}</strong><small>{stage.detail}</small></span>{index < stages.length - 1 && <i />}</article>; })}</div>{allowFulfillmentSimulation && <div className="tracking-simulator"><span>LOCAL DELIVERY SIMULATOR</span><div>{stages.map((stage) => <button className={liveOrder.fulfillmentStatus === stage.id ? "active" : ""} disabled={Boolean(updating)} key={stage.id} onClick={() => simulate(stage.id)}>{updating === stage.id ? "Updating…" : stage.label}</button>)}</div>{error && <p>{error}</p>}</div>}</div>
      <aside className="tracking-side page-enter">
        <section className="tracking-card tracking-address"><MapPin /><div><span>DELIVERING TO</span><strong>{address.label}</strong><p>{address.line1}, {address.city} {address.pincode}</p></div></section>
        <section className="tracking-card tracking-summary"><header><span>YOUR BASKET</span><strong>₹{liveOrder.total}</strong></header><div>{liveOrder.items.map((item) => <article key={item.lineId}><img src={`/products/${item.productId}.webp`} alt="" /><span><strong>{item.name}</strong><small>{item.quantity} × ₹{item.price}</small></span></article>)}</div></section>
      </aside>
    </section>
    <nav className="tracking-actions"><Link href="/account?view=orders">View all orders</Link><Link href="/">Continue shopping <ChevronRight /></Link></nav>
  </main>;
}
