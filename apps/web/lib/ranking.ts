import { products } from "./catalog";
import type { Need, Product, Suggestion } from "./types";

export type OpenRequirement = { label: string; retrievalQueries: string[]; priority: number; confidence: number; quantity: number | null };
export type OpenPlan = { title: string; summary: string; people: number | null; budget: number | null; constraints: string[]; exclusions: string[]; requirements: OpenRequirement[]; steps: string[] };

const STOP = new Set(["a","an","and","for","of","the","to","with","some","item","product","needed","need"]);
function terms(text: string) { return text.toLowerCase().replace(/[^a-z0-9\s]/g," ").split(/\s+/).filter((term) => term.length > 1 && !STOP.has(term)); }
function productTerms(product: Product) { return terms(`${product.name} ${product.brand} ${product.category} ${product.subcategory} ${product.description} ${(product.dietary??[]).join(" ")}`); }
function related(left:string,right:string){return left===right||(left.length>4&&right.length>4&&(left.startsWith(right.slice(0,5))||right.startsWith(left.slice(0,5))));}

function score(product: Product, requirement: OpenRequirement, history: Product[], exclusions: string[]) {
  const haystack=productTerms(product);
  const relevance=Math.max(...requirement.retrievalQueries.map((query)=>{const requested=terms(`${requirement.label} ${query}`);const overlap=requested.filter((term)=>haystack.some((candidate)=>related(term,candidate))).length;return overlap/Math.max(1,requested.length);}),0);
  const publicOpinion=(product.rating/5)*.65+(Math.log10(product.ratingCount+1)/4)*.35;
  const personal=history.length ? history.filter((past)=>past.category===product.category||past.brand===product.brand).length/history.length : .5;
  const excluded=exclusions.some((value)=>value.toLowerCase().includes("spicy"))&&product.spicy;
  return { relevance, total: excluded || product.stock<1 ? -1 : relevance*.62+publicOpinion*.25+personal*.13 };
}

export function groundPlan(plan: OpenPlan, historyIds: string[]): Suggestion {
  const history=products.filter((product)=>historyIds.includes(product.id));
  const needs: Need[]=plan.requirements.slice(0,10).map((requirement,index)=>{
    const ranked=products.map((product)=>({product,...score(product,requirement,history,plan.exclusions)})).filter((entry)=>entry.relevance>.07&&entry.total>0).sort((a,b)=>b.total-a.total||a.product.price-b.product.price).slice(0,4).map((entry)=>entry.product);
    return {id:`need-${index}`,label:requirement.label,description:requirement.retrievalQueries[0]??requirement.label,required:requirement.priority>=.65,product:ranked[0]??null,alternatives:ranked.slice(1)};
  }).filter((need)=>need.product);
  let running=0;
  const budget=plan.budget;
  const optimized=needs.map((need)=>{
    if(!budget||!need.product) return need;
    const candidates=[need.product,...need.alternatives];
    const chosen=running+need.product.price<=budget
      ? need.product
      : candidates.find((candidate)=>running+candidate.price<=budget)??need.product;
    if(need.required) running+=chosen.price;
    return {...need,product:chosen,alternatives:candidates.filter((candidate)=>candidate.id!==chosen.id)};
  });
  const used=new Set(optimized.flatMap((need)=>need.product?[need.product.id,...need.alternatives.map((item)=>item.id)]:[]));
  const additions=products.filter((product)=>!used.has(product.id)&&product.stock>0).sort((a,b)=>b.rating-a.rating).slice(0,3);
  return {id:`dynamic-${Date.now()}`,title:plan.title,eyebrow:"Built around your request",description:plan.summary,people:plan.people??undefined,budget:plan.budget??undefined,constraints:plan.constraints,needs:optimized,additions,steps:plan.steps.length?plan.steps:undefined};
}
