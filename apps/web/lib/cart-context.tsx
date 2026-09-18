"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { CartItem, Product } from "./types";

type CartContextValue = {
  items: CartItem[];
  count: number;
  total: number;
  add: (product: Product, quantity?: number, source?: string) => void;
  setQuantity: (productId: string, quantity: number) => void;
  remove: (productId: string) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem("nowly-cart") || window.localStorage.getItem("local-basket-cart");
    if (saved) {
      try { setItems(JSON.parse(saved)); } catch { /* ignore invalid local demo state */ }
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) window.localStorage.setItem("nowly-cart", JSON.stringify(items));
  }, [items, hydrated]);

  const value = useMemo<CartContextValue>(() => ({
    items,
    count: items.reduce((sum, item) => sum + item.quantity, 0),
    total: items.reduce((sum, item) => sum + item.product.price * item.quantity, 0),
    add(product, quantity = 1, source) {
      setItems((current) => {
        const existing = current.find((item) => item.product.id === product.id);
        if (existing) return current.map((item) => item.product.id === product.id ? { ...item, quantity: item.quantity + quantity } : item);
        return [...current, { product, quantity, source }];
      });
    },
    setQuantity(productId, quantity) {
      if (quantity <= 0) setItems((current) => current.filter((item) => item.product.id !== productId));
      else setItems((current) => current.map((item) => item.product.id === productId ? { ...item, quantity } : item));
    },
    remove(productId) { setItems((current) => current.filter((item) => item.product.id !== productId)); },
    clear() { setItems([]); }
  }), [items]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used inside CartProvider");
  return context;
}
