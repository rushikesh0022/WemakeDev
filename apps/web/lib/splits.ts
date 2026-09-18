import "server-only";

import { createHash, randomBytes, randomUUID, timingSafeEqual } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import type { AccountOrder } from "./auth";
import { calculateSettlementAmounts } from "./split-allocation";

export type SplitStatus = "draft" | "locked" | "collecting" | "settled" | "cancelled" | "expired" | "refund_review";
export type SettlementStatus = "due" | "awaiting_owner_confirmation" | "paid" | "rejected";

export type SplitItem = {
  lineId: string;
  productId: string;
  name: string;
  quantity: number;
  unitPricePaise: number;
};

export type SplitParticipant = {
  id: string;
  displayName: string;
  sessionHash: string;
  claimedSubtotalPaise: number;
  payablePaise: number;
  createdAt: string;
};

export type SplitClaim = { participantId: string; lineId: string; quantity: number };

export type SplitSettlement = {
  id: string;
  participantId: string;
  amountPaise: number;
  upiReference: string;
  status: SettlementStatus;
  reportedAt: string | null;
  confirmedAt: string | null;
};

export type SplitGroup = {
  id: string;
  orderId: string;
  ownerId: string;
  ownerName: string;
  ownerVpa: string;
  tokenHash: string;
  expiresAt: string;
  version: number;
  status: SplitStatus;
  finalTotalPaise: number;
  sharedChargePaise: number;
  orderDiscountPaise: number;
  ownerPayablePaise: number;
  items: SplitItem[];
  participants: SplitParticipant[];
  claims: SplitClaim[];
  settlements: SplitSettlement[];
  createdAt: string;
  updatedAt: string;
};

export type PublicSplitView = {
  id: string;
  orderId: string;
  ownerName: string;
  status: SplitStatus;
  expiresAt: string;
  version: number;
  finalTotalPaise: number;
  ownerPayablePaise: number;
  items: Array<SplitItem & { claimed: Array<{ participantId: string; displayName: string; quantity: number }>; remaining: number }>;
  participants: Array<{ id: string; displayName: string; claimedSubtotalPaise: number; payablePaise: number; paymentStatus: SettlementStatus | null }>;
  me: null | { id: string; displayName: string; claims: Array<{ lineId: string; quantity: number }>; settlement: null | { id: string; amountPaise: number; status: SettlementStatus; upiUri: string } };
};

export type OwnerSplitView = Omit<SplitGroup, "tokenHash" | "participants"> & {
  participants: Array<Omit<SplitParticipant, "sessionHash">>;
};

const dataDirectory = path.join(process.cwd(), ".zaply-data");
const splitsFile = path.join(dataDirectory, "splits.json");
let writeQueue = Promise.resolve();

function digest(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function secureEqual(left: string, right: string) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

function serialize<T>(operation: () => Promise<T>) {
  const result = writeQueue.then(operation, operation);
  writeQueue = result.then(() => undefined, () => undefined);
  return result;
}

async function readSplits(): Promise<SplitGroup[]> {
  try {
    return JSON.parse(await readFile(splitsFile, "utf8"));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }
}

async function writeSplits(splits: SplitGroup[]) {
  await mkdir(dataDirectory, { recursive: true });
  const temporary = `${splitsFile}.${randomUUID()}.tmp`;
  await writeFile(temporary, JSON.stringify(splits, null, 2), { mode: 0o600 });
  await rename(temporary, splitsFile);
}

function publicToken(splitId: string) {
  const secret = randomBytes(24).toString("base64url");
  return { token: `${splitId}.${secret}`, tokenHash: digest(secret) };
}

function resolveToken(splits: SplitGroup[], token: string) {
  const separator = token.indexOf(".");
  if (separator < 1) return null;
  const id = token.slice(0, separator);
  const secret = token.slice(separator + 1);
  const split = splits.find((candidate) => candidate.id === id);
  return split && secureEqual(split.tokenHash, digest(secret)) ? split : null;
}

function effectiveStatus(split: SplitGroup): SplitStatus {
  if (!["settled", "cancelled", "refund_review"].includes(split.status) && Date.parse(split.expiresAt) <= Date.now()) return "expired";
  return split.status;
}

function validateVpa(vpa: string) {
  const normalized = vpa.trim();
  if (!/^[A-Za-z0-9._-]{2,256}@[A-Za-z0-9.-]{2,64}$/.test(normalized)) throw new Error("Enter a valid UPI ID, for example name@bank.");
  return normalized;
}

function ownerView(split: SplitGroup): OwnerSplitView {
  const { tokenHash: _tokenHash, participants, ...safe } = split;
  return { ...safe, status: effectiveStatus(split), participants: participants.map(({ sessionHash: _sessionHash, ...participant }) => participant) };
}

function participantFromSession(split: SplitGroup, cookieValue?: string | null) {
  if (!cookieValue) return null;
  const separator = cookieValue.indexOf(".");
  if (separator < 1) return null;
  const participantId = cookieValue.slice(0, separator);
  const secret = cookieValue.slice(separator + 1);
  const participant = split.participants.find((candidate) => candidate.id === participantId);
  return participant && secureEqual(participant.sessionHash, digest(secret)) ? participant : null;
}

function upiUri(split: SplitGroup, settlement: SplitSettlement) {
  const query = new URLSearchParams({
    pa: split.ownerVpa,
    pn: split.ownerName,
    am: (settlement.amountPaise / 100).toFixed(2),
    cu: "INR",
    tn: `Zaply split ${split.orderId}`,
    tr: settlement.upiReference
  });
  return `upi://pay?${query.toString()}`;
}

function publicView(split: SplitGroup, cookieValue?: string | null): PublicSplitView {
  const me = participantFromSession(split, cookieValue);
  return {
    id: split.id,
    orderId: split.orderId,
    ownerName: split.ownerName,
    status: effectiveStatus(split),
    expiresAt: split.expiresAt,
    version: split.version,
    finalTotalPaise: split.finalTotalPaise,
    ownerPayablePaise: split.ownerPayablePaise,
    items: split.items.map((item) => {
      const claimed = split.claims.filter((claim) => claim.lineId === item.lineId).map((claim) => ({
        participantId: claim.participantId,
        displayName: split.participants.find((participant) => participant.id === claim.participantId)?.displayName ?? "Friend",
        quantity: claim.quantity
      }));
      return { ...item, claimed, remaining: item.quantity - claimed.reduce((sum, claim) => sum + claim.quantity, 0) };
    }),
    participants: split.participants.map((participant) => ({
      id: participant.id,
      displayName: participant.displayName,
      claimedSubtotalPaise: participant.claimedSubtotalPaise,
      payablePaise: participant.payablePaise,
      paymentStatus: split.settlements.find((settlement) => settlement.participantId === participant.id)?.status ?? null
    })),
    me: me ? {
      id: me.id,
      displayName: me.displayName,
      claims: split.claims.filter((claim) => claim.participantId === me.id).map(({ lineId, quantity }) => ({ lineId, quantity })),
      settlement: (() => {
        const settlement = split.settlements.find((candidate) => candidate.participantId === me.id);
        return settlement ? { id: settlement.id, amountPaise: settlement.amountPaise, status: settlement.status, upiUri: upiUri(split, settlement) } : null;
      })()
    } : null
  };
}

export function splitCookieName(splitId: string) {
  return `zaply_split_${splitId}`;
}

export async function createSplit(input: { order: AccountOrder; ownerId: string; ownerName: string; ownerVpa: string }) {
  if (input.order.status !== "paid" || input.order.paymentStatus !== "approved") throw new Error("Only paid orders can be split.");
  return serialize(async () => {
    const splits = await readSplits();
    const existing = splits.find((split) => split.orderId === input.order.id && split.ownerId === input.ownerId && split.status !== "cancelled");
    if (existing) throw new Error("This order already has a split.");
    const id = `split_${randomUUID().replaceAll("-", "")}`;
    const access = publicToken(id);
    const now = new Date();
    const split: SplitGroup = {
      id,
      orderId: input.order.id,
      ownerId: input.ownerId,
      ownerName: input.ownerName,
      ownerVpa: validateVpa(input.ownerVpa),
      tokenHash: access.tokenHash,
      expiresAt: new Date(now.getTime() + 7 * 86400000).toISOString(),
      version: 1,
      status: "draft",
      finalTotalPaise: input.order.finalTotalPaise,
      sharedChargePaise: input.order.sharedChargePaise,
      orderDiscountPaise: input.order.orderDiscountPaise,
      ownerPayablePaise: input.order.finalTotalPaise,
      items: input.order.items.map((item) => ({ lineId: item.lineId, productId: item.productId, name: item.name, quantity: item.quantity, unitPricePaise: Math.round(item.price * 100) })),
      participants: [],
      claims: [],
      settlements: [],
      createdAt: now.toISOString(),
      updatedAt: now.toISOString()
    };
    await writeSplits([...splits, split]);
    return { split: ownerView(split), publicToken: access.token };
  });
}

export async function getSplitForOwner(ownerId: string, splitId: string) {
  const split = (await readSplits()).find((candidate) => candidate.id === splitId && candidate.ownerId === ownerId);
  return split ? ownerView(split) : null;
}

export async function getPublicSplit(token: string, cookieValue?: string | null) {
  const split = resolveToken(await readSplits(), token);
  return split ? publicView(split, cookieValue) : null;
}

export async function rotatePublicLink(ownerId: string, splitId: string) {
  return serialize(async () => {
    const splits = await readSplits();
    const index = splits.findIndex((candidate) => candidate.id === splitId && candidate.ownerId === ownerId);
    if (index < 0) return null;
    const access = publicToken(splitId);
    splits[index] = { ...splits[index], tokenHash: access.tokenHash, version: splits[index].version + 1, updatedAt: new Date().toISOString() };
    await writeSplits(splits);
    return { split: ownerView(splits[index]), publicToken: access.token };
  });
}

export async function joinSplit(token: string, displayNameInput: string) {
  return serialize(async () => {
    const splits = await readSplits();
    const split = resolveToken(splits, token);
    if (!split) return null;
    if (effectiveStatus(split) !== "draft") throw new Error("This split is no longer accepting participants.");
    const displayName = displayNameInput.trim().slice(0, 40);
    if (displayName.length < 2) throw new Error("Enter your name.");
    const sessionSecret = randomBytes(24).toString("base64url");
    const participant: SplitParticipant = {
      id: `person_${randomUUID().replaceAll("-", "")}`,
      displayName,
      sessionHash: digest(sessionSecret),
      claimedSubtotalPaise: 0,
      payablePaise: 0,
      createdAt: new Date().toISOString()
    };
    split.participants.push(participant);
    split.version++;
    split.updatedAt = new Date().toISOString();
    await writeSplits(splits);
    return { split: publicView(split, `${participant.id}.${sessionSecret}`), cookieName: splitCookieName(split.id), cookieValue: `${participant.id}.${sessionSecret}` };
  });
}

export async function updateClaims(token: string, cookieValue: string | null | undefined, expectedVersion: number, requested: Array<{ lineId: string; quantity: number }>) {
  return serialize(async () => {
    const splits = await readSplits();
    const split = resolveToken(splits, token);
    if (!split) return null;
    if (effectiveStatus(split) !== "draft") throw new Error("Claims are locked for this split.");
    if (split.version !== expectedVersion) return { conflict: true as const, split: publicView(split, cookieValue) };
    const participant = participantFromSession(split, cookieValue);
    if (!participant) throw new Error("Join this split before claiming items.");
    const consolidated = new Map<string, number>();
    for (const claim of requested) {
      const lineId = String(claim.lineId);
      const quantity = Math.max(0, Math.floor(Number(claim.quantity) || 0));
      if (quantity > 0) consolidated.set(lineId, (consolidated.get(lineId) ?? 0) + quantity);
    }
    const normalized = [...consolidated].map(([lineId, quantity]) => ({ lineId, quantity }));
    for (const claim of normalized) {
      const item = split.items.find((candidate) => candidate.lineId === claim.lineId);
      if (!item) throw new Error("One of the selected items is unavailable.");
      const claimedByOthers = split.claims.filter((candidate) => candidate.lineId === claim.lineId && candidate.participantId !== participant.id).reduce((sum, candidate) => sum + candidate.quantity, 0);
      if (claim.quantity + claimedByOthers > item.quantity) return { conflict: true as const, split: publicView(split, cookieValue) };
    }
    split.claims = [...split.claims.filter((claim) => claim.participantId !== participant.id), ...normalized.map((claim) => ({ ...claim, participantId: participant.id }))];
    participant.claimedSubtotalPaise = split.claims.filter((claim) => claim.participantId === participant.id).reduce((sum, claim) => sum + claim.quantity * (split.items.find((item) => item.lineId === claim.lineId)?.unitPricePaise ?? 0), 0);
    split.version++;
    split.updatedAt = new Date().toISOString();
    await writeSplits(splits);
    return { conflict: false as const, split: publicView(split, cookieValue) };
  });
}

export async function lockSplit(ownerId: string, splitId: string) {
  return serialize(async () => {
    const splits = await readSplits();
    const split = splits.find((candidate) => candidate.id === splitId && candidate.ownerId === ownerId);
    if (!split) return null;
    if (effectiveStatus(split) !== "draft") throw new Error("Only a draft split can be locked.");
    const participantIds = split.participants.filter((participant) => split.claims.some((claim) => claim.participantId === participant.id)).map((participant) => participant.id);
    if (!participantIds.length) throw new Error("At least one friend must claim an item before locking the split.");
    const calculated = calculateSettlementAmounts({ items: split.items, participantIds, claims: split.claims, sharedChargePaise: split.sharedChargePaise, orderDiscountPaise: split.orderDiscountPaise, finalTotalPaise: split.finalTotalPaise });
    split.ownerPayablePaise = calculated.amounts.get("owner") ?? split.finalTotalPaise;
    split.participants.forEach((participant) => {
      participant.claimedSubtotalPaise = calculated.subtotals.get(participant.id) ?? 0;
      participant.payablePaise = calculated.amounts.get(participant.id) ?? 0;
    });
    split.settlements = participantIds.map((participantId) => ({
      id: `settle_${randomUUID().replaceAll("-", "")}`,
      participantId,
      amountPaise: calculated.amounts.get(participantId) ?? 0,
      upiReference: `ZPS${randomUUID().replaceAll("-", "").slice(0, 20).toUpperCase()}`,
      status: "due" as const,
      reportedAt: null,
      confirmedAt: null
    })).filter((settlement) => settlement.amountPaise > 0);
    split.status = split.settlements.length ? "collecting" : "settled";
    split.version++;
    split.updatedAt = new Date().toISOString();
    await writeSplits(splits);
    return ownerView(split);
  });
}

export async function markSettlementSent(token: string, cookieValue: string | null | undefined, settlementId: string) {
  return serialize(async () => {
    const splits = await readSplits();
    const split = resolveToken(splits, token);
    if (!split) return null;
    const participant = participantFromSession(split, cookieValue);
    if (!participant) throw new Error("Your participant session has expired.");
    const settlement = split.settlements.find((candidate) => candidate.id === settlementId && candidate.participantId === participant.id);
    if (!settlement) throw new Error("Settlement was not found.");
    if (settlement.status === "paid" || settlement.status === "awaiting_owner_confirmation") return publicView(split, cookieValue);
    settlement.status = "awaiting_owner_confirmation";
    settlement.reportedAt = new Date().toISOString();
    split.version++;
    split.updatedAt = settlement.reportedAt;
    await writeSplits(splits);
    return publicView(split, cookieValue);
  });
}

export async function reviewSettlement(ownerId: string, splitId: string, settlementId: string, decision: "confirm" | "reject") {
  return serialize(async () => {
    const splits = await readSplits();
    const split = splits.find((candidate) => candidate.id === splitId && candidate.ownerId === ownerId);
    if (!split) return null;
    const settlement = split.settlements.find((candidate) => candidate.id === settlementId);
    if (!settlement) throw new Error("Settlement was not found.");
    if (settlement.status === "paid") return ownerView(split);
    if (decision === "confirm") {
      if (settlement.status !== "awaiting_owner_confirmation") throw new Error("The friend must report payment before it can be confirmed.");
      settlement.confirmedAt = new Date().toISOString();
      settlement.status = "paid";
    } else {
      settlement.status = "due";
      settlement.confirmedAt = null;
    }
    split.status = split.settlements.every((candidate) => candidate.status === "paid") ? "settled" : "collecting";
    split.version++;
    split.updatedAt = new Date().toISOString();
    await writeSplits(splits);
    return ownerView(split);
  });
}
