import Link from "next/link";
import type { Category } from "@/lib/types";

export function CategoryTile({ category }: { category: Category }) {
  return (
    <Link className="category-tile" href={`/category/${category.id}`}>
      {category.imageProductId ? <img className="category-tile__image" src={`/products/${category.imageProductId}.webp`} alt="" /> : <span className="category-tile__emoji">{category.emoji}</span>}
      <strong>{category.name}</strong>
    </Link>
  );
}
