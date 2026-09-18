import { describe, expect, it } from "vitest";
import { confidentDirectSearch } from "./recommendations";
import { groundPlan, type OpenPlan } from "./ranking";
import { searchProducts } from "./catalog";
import { groceryDatasetProducts } from "./grocery-dataset";

describe("Grocery Store Dataset catalog", () => {
  it("imports one unique product for each of the 81 classes", () => {
    expect(groceryDatasetProducts).toHaveLength(81);
    expect(new Set(groceryDatasetProducts.map((product) => product.id)).size).toBe(81);
  });

  it("finds a fine-grained class through the normal search path", () => {
    expect(searchProducts("granny smith")[0]?.id).toBe("gs-granny-smith");
  });
});

describe("recommendation routing", () => {
  it("routes a clear catalog query without a model", () => {
    expect(confidentDirectSearch("salted chips")?.[0].id).toBe("chips-salted");
  });

  it("does not turn a recipe phrase into a fixed product search", () => {
    expect(confidentDirectSearch("paneer tikka")).toBeNull();
  });
});

describe("dynamic catalog grounding", () => {
  it("grounds free-form needs and excludes spicy products", () => {
    const plan: OpenPlan = {
      title: "A relaxed evening", summary: "A few things to share", people: 3, budget: 350,
      constraints: ["mild"], exclusions: ["spicy"], steps: [],
      requirements: [
        { label: "Savoury snack", retrievalQueries: ["salted chips", "popcorn", "nachos"], priority: .9, confidence: .85, quantity: 1 },
        { label: "Drink", retrievalQueries: ["cola", "juice", "lemonade"], priority: .8, confidence: .8, quantity: 1 }
      ]
    };
    const suggestion = groundPlan(plan, []);
    expect(suggestion.needs).toHaveLength(2);
    expect(suggestion.needs.every((need) => need.product && !need.product.spicy)).toBe(true);
    expect(suggestion.needs.reduce((sum, need) => sum + (need.product?.price ?? 0), 0)).toBeLessThanOrEqual(350);
  });

  it("does not use popularity to admit an unrelated product", () => {
    const plan: OpenPlan = { title: "Unknown", summary: "Unknown", people: null, budget: null, constraints: [], exclusions: [], steps: [], requirements: [{ label: "Astronaut helmet", retrievalQueries: ["space suit helmet"], priority: .9, confidence: .9, quantity: 1 }] };
    expect(groundPlan(plan, []).needs).toHaveLength(0);
  });
});
