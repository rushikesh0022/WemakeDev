export type Category = {
  id: string;
  name: string;
  emoji: string;
  tint: string;
  description: string;
  imageProductId?: string;
};

export type Product = {
  id: string;
  name: string;
  brand: string;
  category: string;
  subcategory: string;
  pack: string;
  price: number;
  mrp: number;
  rating: number;
  ratingCount: number;
  stock: number;
  emoji: string;
  color: string;
  dietary?: string[];
  spicy?: boolean;
  description: string;
};

export type CartItem = {
  product: Product;
  quantity: number;
  source?: string;
};

export type Need = {
  id: string;
  label: string;
  description: string;
  required: boolean;
  product: Product | null;
  alternatives: Product[];
};

export type Suggestion = {
  id: string;
  title: string;
  eyebrow: string;
  description: string;
  people?: number;
  budget?: number;
  minutes?: number;
  constraints: string[];
  needs: Need[];
  additions: Product[];
  steps?: string[];
};
