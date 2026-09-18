"use client";

import Link from "next/link";
import { Check, Clock3, MapPin, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { useCart } from "@/lib/cart-context";

export function CheckoutExperience() {
  const { items, count, total, clear } = useCart();
  const [placed, setPlaced] = useState(false);
  if (placed) return <section className="order-success"><div><Check /></div><span>DEMO ORDER CONFIRMED</span><h1>Your basket is packed.</h1><p>No real order or payment was created.</p><Link className="primary-button" href="/">Back to home</Link></section>;
  if (!items.length) return <section className="empty-cart"><h1>There is nothing to check out yet.</h1><Link className="primary-button" href="/">Browse the store</Link></section>;
  return (
    <div className="checkout-page"><header><span>CHECKOUT</span><h1>One last review</h1><p>This is a local prototype. Placing the order only demonstrates the flow.</p></header>
      <div className="checkout-layout"><section className="checkout-details">
        <article><MapPin /><div><span>DELIVERY DESTINATION</span><h2>Not configured</h2><p>A real address source will populate this field.</p></div><button>Configure</button></article>
        <article><Clock3 /><div><span>AVAILABILITY</span><h2>{count} items in stock</h2><p>A fulfilment service will calculate the delivery window.</p></div></article>
        <article><ShieldCheck /><div><span>PAYMENT</span><h2>Prototype payment</h2><p>No card, UPI, or personal data is requested.</p></div></article>
      </section><aside className="order-card"><span>PAYABLE</span><h2>₹{total}</h2><div>{items.map(({product,quantity})=><p key={product.id}><span>{quantity} × {product.name}</span><b>₹{product.price*quantity}</b></p>)}</div><button className="primary-button" onClick={()=>{clear();setPlaced(true);}}>Place demo order</button><small>By continuing, you confirm this is a product demonstration.</small></aside></div>
    </div>
  );
}
