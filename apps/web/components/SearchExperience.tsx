"use client";

import { ArrowRight, Filter, SlidersHorizontal, Sparkles } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { popularFallback, type RecommendationResult } from "@/lib/recommendations";
import { searchProducts } from "@/lib/catalog";
import { useCart } from "@/lib/cart-context";
import { ProductGrid } from "./ProductGrid";
import { SuggestionExperience } from "./SuggestionExperience";

export function SearchExperience() {
  const params = useSearchParams();
  const initial = params.get("q") ?? "";
  const mode = params.get("mode");
  const [submitted, setSubmitted] = useState(initial);
  const [result, setResult] = useState<RecommendationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { items } = useCart();

  async function plan(value: string) {
    const cleaned = value.trim();
    if (!cleaned) return;
    setSubmitted(cleaned); setError("");
    setLoading(true); setResult(null);
    try {
      const response = await fetch("/api/recommend", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ query: cleaned, historyIds: items.map((item) => item.product.id) }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.hint || data.error || "Recommendation service is unavailable");
      setResult(data);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Recommendation service is unavailable");
      setResult({ kind: "products", products: popularFallback(), title: "Popular products while the planner is offline", route: "safe_fallback" });
    } finally { setLoading(false); }
  }

  useEffect(() => {
    if (!initial) return;
    const matches = searchProducts(initial, items.map((item) => item.product.id));
    setSubmitted(initial);
    setResult({ kind: "products", products: matches.length ? matches : popularFallback(), title: matches.length ? `Results for “${initial}”` : `Popular picks near “${initial}”`, route: "hybrid_catalog" });
    if (mode === "ai") void plan(initial);
  }, [initial, mode]);

  return (
    <div className="search-page">
      {!result && !loading && <div className="search-empty"><div>⌕</div><h1>What do you need today?</h1><p>Search for a product, or describe the outcome and let Zaply build an editable basket.</p></div>}
      {loading && <section className="planner-loading"><div className="planner-loading__pulse" /><span>UNDERSTANDING YOUR REQUEST</span><h1>Building a grounded plan…</h1><p>The planner is finding needs first, then matching only products in this store.</p></section>}
      {error && <div className="planner-notice"><strong>AI planner is temporarily unavailable.</strong><span>{error}</span></div>}
      {result?.kind === "suggestion" && <SuggestionExperience suggestion={result.suggestion} />}
      {result?.kind === "products" && <><section className="catalog-results"><header><div><span>HYBRID CATALOG SEARCH</span><h1>{result.title}</h1><p>{result.products.length} in-stock matches ranked by relevance, popularity and your cart history</p></div><div><button><Filter size={16} /> Filters</button><button><SlidersHorizontal size={16} /> Best match</button></div></header><ProductGrid products={result.products} source={`Search: ${submitted}`} /></section><section className="ai-search-bridge"><div className="ai-search-bridge__icon"><Sparkles /></div><div><span>SMART BASKET</span><h2>Need the whole plan instead?</h2><p>Use this same search to build an editable basket for a recipe, occasion or goal.</p></div><button onClick={() => void plan(submitted)}>Plan this basket <ArrowRight size={17} /></button></section></>}
      {result?.kind === "clarification" && <section className="clarification-card"><span>ONE QUICK CHECK</span><h1>{result.title}</h1><p>Your request could lead to very different baskets. Choose a direction so we do not fill the page with weak matches.</p>{result.choices.map((choice) => <button key={choice} onClick={() => void plan(choice)}>{choice} →</button>)}</section>}
    </div>
  );
}
