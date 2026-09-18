export type AllocationItem = {
  lineId: string;
  quantity: number;
  unitPricePaise: number;
};

export type AllocationClaim = {
  participantId: string;
  lineId: string;
  quantity: number;
};

function allocate(total: number, entries: Array<{ id: string; subtotal: number }>) {
  const result = new Map(entries.map((entry) => [entry.id, 0]));
  const denominator = entries.reduce((sum, entry) => sum + entry.subtotal, 0);
  if (total <= 0 || denominator <= 0) return result;

  const ranked = entries.map((entry) => {
    const numerator = total * entry.subtotal;
    const floor = Math.floor(numerator / denominator);
    result.set(entry.id, floor);
    return { id: entry.id, remainder: numerator % denominator };
  }).sort((a, b) => b.remainder - a.remainder || a.id.localeCompare(b.id));

  let remainder = total - [...result.values()].reduce((sum, value) => sum + value, 0);
  for (let index = 0; remainder > 0; index = (index + 1) % ranked.length, remainder--) {
    result.set(ranked[index].id, (result.get(ranked[index].id) ?? 0) + 1);
  }
  return result;
}

export function calculateSettlementAmounts(input: {
  items: AllocationItem[];
  participantIds: string[];
  claims: AllocationClaim[];
  sharedChargePaise: number;
  orderDiscountPaise: number;
  finalTotalPaise: number;
}) {
  const subtotals = new Map<string, number>([["owner", 0], ...input.participantIds.map((id) => [id, 0] as const)]);
  for (const item of input.items) {
    let claimedQuantity = 0;
    for (const claim of input.claims.filter((candidate) => candidate.lineId === item.lineId)) {
      claimedQuantity += claim.quantity;
      subtotals.set(claim.participantId, (subtotals.get(claim.participantId) ?? 0) + claim.quantity * item.unitPricePaise);
    }
    subtotals.set("owner", (subtotals.get("owner") ?? 0) + Math.max(0, item.quantity - claimedQuantity) * item.unitPricePaise);
  }

  const entries = [...subtotals.entries()].map(([id, subtotal]) => ({ id, subtotal }));
  const charges = allocate(input.sharedChargePaise, entries);
  const discounts = allocate(input.orderDiscountPaise, entries);
  const amounts = new Map(entries.map(({ id, subtotal }) => [id, subtotal + (charges.get(id) ?? 0) - (discounts.get(id) ?? 0)]));
  const assigned = [...amounts.values()].reduce((sum, amount) => sum + amount, 0);
  const ownerAmount = (amounts.get("owner") ?? 0) + input.finalTotalPaise - assigned;
  if (ownerAmount < 0) throw new Error("The order total cannot be allocated without a negative owner share.");
  amounts.set("owner", ownerAmount);
  return { subtotals, amounts };
}
