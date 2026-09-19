"use client";

import Link from "next/link";
import { ArrowRight, BadgePercent, Clock3, ShieldCheck, Sparkles, Truck, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { categories, categoryLeaders, popularProducts, products } from "@/lib/catalog";
import { store } from "@/lib/store";
import { CategoryTile } from "./CategoryTile";
import { ProductGrid } from "./ProductGrid";
import { Section } from "./Section";

export function HomeClient() {
  const router = useRouter();

  return (
    <div className="home-page nowly-home nesto-home">
      <section className="commerce-hero">
        <img className="zaply-hero-art" src="/nesto/home-market.webp" alt="A Nesto grocery tote and electric delivery scooter" />
        <div className="commerce-hero__shade" />
        <div className="commerce-hero__copy">
          <span><Sparkles size={14} /> Your neighbourhood store</span>
          <h1>Everything you need.<br /><em>Almost already there.</em></h1>
          <p>Groceries, cravings and complete plans from nearby shelves—delivered in minutes.</p>
          <button className="hero-browse" onClick={() => document.querySelector<HTMLInputElement>(".global-search input")?.focus()}>Find something <ArrowRight size={18} /></button>
          <div className="hero-prompts"><Link href="/search?q=movie%20night%20for%204&mode=ai">Movie night for 4</Link><Link href="/search?q=quick%20paneer%20dinner&mode=ai">Quick paneer dinner</Link></div>
        </div>
        <div className="commerce-hero__eta"><Clock3 /><span><strong>{store.eta}</strong><small>estimated delivery</small></span></div>
      </section>

      <section className="benefit-rail" aria-label="Shopping benefits">
        <div><Truck /><span><strong>10-minute delivery</strong><small>From a nearby dark store</small></span></div>
        <div><BadgePercent /><span><strong>Live prices</strong><small>Totals update instantly</small></span></div>
        <div><ShieldCheck /><span><strong>Your choice</strong><small>Edit every smart basket</small></span></div>
      </section>

      <div id="categories" className="category-section"><Section title="Shop by category" eyebrow={`${categories.length} departments`}>
        <div className="category-grid category-grid--photo">{categories.map((category) => <CategoryTile key={category.id} category={category} />)}</div>
      </Section></div>

      <section className="campaign-split">
        <article className="campaign-card campaign-card--smart">
          <div><span>SMART BASKETS</span><h2>Say the plan.<br />We’ll find the basket.</h2><p>One search understands the outcome, checks stock and leaves every choice editable.</p><button onClick={() => document.querySelector<HTMLInputElement>(".global-search input")?.focus()}>Try a smart search <ArrowRight size={17} /></button></div>
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

      <section className="nowly-story"><div><span><Users size={15} /> SHOP TOGETHER</span><h2>Send the basket.<br />Everyone picks their part.</h2></div><p>Nesto creates one private link. Friends claim products, pay their own merchant share with Amazon Pay, and the owner places one delivery order after every payment is verified.</p><Link href="/cart">Start from your cart <ArrowRight /></Link></section>
    </div>
  );
}
