import type { Product } from "@/lib/types";
import { ProductCard } from "./ProductCard";

export function ProductGrid({ products, source }: { products: Product[]; source?: string }) {
  return <div className="product-grid">{products.map((product) => <ProductCard key={product.id} product={product} source={source} />)}</div>;
}
