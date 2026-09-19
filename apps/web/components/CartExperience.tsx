"use client";

import Link from "next/link";
import { ArrowLeft, Minus, Plus, ShieldCheck, ShoppingBag, Trash2, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useCart } from "@/lib/cart-context";
import { ProductArt } from "./ProductArt";

export function CartExperience() {
  const { items, total, count, setQuantity, remove } = useCart();
  const router = useRouter();
  const [groupBusy, setGroupBusy] = useState(false);
  const [groupError, setGroupError] = useState("");

  async function startGroupOrder() {
    setGroupBusy(true); setGroupError("");
    const response = await fetch("/api/group-orders", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ items: items.map(({ product, quantity }) => ({ productId: product.id, quantity })) }) });
    const data = await response.json(); setGroupBusy(false);
    if (response.status === 401) return router.push("/account");
    if (!response.ok) return setGroupError(data.error ?? "Could not start a group order.");
    sessionStorage.setItem(`pico-group-${data.group.id}`, data.publicToken);
    router.push(`/group/manage/${data.group.id}`);
  }
  if (!items.length) return (
    <section className="empty-cart">
      <div><ShoppingBag size={34} /></div><h1>Your cart is ready for a plan</h1>
      <p>Add individual products or ask us to build a complete basket.</p>
      <Link className="primary-button" href="/search">Describe what you need</Link>
      <Link className="text-link" href="/">Continue shopping</Link>
    </section>
  );

  return (
    <div className="cart-page">
      <Link className="back-link" href="/"><ArrowLeft size={16} /> Continue shopping</Link>
      <div className="cart-layout">
        <section className="cart-list">
          <header><div><span>YOUR CART</span><h1>{count} {count === 1 ? "item" : "items"}, ready to review</h1></div><small>Changes save on this device</small></header>
          {items.map(({ product, quantity, source }) => (
            <article className="cart-row" key={product.id}>
              <ProductArt product={product} />
              <div className="cart-row__copy"><span>{product.brand}</span><h2>{product.name}</h2><p>{product.pack}</p>{source && <small>Added from {source}</small>}</div>
              <div className="cart-row__controls">
                <strong>₹{product.price * quantity}</strong>
                <div className="stepper" aria-label={`${product.name} quantity`}><button aria-label={`Remove one ${product.name}`} onClick={() => setQuantity(product.id, quantity - 1)}><Minus size={14} /></button><span>{quantity}</span><button aria-label={`Add one ${product.name}`} onClick={() => setQuantity(product.id, quantity + 1)}><Plus size={14} /></button></div>
                <button className="remove-button" onClick={() => remove(product.id)}><Trash2 size={15} /> Remove</button>
              </div>
            </article>
          ))}
        </section>
        <aside className="order-card">
          <span>ORDER SUMMARY</span><h2>₹{total}</h2>
          <div><p><span>Item total</span><b>₹{total}</b></p><p><span>Handling</span><b>₹0</b></p><p><span>Demo delivery</span><b className="success">FREE</b></p></div>
          <Link className="primary-button" href="/checkout">Checkout myself</Link>
          <button className="group-cart-button" onClick={startGroupOrder} disabled={groupBusy}><Users />{groupBusy ? "Starting basket…" : "Shop & pay with friends"}</button>
          {groupError && <p className="form-error">{groupError}</p>}
          <small><ShieldCheck size={14} /> Every person pays Pico directly through Amazon Pay.</small>
        </aside>
      </div>
    </div>
  );
}
