import { describe, expect, it } from "vitest";
import { calculateSettlementAmounts } from "./split-allocation";

const items = [
  { lineId: "chips", quantity: 2, unitPricePaise: 3301 },
  { lineId: "cola", quantity: 1, unitPricePaise: 4999 }
];

describe("split settlement allocation", () => {
  it("keeps unclaimed quantities with the owner", () => {
    const result = calculateSettlementAmounts({
      items,
      participantIds: ["friend"],
      claims: [{ participantId: "friend", lineId: "chips", quantity: 1 }],
      sharedChargePaise: 0,
      orderDiscountPaise: 0,
      finalTotalPaise: 11601
    });

    expect(result.subtotals.get("friend")).toBe(3301);
    expect(result.amounts.get("owner")).toBe(8300);
    expect([...result.amounts.values()].reduce((sum, value) => sum + value, 0)).toBe(11601);
  });

  it("allocates fees and discounts proportionally in integer paise", () => {
    const result = calculateSettlementAmounts({
      items,
      participantIds: ["friend-a", "friend-b"],
      claims: [
        { participantId: "friend-a", lineId: "chips", quantity: 1 },
        { participantId: "friend-b", lineId: "cola", quantity: 1 }
      ],
      sharedChargePaise: 99,
      orderDiscountPaise: 500,
      finalTotalPaise: 11200
    });

    expect([...result.amounts.values()].reduce((sum, value) => sum + value, 0)).toBe(11200);
    expect([...result.amounts.values()].every(Number.isInteger)).toBe(true);
  });

  it("gives a final one-paise reconciliation residual to the owner", () => {
    const result = calculateSettlementAmounts({
      items: [{ lineId: "shared", quantity: 3, unitPricePaise: 100 }],
      participantIds: ["a", "b"],
      claims: [
        { participantId: "a", lineId: "shared", quantity: 1 },
        { participantId: "b", lineId: "shared", quantity: 1 }
      ],
      sharedChargePaise: 1,
      orderDiscountPaise: 0,
      finalTotalPaise: 302
    });

    expect(result.amounts.get("owner")).toBe(101);
    expect(result.amounts.get("a")).toBe(101);
    expect(result.amounts.get("b")).toBe(100);
  });
});
