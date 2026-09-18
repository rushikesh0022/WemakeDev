import type { Product } from "@/lib/types";
export function ProductArt({ product, compact = false }: { product: Product; compact?: boolean }) {
  return (
    <div className={`product-art ${compact ? "product-art--compact" : ""}`} role="img" aria-label={`${product.name} product photo`}>
      <img className="product-art__image" src={`/products/${product.id}.webp`} alt="" loading="lazy" />
    </div>
  );
}
