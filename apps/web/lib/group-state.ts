export type CollectableContribution = { status: "due" | "pending" | "paid" | "failed" };

export function deriveGroupCollectionStatus(contributions: CollectableContribution[]) {
  if (contributions.length > 0 && contributions.every((item) => item.status === "paid")) return "ready" as const;
  return "collecting" as const;
}
