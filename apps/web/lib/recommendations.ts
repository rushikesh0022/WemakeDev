import { products, searchProducts } from "./catalog";
import type { Product, Suggestion } from "./types";

export type RecommendationResult =
  | { kind: "suggestion"; suggestion: Suggestion; route?: string }
  | { kind: "products"; products: Product[]; title: string; route?: string }
  | { kind: "clarification"; title: string; choices: string[]; route?: string };

export function confidentDirectSearch(query: string): Product[] | null {
  const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (!terms.length || terms.length > 3) return null;
  const strong = searchProducts(query).filter((product) => {
    const searchableName = `${product.name} ${product.subcategory} ${product.brand}`.toLowerCase();
    return terms.every((term) => searchableName.includes(term));
  });
  return strong.length ? strong : null;
}

export function popularFallback(): Product[] {
  return [...products]
    .filter((product) => product.stock > 0)
    .sort((a, b) => (b.rating * Math.log10(b.ratingCount + 10)) - (a.rating * Math.log10(a.ratingCount + 10)))
    .slice(0, 10);
}
