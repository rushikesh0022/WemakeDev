import { describe, expect, it } from "vitest";
import { deriveGroupCollectionStatus } from "./group-state";

describe("group payment state", () => {
  it("collects while a contribution is due", () => {
    expect(deriveGroupCollectionStatus([{ status: "due" }])).toBe("collecting");
  });

  it("collects while a provider confirmation is pending", () => {
    expect(deriveGroupCollectionStatus([{ status: "paid" }, { status: "pending" }])).toBe("collecting");
  });

  it("collects after a failed contribution", () => {
    expect(deriveGroupCollectionStatus([{ status: "failed" }])).toBe("collecting");
  });

  it("becomes ready only when every non-empty contribution is paid", () => {
    expect(deriveGroupCollectionStatus([{ status: "paid" }, { status: "paid" }])).toBe("ready");
    expect(deriveGroupCollectionStatus([])).toBe("collecting");
  });
});
