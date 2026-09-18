import { categories, byCategory } from "@/lib/catalog";
import { CategoryExperience } from "@/components/CategoryExperience";

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const category = categories.find((entry) => entry.id === slug) ?? categories[0];
  const categoryProducts = byCategory(category.id);
  return (
    <div className="listing-page">
      <CategoryExperience category={category} products={categoryProducts} />
    </div>
  );
}
