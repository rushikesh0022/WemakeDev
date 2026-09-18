import type { Category, Product } from "./types";
import { groceryDatasetProducts } from "./grocery-dataset";

export const categories: Category[] = [
  { id: "fruits", name: "Fresh Fruits", emoji: "🍎", tint: "#EDF7E7", description: "Orchard-fresh favourites", imageProductId: "gs-pink-lady" },
  { id: "vegetables", name: "Fresh Vegetables", emoji: "🥬", tint: "#E8F6EA", description: "Daily market essentials", imageProductId: "gs-green-bell-pepper" },
  { id: "dairy", name: "Dairy & Yogurt", emoji: "🥛", tint: "#EEF4FF", description: "Milk, yogurt and cultured dairy", imageProductId: "gs-arla-standard-milk" },
  { id: "plant-based", name: "Plant Based", emoji: "🌱", tint: "#EAF7F0", description: "Oat and soy alternatives", imageProductId: "gs-oatly-oat-milk" },
  { id: "drinks", name: "Juices & Drinks", emoji: "🧃", tint: "#FFF3DF", description: "Juices and chilled refreshment", imageProductId: "gs-tropicana-juice-smooth" },
  { id: "munchies", name: "Munchies", emoji: "🍿", tint: "#FFF0D8", description: "Crunch time", imageProductId: "chips-salted" },
  { id: "instant", name: "Instant Food", emoji: "🍜", tint: "#FFE9E4", description: "Ready quickly", imageProductId: "noodles" },
  { id: "bakery", name: "Bakery", emoji: "🥐", tint: "#FFF2DC", description: "Baked daily", imageProductId: "bread" },
  { id: "staples", name: "Atta, Rice & Dal", emoji: "🌾", tint: "#F7F1DE", description: "Pantry staples", imageProductId: "atta" },
  { id: "cooking", name: "Masala & Cooking", emoji: "🫙", tint: "#FFE8CF", description: "Cook better", imageProductId: "tikka-masala" },
  { id: "sweet", name: "Sweet Tooth", emoji: "🍫", tint: "#F7E8F3", description: "Little treats", imageProductId: "chocolate-dark" },
  { id: "personal", name: "Personal Care", emoji: "🧴", tint: "#E7F5F2", description: "Everyday care", imageProductId: "shampoo" },
  { id: "cleaning", name: "Cleaning", emoji: "🧽", tint: "#E8F4FF", description: "Home refresh", imageProductId: "dishwash" },
  { id: "pet", name: "Pet Care", emoji: "🐾", tint: "#F1EAFB", description: "For best friends", imageProductId: "dog-food" }
];

const raw: Array<Omit<Product, "ratingCount" | "stock"> & Partial<Pick<Product, "ratingCount" | "stock">>> = [
  { id:"paneer-200", name:"Fresh Malai Paneer", brand:"Dairy Day", category:"dairy", subcategory:"Paneer", pack:"200 g", price:92, mrp:110, rating:4.7, emoji:"🧀", color:"#D8F0FF", dietary:["Vegetarian"], description:"Soft fresh paneer with a creamy texture, ideal for grilling and curries." },
  { id:"paneer-500", name:"Farm Fresh Paneer", brand:"Milky Mist", category:"dairy", subcategory:"Paneer", pack:"500 g", price:218, mrp:245, rating:4.6, emoji:"🧀", color:"#E8F6FF", dietary:["Vegetarian"], description:"Large family pack of firm fresh paneer." },
  { id:"curd-400", name:"Thick Plain Curd", brand:"Morning Farm", category:"dairy", subcategory:"Curd", pack:"400 g", price:48, mrp:55, rating:4.8, emoji:"🥣", color:"#EAF4FF", dietary:["Vegetarian"], description:"Thick, mildly tangy curd for marinades and everyday meals." },
  { id:"milk-1l", name:"Full Cream Milk", brand:"Morning Farm", category:"dairy", subcategory:"Milk", pack:"1 L", price:68, mrp:72, rating:4.7, emoji:"🥛", color:"#DDEEFF", dietary:["Vegetarian"], description:"Pasteurised full cream milk." },
  { id:"butter-100", name:"Salted Table Butter", brand:"Daily Dairy", category:"dairy", subcategory:"Butter", pack:"100 g", price:58, mrp:62, rating:4.6, emoji:"🧈", color:"#FFF1B8", dietary:["Vegetarian"], description:"Creamy salted butter for toast and cooking." },
  { id:"eggs-6", name:"Farm Fresh Eggs", brand:"Good Nest", category:"dairy", subcategory:"Eggs", pack:"6 pcs", price:64, mrp:72, rating:4.5, emoji:"🥚", color:"#FFF4D9", description:"Clean graded eggs from local farms." },
  { id:"chips-salted", name:"Classic Salted Potato Chips", brand:"Crave", category:"munchies", subcategory:"Chips", pack:"130 g", price:48, mrp:60, rating:4.7, emoji:"🥔", color:"#FFE36E", dietary:["Vegetarian"], description:"Thin and crisp classic salted potato chips." },
  { id:"chips-masala", name:"Masala Crunch Chips", brand:"Crave", category:"munchies", subcategory:"Chips", pack:"120 g", price:50, mrp:60, rating:4.5, emoji:"🌶️", color:"#FFAA7A", dietary:["Vegetarian"], spicy:true, description:"Ridged potato chips with bold Indian masala." },
  { id:"popcorn-butter", name:"Butter Popcorn", brand:"Popjoy", category:"munchies", subcategory:"Popcorn", pack:"90 g", price:75, mrp:90, rating:4.8, emoji:"🍿", color:"#FFE0A1", dietary:["Vegetarian"], description:"Ready-to-eat fluffy popcorn with buttery seasoning." },
  { id:"popcorn-cheese", name:"Cheese Popcorn", brand:"Popjoy", category:"munchies", subcategory:"Popcorn", pack:"85 g", price:82, mrp:95, rating:4.6, emoji:"🍿", color:"#FFD183", dietary:["Vegetarian"], description:"Crunchy popcorn coated in creamy cheese seasoning." },
  { id:"nachos", name:"Sea Salt Nacho Crisps", brand:"Casa Corn", category:"munchies", subcategory:"Nachos", pack:"150 g", price:95, mrp:120, rating:4.5, emoji:"🔺", color:"#FFC86A", dietary:["Vegetarian"], description:"Corn tortilla crisps with sea salt." },
  { id:"makhana", name:"Himalayan Salt Makhana", brand:"Better Bites", category:"munchies", subcategory:"Healthy snacks", pack:"75 g", price:110, mrp:135, rating:4.7, emoji:"⚪", color:"#EADFCB", dietary:["Vegetarian","Gluten free"], description:"Roasted fox nuts with Himalayan pink salt." },
  { id:"cola-zero", name:"Zero Sugar Cola", brand:"FizzUp", category:"drinks", subcategory:"Soft drinks", pack:"1.25 L", price:78, mrp:95, rating:4.6, emoji:"🥤", color:"#C9C5FF", dietary:["Vegetarian","Sugar free"], description:"Chilled cola taste with zero added sugar." },
  { id:"cola-classic", name:"Classic Cola", brand:"FizzUp", category:"drinks", subcategory:"Soft drinks", pack:"1.25 L", price:72, mrp:90, rating:4.5, emoji:"🥤", color:"#D5C1A8", dietary:["Vegetarian"], description:"Sparkling classic cola for sharing." },
  { id:"lemonade", name:"Fresh Lemonade", brand:"Pressed", category:"drinks", subcategory:"Juices", pack:"750 ml", price:105, mrp:125, rating:4.8, emoji:"🍋", color:"#FFF090", dietary:["Vegetarian"], description:"Bright lemonade with real lemon juice." },
  { id:"orange-juice", name:"Orange Juice", brand:"Pressed", category:"drinks", subcategory:"Juices", pack:"1 L", price:138, mrp:165, rating:4.7, emoji:"🍊", color:"#FFD093", dietary:["Vegetarian"], description:"Orange juice with no added preservatives." },
  { id:"sparkling-water", name:"Lime Sparkling Water", brand:"Aqua Pop", category:"drinks", subcategory:"Water", pack:"4 × 250 ml", price:120, mrp:150, rating:4.4, emoji:"🫧", color:"#D8F8F3", dietary:["Vegetarian","Sugar free"], description:"Unsweetened sparkling water with natural lime flavour." },
  { id:"chocolate-dark", name:"55% Dark Chocolate", brand:"Cocoa Room", category:"sweet", subcategory:"Chocolate", pack:"80 g", price:115, mrp:140, rating:4.8, emoji:"🍫", color:"#CFA88B", dietary:["Vegetarian"], description:"Smooth dark chocolate with balanced cocoa notes." },
  { id:"chocolate-milk", name:"Creamy Milk Chocolate", brand:"Cocoa Room", category:"sweet", subcategory:"Chocolate", pack:"90 g", price:95, mrp:115, rating:4.7, emoji:"🍫", color:"#E8B88F", dietary:["Vegetarian"], description:"Silky milk chocolate for easy sharing." },
  { id:"icecream", name:"Vanilla Bean Ice Cream", brand:"Cold Cloud", category:"sweet", subcategory:"Ice cream", pack:"500 ml", price:175, mrp:210, rating:4.8, emoji:"🍨", color:"#FFF0D7", dietary:["Vegetarian"], description:"Creamy vanilla bean ice cream in a shareable tub." },
  { id:"cookies", name:"Choco Chip Cookies", brand:"Bakehouse", category:"sweet", subcategory:"Cookies", pack:"150 g", price:72, mrp:90, rating:4.5, emoji:"🍪", color:"#E8C59E", dietary:["Vegetarian"], description:"Crisp cookies loaded with chocolate chips." },
  { id:"capsicum", name:"Green Capsicum", brand:"Freshly", category:"fruits", subcategory:"Vegetables", pack:"2 pcs · 250–300 g", price:42, mrp:50, rating:4.6, emoji:"🫑", color:"#CDEDC7", dietary:["Vegan"], description:"Firm green capsicum selected for freshness." },
  { id:"onion", name:"Red Onion", brand:"Freshly", category:"fruits", subcategory:"Vegetables", pack:"1 kg", price:46, mrp:55, rating:4.5, emoji:"🧅", color:"#ECD4DF", dietary:["Vegan"], description:"Everyday red onions with balanced pungency." },
  { id:"lemon", name:"Juicy Lemon", brand:"Freshly", category:"fruits", subcategory:"Fruits", pack:"4 pcs", price:32, mrp:40, rating:4.7, emoji:"🍋", color:"#F4F4A7", dietary:["Vegan"], description:"Fresh juicy lemons for cooking and drinks." },
  { id:"tomato", name:"Hybrid Tomato", brand:"Freshly", category:"fruits", subcategory:"Vegetables", pack:"500 g", price:35, mrp:42, rating:4.4, emoji:"🍅", color:"#FFD1C9", dietary:["Vegan"], description:"Firm ripe tomatoes for salads and curries." },
  { id:"banana", name:"Robusta Banana", brand:"Freshly", category:"fruits", subcategory:"Fruits", pack:"6 pcs", price:58, mrp:68, rating:4.7, emoji:"🍌", color:"#FFF1A6", dietary:["Vegan"], description:"Naturally sweet bananas selected for ripeness." },
  { id:"tikka-masala", name:"Tikka Marinade Masala", brand:"Spice Story", category:"cooking", subcategory:"Blended masala", pack:"50 g", price:55, mrp:65, rating:4.7, emoji:"🫙", color:"#F4A77E", dietary:["Vegetarian"], spicy:true, description:"Balanced spice blend for paneer and vegetable tikka." },
  { id:"mild-tikka", name:"Mild Tikka Masala", brand:"Spice Story", category:"cooking", subcategory:"Blended masala", pack:"50 g", price:58, mrp:68, rating:4.6, emoji:"🫙", color:"#E7B18D", dietary:["Vegetarian"], description:"Aromatic tikka blend with gentle heat." },
  { id:"mint-chutney", name:"Fresh Mint Chutney", brand:"Kitchen Jar", category:"cooking", subcategory:"Chutney", pack:"200 g", price:42, mrp:50, rating:4.5, emoji:"🌿", color:"#CBE9CF", dietary:["Vegetarian"], description:"Bright mint and coriander chutney." },
  { id:"oil", name:"Cold Pressed Sunflower Oil", brand:"Pure Drop", category:"cooking", subcategory:"Oil", pack:"1 L", price:162, mrp:185, rating:4.6, emoji:"🌻", color:"#FFE7A1", dietary:["Vegan"], description:"Light cold pressed oil for everyday cooking." },
  { id:"naan", name:"Butter Naan", brand:"Heat & Eat", category:"instant", subcategory:"Ready to eat", pack:"4 pcs", price:92, mrp:110, rating:4.6, emoji:"🫓", color:"#F1D7AA", dietary:["Vegetarian"], description:"Soft butter naan ready in minutes." },
  { id:"noodles", name:"Masala Instant Noodles", brand:"Quick Bowl", category:"instant", subcategory:"Noodles", pack:"4 × 70 g", price:62, mrp:72, rating:4.5, emoji:"🍜", color:"#FFD37C", dietary:["Vegetarian"], spicy:true, description:"Quick-cooking masala noodles." },
  { id:"pasta", name:"Durum Wheat Penne", brand:"Pasta Casa", category:"instant", subcategory:"Pasta", pack:"500 g", price:105, mrp:130, rating:4.7, emoji:"🍝", color:"#FFE3A7", dietary:["Vegetarian"], description:"Durum wheat penne with a firm bite." },
  { id:"bread", name:"Whole Wheat Bread", brand:"Bakehouse", category:"bakery", subcategory:"Bread", pack:"400 g", price:52, mrp:58, rating:4.6, emoji:"🍞", color:"#EAC99D", dietary:["Vegetarian"], description:"Soft whole wheat sliced bread." },
  { id:"croissant", name:"Butter Croissants", brand:"Bakehouse", category:"bakery", subcategory:"Pastries", pack:"4 pcs", price:145, mrp:170, rating:4.8, emoji:"🥐", color:"#F4D6A1", dietary:["Vegetarian"], description:"Flaky butter croissants baked fresh." },
  { id:"atta", name:"Stoneground Whole Wheat Atta", brand:"Earth Mill", category:"staples", subcategory:"Atta", pack:"5 kg", price:285, mrp:330, rating:4.7, emoji:"🌾", color:"#E8D5AE", dietary:["Vegan"], description:"Stoneground whole wheat flour for soft rotis." },
  { id:"rice", name:"Everyday Basmati Rice", brand:"Grain House", category:"staples", subcategory:"Rice", pack:"5 kg", price:465, mrp:540, rating:4.6, emoji:"🍚", color:"#F1E9D3", dietary:["Vegan","Gluten free"], description:"Aromatic long-grain basmati for everyday meals." },
  { id:"dal", name:"Unpolished Toor Dal", brand:"Grain House", category:"staples", subcategory:"Dal", pack:"1 kg", price:168, mrp:190, rating:4.7, emoji:"🫘", color:"#F4DE9F", dietary:["Vegan","Gluten free"], description:"Clean unpolished toor dal rich in protein." },
  { id:"oats", name:"Rolled Oats", brand:"Morning Bowl", category:"staples", subcategory:"Breakfast cereal", pack:"500 g", price:135, mrp:160, rating:4.8, emoji:"🥣", color:"#E9DAB6", dietary:["Vegetarian"], description:"Wholegrain rolled oats for breakfast bowls." },
  { id:"shampoo", name:"Gentle Daily Shampoo", brand:"Soft Kind", category:"personal", subcategory:"Hair care", pack:"300 ml", price:185, mrp:220, rating:4.5, emoji:"🧴", color:"#CDEBEA", description:"Mild cleansing shampoo for daily use." },
  { id:"soap", name:"Aloe Bathing Bar", brand:"Soft Kind", category:"personal", subcategory:"Bath", pack:"4 × 100 g", price:142, mrp:168, rating:4.6, emoji:"🧼", color:"#CDEDDC", description:"Refreshing aloe bathing bars." },
  { id:"toothpaste", name:"Fresh Mint Toothpaste", brand:"Bright", category:"personal", subcategory:"Oral care", pack:"150 g", price:98, mrp:115, rating:4.7, emoji:"🪥", color:"#D4F2EE", description:"Everyday fluoride toothpaste with fresh mint." },
  { id:"dishwash", name:"Lemon Dishwash Gel", brand:"Clear Home", category:"cleaning", subcategory:"Dish care", pack:"750 ml", price:115, mrp:135, rating:4.7, emoji:"🫧", color:"#DDF3C4", description:"Concentrated lemon dishwashing gel." },
  { id:"floor", name:"Citrus Floor Cleaner", brand:"Clear Home", category:"cleaning", subcategory:"Floor care", pack:"1 L", price:142, mrp:165, rating:4.5, emoji:"🧹", color:"#CDEAE9", description:"Fresh citrus floor cleaner for everyday use." },
  { id:"tissues", name:"Soft Facial Tissues", brand:"Cloud Soft", category:"cleaning", subcategory:"Paper", pack:"100 pulls", price:78, mrp:95, rating:4.6, emoji:"🧻", color:"#E8E8F7", description:"Soft two-ply facial tissues." },
  { id:"dog-food", name:"Chicken Adult Dog Food", brand:"Happy Paws", category:"pet", subcategory:"Dog food", pack:"1.2 kg", price:385, mrp:430, rating:4.7, emoji:"🐶", color:"#E2D7F3", description:"Complete dry food for adult dogs." },
  { id:"cat-food", name:"Ocean Fish Cat Food", brand:"Happy Paws", category:"pet", subcategory:"Cat food", pack:"1 kg", price:365, mrp:410, rating:4.6, emoji:"🐱", color:"#D9D5EF", description:"Balanced ocean fish dry food for adult cats." }
];

export const products: Product[] = [...raw.map((product, index) => ({
  ...product,
  ratingCount: product.ratingCount ?? 120 + ((index * 137) % 2200),
  stock: product.stock ?? 4 + ((index * 11) % 38)
})), ...groceryDatasetProducts];

export const byId = (id: string) => products.find((product) => product.id === id);
export const byCategory = (category: string) => products.filter((product) => product.category === category);

export function popularProducts(limit = 10) {
  return [...products]
    .filter((product) => product.stock > 0)
    .sort((a, b) => (b.rating * Math.log10(b.ratingCount + 10)) - (a.rating * Math.log10(a.ratingCount + 10)))
    .slice(0, limit);
}

export function categoryLeaders(limit = 10) {
  return categories
    .map((category) => byCategory(category.id).filter((product) => product.stock > 0).sort((a, b) => b.rating - a.rating || b.stock - a.stock)[0])
    .filter((product): product is Product => Boolean(product))
    .slice(0, limit);
}

export function searchProducts(query: string, historyIds: string[] = []) {
  const normalized = query.toLowerCase().trim();
  const terms = normalized.split(/[^a-z0-9]+/).filter((term) => term.length > 1);
  const history = products.filter((product) => historyIds.includes(product.id));
  return products
    .map((product) => {
      const name = product.name.toLowerCase();
      const brand = product.brand.toLowerCase();
      const taxonomy = `${product.category} ${product.subcategory}`.toLowerCase();
      const detail = `${product.description} ${(product.dietary ?? []).join(" ")}`.toLowerCase();
      const lexical = terms.reduce((total, term) => {
        const exact = name.split(/\s+/).includes(term) ? 4 : 0;
        const prefix = name.split(/\s+/).some((word) => word.startsWith(term)) ? 2.4 : 0;
        const brandHit = brand.includes(term) ? 1.7 : 0;
        const categoryHit = taxonomy.includes(term) ? 1.35 : 0;
        const detailHit = detail.includes(term) ? .55 : 0;
        return total + exact + prefix + brandHit + categoryHit + detailHit;
      }, name.includes(normalized) ? 7 : 0);
      const popularity = (product.rating / 5) * .65 + Math.min(1, Math.log10(product.ratingCount + 1) / 3.5) * .35;
      const personal = history.some((past) => past.category === product.category || past.brand === product.brand) ? 1 : 0;
      const score = lexical * .72 + popularity * .16 + personal * .08 + (product.stock > 0 ? .04 : -10);
      return { product, score };
    })
    .filter(({ score, product }) => product.stock > 0 && (terms.length === 0 || score > .25))
    .sort((a, b) => b.score - a.score || b.product.ratingCount - a.product.ratingCount)
    .map(({ product }) => product);
}
