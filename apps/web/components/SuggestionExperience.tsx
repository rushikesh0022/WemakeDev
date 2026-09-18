"use client";

import { Check, ChevronDown, Clock3, Minus, Plus, RotateCcw, Sparkles, UsersRound, X } from "lucide-react";
import { useMemo, useState } from "react";
import { useCart } from "@/lib/cart-context";
import type { Need, Product, Suggestion } from "@/lib/types";
import { ProductArt } from "./ProductArt";
import { ProductCard } from "./ProductCard";

type Selection = { need: Need; product: Product; quantity: number; selected: boolean; reason?: "owned" | "removed" };

export function SuggestionExperience({ suggestion }: { suggestion: Suggestion }) {
  const { add } = useCart();
  const [selections, setSelections] = useState<Selection[]>(() => suggestion.needs.filter((entry) => entry.product).map((entry) => ({ need: entry, product: entry.product!, quantity: 1, selected: entry.required })));
  const [notice, setNotice] = useState("");
  const [openAlternative, setOpenAlternative] = useState<string | null>(null);
  const selected = selections.filter((entry) => entry.selected);
  const total = selected.reduce((sum, entry) => sum + entry.product.price * entry.quantity, 0);
  const withinBudget = !suggestion.budget || total <= suggestion.budget;

  const selectedIds = useMemo(() => new Set(selections.map((entry) => entry.product.id)), [selections]);

  function update(id: string, update: Partial<Selection>) {
    setSelections((current) => current.map((entry) => entry.need.id === id ? { ...entry, ...update } : entry));
  }

  function chooseAlternative(selection: Selection, alternative: Product) {
    update(selection.need.id, { product: alternative, selected: true, reason: undefined });
    setOpenAlternative(null);
  }

  function transfer() {
    selected.forEach((entry) => add(entry.product, entry.quantity, suggestion.title));
    setNotice(`${selected.length} selections added to your cart`);
    window.setTimeout(() => setNotice(""), 3200);
  }

  return (
    <div className="suggestion-page">
      <section className="suggestion-hero">
        <div>
          <div className="eyebrow"><Sparkles size={14} /> {suggestion.eyebrow}</div>
          <h1>{suggestion.title}</h1>
          <p>{suggestion.description}</p>
          <div className="constraint-row">
            {suggestion.people && <button><UsersRound size={15} /> {suggestion.people} people <ChevronDown size={14} /></button>}
            {suggestion.minutes && <span><Clock3 size={15} /> {suggestion.minutes} min</span>}
            {suggestion.constraints.map((constraint) => <span key={constraint}>{constraint}</span>)}
          </div>
        </div>
        <button className="interpretation-button"><RotateCcw size={15} /> Not what you meant?</button>
      </section>

      <div className="suggestion-layout">
        <section className="basket-panel">
          <div className="basket-panel__heading">
            <div><span>YOUR SUGGESTED BASKET</span><h2>Everything in one place</h2></div>
            <small>{selected.length} of {selections.length} selected</small>
          </div>
          <div className="need-list">
            {selections.map((selection) => (
              <div className={`need-row ${selection.selected ? "is-selected" : ""}`} key={selection.need.id}>
                <button className="select-toggle" onClick={() => update(selection.need.id, { selected: !selection.selected, reason: selection.selected ? "removed" : undefined })} aria-label={`${selection.selected ? "Remove" : "Select"} ${selection.product.name}`}>
                  {selection.selected ? <Check size={16} /> : <Plus size={16} />}
                </button>
                <ProductArt product={selection.product} compact />
                <div className="need-row__copy">
                  <span>{selection.need.label}{selection.need.required && <b>Essential</b>}</span>
                  <strong>{selection.product.name}</strong>
                  <small>{selection.product.pack} · {selection.need.description}</small>
                  <div className="need-row__actions">
                    {selection.need.alternatives.length > 0 && <button onClick={() => setOpenAlternative(openAlternative === selection.need.id ? null : selection.need.id)}>Change product</button>}
                    <button onClick={() => update(selection.need.id, { selected: false, reason: "owned" })}>I already have this</button>
                  </div>
                </div>
                <div className="need-row__end">
                  <strong>₹{selection.product.price * selection.quantity}</strong>
                  <div className="stepper stepper--quiet">
                    <button onClick={() => update(selection.need.id, { quantity: Math.max(1, selection.quantity - 1) })}><Minus size={14} /></button>
                    <span>{selection.quantity}</span>
                    <button onClick={() => update(selection.need.id, { quantity: selection.quantity + 1, selected: true })}><Plus size={14} /></button>
                  </div>
                </div>
                {selection.reason === "owned" && <div className="need-row__status">Marked as already at home <button onClick={() => update(selection.need.id, { selected: true, reason: undefined })}>Undo</button></div>}
                {openAlternative === selection.need.id && (
                  <div className="alternative-strip">
                    <div className="alternative-strip__title"><strong>Choose a replacement</strong><button onClick={() => setOpenAlternative(null)}><X size={16} /></button></div>
                    {selection.need.alternatives.filter((entry) => entry.id !== selection.product.id).map((alternative) => (
                      <button className="alternative-option" key={alternative.id} onClick={() => chooseAlternative(selection, alternative)}>
                        <ProductArt product={alternative} compact /><span><strong>{alternative.name}</strong><small>{alternative.pack}</small></span><b>₹{alternative.price}</b>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        <aside className="suggestion-summary">
          <span>SELECTED TOTAL</span>
          <h2>₹{total}</h2>
          {suggestion.budget && <div className={`budget-meter ${withinBudget ? "" : "over"}`}><div style={{ width: `${Math.min(100, (total / suggestion.budget) * 100)}%` }} /><small>{withinBudget ? `₹${suggestion.budget - total} left in budget` : `₹${total - suggestion.budget} over budget`}</small></div>}
          <div className="summary-lines"><span>{selected.length} selected items</span><span>Free demo delivery</span><span>Prices checked locally</span></div>
          <button className="primary-button" onClick={transfer} disabled={!selected.length}>Add selected to cart · ₹{total}</button>
          <p>You can review every item again before simulated checkout.</p>
        </aside>
      </div>

      {suggestion.additions.length > 0 && (
        <section className="suggestion-additions">
          <div className="section-heading"><div><span>OPTIONAL</span><h2>Complete the plan</h2></div><p>Useful additions, never forced into your basket.</p></div>
          <div className="product-rail">{suggestion.additions.filter((entry) => !selectedIds.has(entry.id)).map((entry) => <ProductCard key={entry.id} product={entry} source={suggestion.title} />)}</div>
        </section>
      )}

      {suggestion.steps && (
        <section className="recipe-steps"><div><span>QUICK RECIPE</span><h2>From basket to plate</h2></div><ol>{suggestion.steps.map((step) => <li key={step}>{step}</li>)}</ol></section>
      )}
      {notice && <div className="toast" role="status"><Check size={17} /> {notice}</div>}
    </div>
  );
}
