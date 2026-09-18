#!/usr/bin/env python3
"""Import one iconic image for every GroceryStoreDataset fine-grained class."""

from __future__ import annotations

import argparse
import json
import re
from pathlib import Path

from PIL import Image, ImageOps


def slug(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")


def display(value: str) -> str:
    return value.replace("-", " ").replace("Yoghurt", "Yogurt").title()


def classify(parts: tuple[str, ...]) -> tuple[str, str, str, list[str]]:
    root = parts[0]
    family = parts[-2] if len(parts) > 2 else parts[1]
    if root == "Fruit":
        return "fruits", display(family), "Fresh produce", ["Vegan", "Vegetarian"]
    if root == "Vegetables":
        return "vegetables", display(family), "Fresh produce", ["Vegan", "Vegetarian"]
    if family == "Juice":
        return "drinks", "Juice", "Packaged beverage", ["Vegan", "Vegetarian"]
    if family == "Milk":
        return "dairy", "Milk", "Chilled dairy", ["Vegetarian"]
    if family in {"Oat-Milk", "Soy-Milk"}:
        return "plant-based", display(family), "Plant-based drink", ["Vegan", "Vegetarian"]
    if family in {"Oatghurt", "Soyghurt"}:
        return "plant-based", display(family), "Plant-based yogurt", ["Vegan", "Vegetarian"]
    return "dairy", display(family), "Chilled dairy", ["Vegetarian"]


def brand_and_name(class_name: str) -> tuple[str, str]:
    brands = ("Arla", "Alpro", "Bravo", "Garant", "God-Morgon", "Oatly", "Tropicana", "Valio", "Yoggi")
    for brand in brands:
        if class_name.startswith(f"{brand}-"):
            return display(brand), display(class_name[len(brand) + 1 :])
    return "Fresh Harvest", display(class_name)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--source", type=Path, required=True)
    parser.add_argument("--web", type=Path, required=True)
    args = parser.parse_args()

    source = args.source / "dataset" / "iconic-images-and-descriptions"
    assets = args.web / "public" / "products"
    output = args.web / "lib" / "grocery-dataset.ts"
    assets.mkdir(parents=True, exist_ok=True)

    files = sorted(source.rglob("*_Iconic.jpg"))
    if len(files) != 81:
        raise SystemExit(f"Expected 81 iconic class images, found {len(files)}")

    products = []
    for index, image_path in enumerate(files):
        relative = image_path.relative_to(source)
        class_name = image_path.stem.removesuffix("_Iconic")
        product_id = f"gs-{slug(class_name)}"
        category, subcategory, kind, dietary = classify(relative.parent.parts)
        brand, name = brand_and_name(class_name)

        image = Image.open(image_path).convert("RGB")
        contained = ImageOps.contain(image, (570, 570), Image.Resampling.LANCZOS)
        canvas = Image.new("RGB", (640, 640), (248, 250, 247))
        canvas.paste(contained, ((640 - contained.width) // 2, (640 - contained.height) // 2))
        canvas.save(assets / f"{product_id}.webp", "WEBP", quality=90, method=6)

        base_price = 24 + ((index * 19) % 177)
        price = int(round(base_price / 5) * 5)
        mrp = int(round((price * (1.08 + (index % 5) * 0.025)) / 5) * 5)
        products.append({
            "id": product_id,
            "name": name,
            "brand": brand,
            "category": category,
            "subcategory": subcategory,
            "pack": "1 unit" if category in {"fruits", "vegetables"} else "1 pack",
            "price": price,
            "mrp": max(price + 5, mrp),
            "rating": round(4.1 + ((index * 7) % 8) / 10, 1),
            "ratingCount": 80 + ((index * 173) % 2400),
            "stock": 5 + ((index * 13) % 42),
            "emoji": "🥬" if category == "vegetables" else "🍎" if category == "fruits" else "🥛" if category in {"dairy", "plant-based"} else "🧃",
            "color": "#EFF7E9" if category in {"fruits", "vegetables"} else "#EEF4F7",
            "dietary": dietary,
            "description": f"{kind} from the Grocery Store Dataset, represented by its iconic class image.",
        })

    header = 'import type { Product } from "./types";\n\n'
    body = "export const groceryDatasetProducts: Product[] = " + json.dumps(products, ensure_ascii=False, indent=2) + ";\n"
    output.write_text(header + body, encoding="utf-8")
    print(f"Imported {len(products)} classes into {output}")


if __name__ == "__main__":
    main()
