"use client";

import Link from "next/link";
import { ArrowRight, Home, LayoutGrid, Leaf, Package, Search, ShoppingBag, Sparkles, UserRound } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";
import { useCart } from "@/lib/cart-context";
import { searchProducts } from "@/lib/catalog";
import { LocationPicker } from "./LocationPicker";
import { NestoIntro } from "./NestoIntro";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const { count, total } = useCart();
  const isAdmin = pathname.startsWith("/admin");
  const suggestions = useMemo(() => query.trim().length > 1 ? searchProducts(query).slice(0, 5) : [], [query]);

  function submit(event: FormEvent) {
    event.preventDefault();
    if (query.trim()) { setSearchOpen(false); router.push(`/search?q=${encodeURIComponent(query.trim())}`); }
  }

  if (isAdmin) return <>{children}</>;

  return (
    <div className="app-shell">
      <NestoIntro />
      <header className="topbar">
        <div className="topbar__inner">
          <Link href="/" className="brand-mark" aria-label="Zaply home"><span className="brand-mark__bolt"><Leaf fill="currentColor" /></span><span>zaply</span></Link>
          <LocationPicker />
          <form className="global-search" onSubmit={submit} role="search" onFocus={() => setSearchOpen(true)}>
            <Search size={19} />
            <input value={query} onChange={(event) => { setQuery(event.target.value); setSearchOpen(true); }} placeholder="Search milk, snacks or ‘movie night’" aria-label="Search products or describe what you need" />
            <button className="search-submit" aria-label="Search"><Search size={18} /></button>
            {searchOpen && query.trim().length > 1 && <div className="search-suggest" role="listbox">
              <div className="search-suggest__label">BEST MATCHES</div>
              {suggestions.map((product) => <button type="button" className="search-suggest__item" key={product.id} onClick={() => { setQuery(product.name); setSearchOpen(false); router.push(`/search?q=${encodeURIComponent(product.name)}`); }}><img src={`/products/${product.id}.webp`} alt="" /><span><strong>{product.name}</strong><small>{product.brand} · {product.subcategory}</small></span><b>₹{product.price}</b></button>)}
              <button type="button" className="search-suggest__ai" onClick={() => { setSearchOpen(false); router.push(`/search?q=${encodeURIComponent(query.trim())}&mode=ai`); }}><span><Sparkles size={18} /><b>Build a smart basket</b><small>Turn “{query.trim()}” into an editable shopping plan</small></span><ArrowRight size={18} /></button>
            </div>}
          </form>
          <nav className="desktop-actions">
            <Link href="/account"><UserRound size={19} /><span>Account</span></Link>
            <Link href="/cart" className="cart-link"><ShoppingBag size={20} /><span>{count ? `${count} · ₹${total}` : "Cart"}</span></Link>
          </nav>
        </div>
      </header>
      <main>{children}</main>
      {count > 0 && pathname !== "/cart" && pathname !== "/checkout" && (
        <Link className="floating-cart" href="/cart"><span><ShoppingBag size={18} /> {count} {count === 1 ? "item" : "items"}</span><strong>₹{total} · View cart</strong></Link>
      )}
      <nav className="mobile-nav" aria-label="Primary navigation">
        <Link href="/" className={pathname === "/" ? "active" : ""}><Home /><span>Home</span></Link>
        <Link href="/#categories" className={pathname.startsWith("/category") ? "active" : ""}><LayoutGrid /><span>Categories</span></Link>
        <Link href="/search" className={pathname.startsWith("/search") ? "active" : ""}><Search /><span>Search</span></Link>
        <Link href="/cart" className={pathname === "/cart" ? "active" : ""}><Package /><span>Cart</span></Link>
        <Link href="/account" className={pathname.startsWith("/account") ? "active" : ""}><UserRound /><span>Account</span></Link>
      </nav>
    </div>
  );
}
