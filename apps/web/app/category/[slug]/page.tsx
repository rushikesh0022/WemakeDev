import { categories, byCategory } from "@/lib/catalog";
import { ProductGrid } from "@/components/ProductGrid";

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const category = categories.find((entry) => entry.id === slug) ?? categories[0];
  const categoryProducts = byCategory(category.id);
  return (
    <div className="listing-page">
      <header className="listing-header" style={{ background: category.tint }}>{category.imageProductId && <img className="listing-header__image" src={`/products/${category.imageProductId}.webp`} alt="" />}<div><span>{categoryProducts.filter((product) => product.stock > 0).length} PRODUCTS IN STOCK</span><h1>{category.name}</h1><p>{category.description}, selected from the current catalog.</p></div></header>
      <div className="listing-toolbar"><div><button className="active">All</button>{[...new Set(categoryProducts.map((entry) => entry.subcategory))].map((entry) => <button key={entry}>{entry}</button>)}</div><span>{categoryProducts.length} products · Sort: Relevance</span></div>
      <ProductGrid products={categoryProducts} source={category.name} />
    </div>
  );
}
