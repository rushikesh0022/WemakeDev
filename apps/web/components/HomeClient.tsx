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
        <img className="zaply-hero-art" src="/campaigns/pico-market-tote.png" alt="A coral market tote filled with fresh groceries" />
        <div className="commerce-hero__shade" />
        <div className="commerce-hero__copy">
          <span><Sparkles size={14} /> Fresh essentials, delivered quickly</span>
          <h1>Good things<br /><em>arrive faster.</em></h1>
          <p>Search the live store, build a complete basket, or invite friends to choose and pay for their items.</p>
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
          <div><span>SMART BASKETS</span><h2>One search.<br />A complete basket.</h2><p>Describe the outcome and keep only the items you want.</p><button onClick={() => document.querySelector<HTMLInputElement>(".global-search input")?.focus()}>Plan my basket <ArrowRight size={17} /></button></div>
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

      <section className="nowly-story"><div><span>SHOP TOGETHER</span><h2>Your basket, everyone’s choice.</h2></div><p>Pico understands the plan, retrieves real in-stock products, and lets everyone choose their own items before checkout.</p></section>
    </div>
  );
}
