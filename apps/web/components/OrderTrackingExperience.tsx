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

export function OrderTrackingExperience({ order, address }: { order: AccountOrder; address: Address }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(timer);
  }, []);
  const currentIndex = stages.findIndex((stage) => stage.id === order.fulfillmentStatus);
  const remainingMinutes = Math.max(0, Math.ceil((Date.parse(order.estimatedDeliveryAt) - now) / 60_000));
  const eta = useMemo(() => new Date(order.estimatedDeliveryAt).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" }), [order.estimatedDeliveryAt]);

  return <main className="tracking-page">
    <section className="tracking-hero page-enter">
      <div className="tracking-hero__copy"><span>ORDER {order.id}</span><h1>{order.fulfillmentStatus === "delivered" ? "Delivered with care." : `${remainingMinutes || 1} min to your door`}</h1><p>{order.fulfillmentStatus === "confirmed" ? "Your payment is confirmed. The store has started preparing your basket." : order.fulfillmentStatus === "packing" ? "Your products are being checked and packed." : order.fulfillmentStatus === "out_for_delivery" ? "Your rider is heading to you now." : "We hope everything arrived just right."}</p></div>
      <div className="tracking-eta"><Clock3 /><span><small>ARRIVING BY</small><strong>{eta}</strong></span></div>
      <div className="tracking-route" aria-hidden="true"><span className="tracking-store"><ShoppingBag /></span><i /><span className="tracking-rider"><Bike /></span><i /><span className="tracking-home"><House /></span></div>
    </section>

    <section className="tracking-grid">
      <div className="tracking-card tracking-timeline page-enter"><header><span>LIVE STATUS</span><h2>Your delivery</h2></header><div className="tracking-steps">{stages.map((stage, index) => { const Icon = stage.icon; const complete = index <= currentIndex; return <article className={complete ? "is-complete" : ""} key={stage.id}><div><Icon /></div><span><strong>{stage.label}</strong><small>{stage.detail}</small></span>{index < stages.length - 1 && <i />}</article>; })}</div></div>
      <aside className="tracking-side page-enter">
        <section className="tracking-card tracking-address"><MapPin /><div><span>DELIVERING TO</span><strong>{address.label}</strong><p>{address.line1}, {address.city} {address.pincode}</p></div></section>
        <section className="tracking-card tracking-summary"><header><span>YOUR BASKET</span><strong>₹{order.total}</strong></header><div>{order.items.map((item) => <article key={item.lineId}><img src={`/products/${item.productId}.webp`} alt="" /><span><strong>{item.name}</strong><small>{item.quantity} × ₹{item.price}</small></span></article>)}</div></section>
      </aside>
    </section>
    <nav className="tracking-actions"><Link href="/account?view=orders">View all orders</Link><Link href="/">Continue shopping <ChevronRight /></Link></nav>
  </main>;
}
