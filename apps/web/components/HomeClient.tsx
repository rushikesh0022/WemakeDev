"use client";

import { ArrowRight, BadgePercent, Clock3, ShieldCheck, Sparkles, Truck } from "lucide-react";
import { useRouter } from "next/navigation";
import { categories, categoryLeaders, popularProducts, products } from "@/lib/catalog";
import { store } from "@/lib/store";
import { CategoryTile } from "./CategoryTile";
import { ProductGrid } from "./ProductGrid";
import { Section } from "./Section";

export function HomeClient() {
  const router = useRouter();

  return (
    <div className="home-page nowly-home">
      <section className="commerce-hero">
        <img className="zaply-hero-art" src="/campaigns/zaply-3d-bag.png" alt="A green Zaply shopping bag filled with fresh groceries" />
        <div className="commerce-hero__shade" />
        <div className="commerce-hero__copy">
          <span><Sparkles size={14} /> Fresh essentials, delivered quickly</span>
          <h1>Good things<br /><em>arrive faster.</em></h1>
          <p>Search the catalog from the single bar above. Zaply ranks the best match first, then can turn the same request into a complete editable basket.</p>
          <button className="hero-browse" onClick={() => document.querySelector<HTMLInputElement>(".global-search input")?.focus()}>Start shopping <ArrowRight size={18} /></button>
        </div>
        <div className="commerce-hero__eta"><Clock3 /><span><strong>{store.eta}</strong><small>estimated delivery</small></span></div>
      </section>

      <section className="benefit-rail" aria-label="Shopping benefits">
        <div><Truck /><span><strong>Fast delivery</strong><small>From nearby inventory</small></span></div>
        <div><BadgePercent /><span><strong>Live prices</strong><small>Totals update instantly</small></span></div>
        <div><ShieldCheck /><span><strong>Your choice</strong><small>Edit every recommendation</small></span></div>
      </section>

      <div id="categories" className="category-section"><Section title="Shop by category" eyebrow={`${categories.length} departments`}>
        <div className="category-grid category-grid--photo">{categories.map((category) => <CategoryTile key={category.id} category={category} />)}</div>
      </Section></div>

      <section className="campaign-split">
        <article className="campaign-card campaign-card--smart">
          <div><span>ZAPLY AI</span><h2>One search.<br />A complete basket.</h2><p>Describe the outcome and keep only the items you want.</p><button onClick={() => document.querySelector<HTMLInputElement>(".global-search input")?.focus()}>Try smart search <ArrowRight size={17} /></button></div>
        </article>
        <article className="campaign-card campaign-card--snack">
          <img src="/campaigns/nowly-snack-run.jpg" alt="A colorful tote filled with snacks and refreshments" />
          <div><span>FAST PICKS</span><h2>Snacks, chilled drinks, and more.</h2><button onClick={() => router.push("/category/munchies")}>Shop the aisle <ArrowRight size={17} /></button></div>
        </article>
      </section>

      <Section title="Trending around you" eyebrow={`${products.length} live products`}>
        <ProductGrid products={popularProducts(12)} source="Trending around you" />
      </Section>

      <Section title="Fresh picks from every aisle" eyebrow="Top rated and in stock">
        <ProductGrid products={categoryLeaders(12)} source="Fresh picks" />
      </Section>

      <section className="nowly-story"><div><span>SHOP THE PLAN</span><h2>The search bar is the new aisle.</h2></div><p>Zaply understands what you are trying to do, retrieves only relevant products, then lets you swap, remove, or add before anything reaches the cart.</p></section>
    </div>
  );
}
