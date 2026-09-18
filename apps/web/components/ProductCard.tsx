"use client";

import { Minus, Plus, Star } from "lucide-react";
import { useCart } from "@/lib/cart-context";
import type { Product } from "@/lib/types";
import { ProductArt } from "./ProductArt";

export function ProductCard({ product, source }: { product: Product; source?: string }) {
  const { items, add, setQuantity } = useCart();
  const quantity = items.find((item) => item.product.id === product.id)?.quantity ?? 0;
  const discount = Math.round((1 - product.price / product.mrp) * 100);

  return (
    <article className="product-card">
      <div className="product-card__visual">
        {discount > 0 && <span className="discount-badge">{discount}% off</span>}
        <ProductArt product={product} />
      </div>
      <div className="product-card__meta">
        <div className="delivery-mini">{product.stock > 0 ? `${product.stock} in stock` : "Unavailable"}</div>
        <h3>{product.name}</h3>
        <p>{product.pack}</p>
        <div className="rating-line"><Star size={12} fill="currentColor" /> {product.rating} <span>({product.ratingCount})</span></div>
      </div>
      <div className="product-card__footer">
        <div><strong>₹{product.price}</strong>{product.mrp > product.price && <s>₹{product.mrp}</s>}</div>
        {quantity === 0 ? (
          <button className="add-button" onClick={() => add(product, 1, source)} aria-label={`Add ${product.name}`}><span>ADD</span><Plus size={17} /></button>
        ) : (
          <div className="stepper" aria-label={`${product.name} quantity`}>
            <button onClick={() => setQuantity(product.id, quantity - 1)} aria-label={`Remove one ${product.name}`}><Minus size={15} /></button>
            <span>{quantity}</span>
            <button onClick={() => setQuantity(product.id, quantity + 1)} aria-label={`Add one ${product.name}`}><Plus size={15} /></button>
          </div>
        )}
      </div>
    </article>
  );
}
