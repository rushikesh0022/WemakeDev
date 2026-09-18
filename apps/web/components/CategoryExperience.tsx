"use client";

import { useMemo, useState } from "react";
import type { Category, Product } from "@/lib/types";
import { ProductGrid } from "./ProductGrid";

function subcategoryKey(value: string) {
  return value.toLowerCase().trim().replace(/ies$/, "y").replace(/s$/, "");
}

export function CategoryExperience({ category, products }: { category: Category; products: Product[] }) {
  const [activeSubcategory, setActiveSubcategory] = useState("All");
  const subcategories = useMemo(
    () => {
      const groups = new Map<string, { key: string; label: string; count: number }>();
      for (const product of products) {
        const key = subcategoryKey(product.subcategory);
        const current = groups.get(key);
        groups.set(key, current
          ? { ...current, count: current.count + 1 }
          : { key, label: product.subcategory, count: 1 });
      }
      return [...groups.values()].sort((a, b) => a.label.localeCompare(b.label));
    },
    [products]
  );
  const visibleProducts = activeSubcategory === "All"
    ? products
    : products.filter((product) => subcategoryKey(product.subcategory) === activeSubcategory);
  const inStockCount = visibleProducts.filter((product) => product.stock > 0).length;
  const activeLabel = subcategories.find((subcategory) => subcategory.key === activeSubcategory)?.label ?? activeSubcategory;

  return (
    <>
      <header className="listing-header" style={{ background: category.tint }}>
        {category.imageProductId && <img className="listing-header__image" src={`/products/${category.imageProductId}.webp`} alt="" />}
        <div>
          <span>{inStockCount} PRODUCTS IN STOCK</span>
          <h1>{category.name}</h1>
          <p>{category.description}, selected from the current catalog.</p>
        </div>
      </header>

      <div className="listing-toolbar">
        <div className="subcategory-filters" role="group" aria-label={`Filter ${category.name}`}>
          {[{ key: "All", label: "All", count: products.length }, ...subcategories].map((subcategory) => {
            const selected = activeSubcategory === subcategory.key;
            return (
              <button
                type="button"
                key={subcategory.key}
                className={selected ? "active" : ""}
                aria-pressed={selected}
                onClick={() => setActiveSubcategory(subcategory.key)}
              >
                {subcategory.label}<small>{subcategory.count}</small>
              </button>
            );
          })}
        </div>
        <span>{visibleProducts.length} {visibleProducts.length === 1 ? "product" : "products"} · Sort: Relevance</span>
      </div>

      <div aria-live="polite" className="category-results-count">
        Showing {activeSubcategory === "All" ? `all ${visibleProducts.length} products` : `${visibleProducts.length} in ${activeLabel}`}
      </div>
      <ProductGrid products={visibleProducts} source={`${category.name} · ${activeLabel}`} />
    </>
  );
}
