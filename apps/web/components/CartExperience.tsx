"use client";

import Link from "next/link";
import { ArrowLeft, Minus, Plus, ShieldCheck, ShoppingBag, Trash2 } from "lucide-react";
import { useCart } from "@/lib/cart-context";
import { ProductArt } from "./ProductArt";

export function CartExperience() {
  const { items, total, count, setQuantity, remove } = useCart();
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
                <div className="stepper"><button onClick={() => setQuantity(product.id, quantity - 1)}><Minus size={14} /></button><span>{quantity}</span><button onClick={() => setQuantity(product.id, quantity + 1)}><Plus size={14} /></button></div>
                <button className="remove-button" onClick={() => remove(product.id)}><Trash2 size={15} /> Remove</button>
              </div>
            </article>
          ))}
        </section>
        <aside className="order-card">
          <span>ORDER SUMMARY</span><h2>₹{total}</h2>
          <div><p><span>Item total</span><b>₹{total}</b></p><p><span>Handling</span><b>₹0</b></p><p><span>Demo delivery</span><b className="success">FREE</b></p></div>
          <Link className="primary-button" href="/checkout">Continue to checkout</Link>
          <small><ShieldCheck size={14} /> This MVP does not collect payment.</small>
        </aside>
      </div>
    </div>
  );
}
