import "server-only";

import { createHash, randomBytes, randomUUID, timingSafeEqual } from "node:crypto";
import { createOrder, updateOrderPayment, type AccountOrder } from "./auth";
import { deriveGroupCollectionStatus } from "./group-state";
import { calculateSettlementAmounts } from "./split-allocation";
import { capturePayment, createPaymentTransaction } from "./payments";
import { createAmazonLinkSession, type AmazonLinkTarget } from "./amazon-pay";
import { readState, writeState } from "./state-store";

export type GroupStatus = "draft" | "locked" | "collecting" | "ready" | "placed" | "cancelled" | "expired";
export type ContributionStatus = "due" | "pending" | "paid" | "failed";

export type GroupItem = {
  lineId: string;
  productId: string;
  name: string;
  image: string;
  quantity: number;
  unitPricePaise: number;
};

type GroupParticipant = {
  id: string;
  displayName: string;
  sessionHash: string;
  amazonLinked: boolean;
  amazonInstrument: string | null;
  amazonAuthorizationId?: string | null;
  createdAt: string;
};

type GroupClaim = { participantId: string; lineId: string; quantity: number };

type GroupContribution = {
  id: string;
  participantId: string;
  amountPaise: number;
  status: ContributionStatus;
  paymentTransactionId: string | null;
  paidAt: string | null;
};

export type GroupOrder = {
  id: string;
  ownerId: string;
  ownerName: string;
  tokenHash: string;
  expiresAt: string;
  version: number;
  status: GroupStatus;
  items: GroupItem[];
  finalTotalPaise: number;
  ownerPayablePaise: number;
  ownerAmazonLinked: boolean;
  ownerAmazonAuthorizationId?: string | null;
  ownerContributionStatus: ContributionStatus;
  participants: GroupParticipant[];
  claims: GroupClaim[];
  contributions: GroupContribution[];
  orderId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type OwnerGroupView = Omit<GroupOrder, "tokenHash" | "participants" | "ownerAmazonAuthorizationId"> & {
  participants: Array<Omit<GroupParticipant, "sessionHash" | "amazonAuthorizationId"> & { payablePaise: number; paymentStatus: ContributionStatus | null }>;
};

export type PublicGroupView = {
  id: string;
  ownerName: string;
  status: GroupStatus;
  expiresAt: string;
  version: number;
  finalTotalPaise: number;
  items: Array<GroupItem & { remaining: number; claimed: Array<{ participantId: string; displayName: string; quantity: number }> }>;
  participants: Array<{ id: string; displayName: string; amazonLinked: boolean; paymentStatus: ContributionStatus | null }>;
  me: null | {
    id: string;
    displayName: string;
    amazonLinked: boolean;
    amazonInstrument: string | null;
    claims: Array<{ lineId: string; quantity: number }>;
    contribution: null | { id: string; amountPaise: number; status: ContributionStatus };
  };
};

let writeQueue = Promise.resolve();

function digest(value: string) { return createHash("sha256").update(value).digest("hex"); }
function secureEqual(left: string, right: string) {
  const a = Buffer.from(left); const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}
function serialize<T>(operation: () => Promise<T>) {
  const result = writeQueue.then(operation, operation);
  writeQueue = result.then(() => undefined, () => undefined);
  return result;
}
async function readGroups(): Promise<GroupOrder[]> {
  return readState("group-orders", () => []);
}
async function writeGroups(groups: GroupOrder[]) {
  await writeState("group-orders", groups);
}
function createToken(id: string) {
  const secret = randomBytes(24).toString("base64url");
  return { token: `${id}.${secret}`, tokenHash: digest(secret) };
}
function resolveToken(groups: GroupOrder[], token: string) {
  const [id, secret] = token.split(".");
  if (!id || !secret) return null;
  const group = groups.find((candidate) => candidate.id === id);
  return group && secureEqual(group.tokenHash, digest(secret)) ? group : null;
}
function effectiveStatus(group: GroupOrder): GroupStatus {
  if (!["placed", "cancelled"].includes(group.status) && Date.parse(group.expiresAt) <= Date.now()) return "expired";
  return group.status;
}
function participantFromSession(group: GroupOrder, cookieValue?: string | null) {
  if (!cookieValue) return null;
  const [id, secret] = cookieValue.split(".");
  const participant = group.participants.find((candidate) => candidate.id === id);
  return participant && secret && secureEqual(participant.sessionHash, digest(secret)) ? participant : null;
}
function ownerView(group: GroupOrder): OwnerGroupView {
  const { tokenHash: _tokenHash, participants, ownerAmazonAuthorizationId: _ownerAuthorization, ...safe } = group;
  return {
    ...safe,
    status: effectiveStatus(group),
    participants: participants.map(({ sessionHash: _sessionHash, amazonAuthorizationId: _authorization, ...participant }) => ({
      ...participant,
      payablePaise: group.contributions.find((item) => item.participantId === participant.id)?.amountPaise ?? 0,
      paymentStatus: group.contributions.find((item) => item.participantId === participant.id)?.status ?? null
    }))
  };
}
function publicView(group: GroupOrder, cookieValue?: string | null): PublicGroupView {
  const me = participantFromSession(group, cookieValue);
  return {
    id: group.id,
    ownerName: group.ownerName,
    status: effectiveStatus(group),
    expiresAt: group.expiresAt,
    version: group.version,
    finalTotalPaise: group.finalTotalPaise,
    items: group.items.map((item) => {
      const claimed = group.claims.filter((claim) => claim.lineId === item.lineId).map((claim) => ({
        participantId: claim.participantId,
        displayName: group.participants.find((person) => person.id === claim.participantId)?.displayName ?? "Friend",
        quantity: claim.quantity
      }));
      return { ...item, claimed, remaining: item.quantity - claimed.reduce((sum, claim) => sum + claim.quantity, 0) };
    }),
    participants: group.participants.map((participant) => ({
      id: participant.id,
      displayName: participant.displayName,
      amazonLinked: participant.amazonLinked,
      paymentStatus: group.contributions.find((item) => item.participantId === participant.id)?.status ?? null
    })),
    me: me ? {
      id: me.id,
      displayName: me.displayName,
      amazonLinked: me.amazonLinked,
      amazonInstrument: me.amazonInstrument,
      claims: group.claims.filter((claim) => claim.participantId === me.id).map(({ lineId, quantity }) => ({ lineId, quantity })),
      contribution: (() => {
        const contribution = group.contributions.find((item) => item.participantId === me.id);
        return contribution ? { id: contribution.id, amountPaise: contribution.amountPaise, status: contribution.status } : null;
      })()
    } : null
  };
}
function updateCollectionStatus(group: GroupOrder) {
  if (group.status === "placed") return;
  group.status = deriveGroupCollectionStatus(group.contributions);
}

export function groupCookieName(id: string) { return `nesto_group_${id}`; }

export async function createGroup(input: { ownerId: string; ownerName: string; items: GroupItem[] }) {
  if (!input.items.length) throw new Error("Add items before starting a group order.");
  return serialize(async () => {
    const groups = await readGroups();
    const id = `group_${randomUUID().replaceAll("-", "")}`;
    const access = createToken(id);
    const now = new Date();
    const group: GroupOrder = {
      id, ownerId: input.ownerId, ownerName: input.ownerName, tokenHash: access.tokenHash,
      expiresAt: new Date(now.getTime() + 7 * 86400000).toISOString(), version: 1, status: "draft",
      items: input.items, finalTotalPaise: input.items.reduce((sum, item) => sum + item.quantity * item.unitPricePaise, 0),
      ownerPayablePaise: input.items.reduce((sum, item) => sum + item.quantity * item.unitPricePaise, 0),
      ownerAmazonLinked: false, ownerAmazonAuthorizationId: null, ownerContributionStatus: "due", participants: [], claims: [], contributions: [],
      orderId: null, createdAt: now.toISOString(), updatedAt: now.toISOString()
    };
    await writeGroups([...groups, group]);
    return { group: ownerView(group), publicToken: access.token };
  });
}

export async function getOwnerGroup(ownerId: string, groupId: string) {
  const group = (await readGroups()).find((candidate) => candidate.id === groupId && candidate.ownerId === ownerId);
  return group ? ownerView(group) : null;
}
export async function listOwnerGroups(ownerId: string) {
  return (await readGroups()).filter((candidate) => candidate.ownerId === ownerId).sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map(ownerView);
}
export async function getPublicGroup(token: string, cookieValue?: string | null) {
  const group = resolveToken(await readGroups(), token);
  return group ? publicView(group, cookieValue) : null;
}
export async function rotateGroupLink(ownerId: string, groupId: string) {
  return serialize(async () => {
    const groups = await readGroups(); const group = groups.find((candidate) => candidate.id === groupId && candidate.ownerId === ownerId);
    if (!group) return null;
    if (["placed", "cancelled", "expired"].includes(effectiveStatus(group))) throw new Error("This basket is closed and its invite cannot be replaced.");
    const access = createToken(groupId); group.tokenHash = access.tokenHash; group.version++; group.updatedAt = new Date().toISOString();
    await writeGroups(groups); return { group: ownerView(group), publicToken: access.token };
  });
}
export async function joinGroup(token: string, displayNameInput: string) {
  return serialize(async () => {
    const groups = await readGroups(); const group = resolveToken(groups, token);
    if (!group) return null;
    if (effectiveStatus(group) !== "draft") throw new Error("This basket is no longer accepting people.");
    const displayName = displayNameInput.trim().slice(0, 40); if (displayName.length < 2) throw new Error("Enter your name.");
    const secret = randomBytes(24).toString("base64url");
    const participant: GroupParticipant = { id: `person_${randomUUID().replaceAll("-", "")}`, displayName, sessionHash: digest(secret), amazonLinked: false, amazonInstrument: null, amazonAuthorizationId: null, createdAt: new Date().toISOString() };
    group.participants.push(participant); group.version++; group.updatedAt = new Date().toISOString(); await writeGroups(groups);
    const cookieValue = `${participant.id}.${secret}`;
    return { group: publicView(group, cookieValue), cookieName: groupCookieName(group.id), cookieValue };
  });
}
export async function updateGroupClaims(token: string, cookieValue: string | null | undefined, expectedVersion: number, requested: Array<{ lineId: string; quantity: number }>) {
  return serialize(async () => {
    const groups = await readGroups(); const group = resolveToken(groups, token); if (!group) return null;
    if (effectiveStatus(group) !== "draft") throw new Error("Choices are locked for this basket.");
    if (group.version !== expectedVersion) return { conflict: true as const, group: publicView(group, cookieValue) };
    const participant = participantFromSession(group, cookieValue); if (!participant) throw new Error("Join this basket before choosing items.");
    const consolidated = new Map<string, number>();
    for (const claim of requested) {
      const lineId = String(claim.lineId); const quantity = Math.max(0, Math.floor(Number(claim.quantity) || 0));
      if (quantity) consolidated.set(lineId, (consolidated.get(lineId) ?? 0) + quantity);
    }
    const normalized = [...consolidated].map(([lineId, quantity]) => ({ lineId, quantity }));
    for (const claim of normalized) {
      const item = group.items.find((candidate) => candidate.lineId === claim.lineId); if (!item) throw new Error("One selected item is unavailable.");
      const others = group.claims.filter((candidate) => candidate.lineId === claim.lineId && candidate.participantId !== participant.id).reduce((sum, candidate) => sum + candidate.quantity, 0);
      if (claim.quantity + others > item.quantity) return { conflict: true as const, group: publicView(group, cookieValue) };
    }
    group.claims = [...group.claims.filter((claim) => claim.participantId !== participant.id), ...normalized.map((claim) => ({ ...claim, participantId: participant.id }))];
    group.version++; group.updatedAt = new Date().toISOString(); await writeGroups(groups);
    return { conflict: false as const, group: publicView(group, cookieValue) };
  });
}
export async function lockGroup(ownerId: string, groupId: string) {
  return serialize(async () => {
    const groups = await readGroups(); const group = groups.find((candidate) => candidate.id === groupId && candidate.ownerId === ownerId); if (!group) return null;
    if (effectiveStatus(group) !== "draft") throw new Error("Only an open basket can be locked.");
    const participantIds = group.participants.filter((person) => group.claims.some((claim) => claim.participantId === person.id)).map((person) => person.id);
    if (!participantIds.length) throw new Error("At least one friend must choose an item.");
    const calculated = calculateSettlementAmounts({ items: group.items, participantIds, claims: group.claims, sharedChargePaise: 0, orderDiscountPaise: 0, finalTotalPaise: group.finalTotalPaise });
    group.ownerPayablePaise = calculated.amounts.get("owner") ?? group.finalTotalPaise;
    group.contributions = participantIds.map((participantId) => ({ id: `contrib_${randomUUID().replaceAll("-", "")}`, participantId, amountPaise: calculated.amounts.get(participantId) ?? 0, status: "due" as const, paymentTransactionId: null, paidAt: null })).filter((item) => item.amountPaise > 0);
    updateCollectionStatus(group); group.version++; group.updatedAt = new Date().toISOString(); await writeGroups(groups); return ownerView(group);
  });
}
export async function linkParticipantAmazon(token: string, cookieValue?: string | null) {
  if (process.env.PAYMENT_PROVIDER === "amazon_pay") throw new Error("Complete Amazon Pay authorization in the provider window before linking this account.");
  return serialize(async () => {
    const groups = await readGroups(); const group = resolveToken(groups, token); if (!group) return null;
    const participant = participantFromSession(group, cookieValue); if (!participant) throw new Error("Your private session has expired.");
    participant.amazonLinked = true; participant.amazonInstrument = "Amazon Pay Balance •••• 2048"; group.version++; group.updatedAt = new Date().toISOString(); await writeGroups(groups);
    return publicView(group, cookieValue);
  });
}

export async function beginParticipantAmazonLink(token: string, cookieValue?: string | null) {
  if (process.env.PAYMENT_PROVIDER !== "amazon_pay") {
    return { group: await linkParticipantAmazon(token, cookieValue), authorization: null };
  }
  const groups = await readGroups();
  const group = resolveToken(groups, token);
  if (!group) return null;
  const participant = participantFromSession(group, cookieValue);
  if (!participant) throw new Error("Your private session has expired.");
  const authorization = await createAmazonLinkSession(
    { kind: "participant", groupId: group.id, participantId: participant.id },
    `/group/${encodeURIComponent(token)}`
  );
  return { group: publicView(group, cookieValue), authorization };
}
export async function payContribution(token: string, cookieValue: string | null | undefined, contributionId: string, requestContext: { sourceIp?: string | null; sourceUserAgent?: string | null } = {}) {
  const prepared = await serialize(async () => {
    const groups = await readGroups(); const group = resolveToken(groups, token); if (!group) return null;
    if (!["collecting", "ready"].includes(group.status)) throw new Error("This basket is not collecting payments.");
    const participant = participantFromSession(group, cookieValue); if (!participant) throw new Error("Your private session has expired.");
    if (!participant.amazonLinked) throw new Error("Link Amazon Pay before paying.");
    const contribution = group.contributions.find((item) => item.id === contributionId && item.participantId === participant.id); if (!contribution) throw new Error("Contribution was not found.");
    if (contribution.status === "paid") return { alreadyPaid: true as const, group: publicView(group, cookieValue) };
    const transaction = await createPaymentTransaction(contribution.amountPaise, "success", {
      amazonAuthorizationId: participant.amazonAuthorizationId,
      ...requestContext
    });
    contribution.status = "pending"; contribution.paymentTransactionId = transaction.id; group.updatedAt = new Date().toISOString(); await writeGroups(groups);
    return { alreadyPaid: false as const, transactionId: transaction.id, groupId: group.id, participantId: participant.id };
  });
  if (!prepared || prepared.alreadyPaid) return prepared?.group ?? null;
  const payment = await capturePayment(prepared.transactionId);
  return serialize(async () => {
    const groups = await readGroups(); const group = groups.find((candidate) => candidate.id === prepared.groupId); if (!group) return null;
    const contribution = group.contributions.find((item) => item.participantId === prepared.participantId && item.paymentTransactionId === prepared.transactionId); if (!contribution) return null;
    contribution.status = payment.status === "approved" ? "paid" : "failed"; contribution.paidAt = payment.status === "approved" ? new Date().toISOString() : null;
    updateCollectionStatus(group); group.version++; group.updatedAt = new Date().toISOString(); await writeGroups(groups); return publicView(group, cookieValue);
  });
}
export async function linkOwnerAmazon(ownerId: string, groupId: string) {
  if (process.env.PAYMENT_PROVIDER === "amazon_pay") throw new Error("Complete Amazon Pay authorization in the provider window before linking this account.");
  return serialize(async () => {
    const groups = await readGroups(); const group = groups.find((candidate) => candidate.id === groupId && candidate.ownerId === ownerId); if (!group) return null;
    group.ownerAmazonLinked = true; group.version++; group.updatedAt = new Date().toISOString(); await writeGroups(groups); return ownerView(group);
  });
}

export async function beginOwnerAmazonLink(ownerId: string, groupId: string) {
  if (process.env.PAYMENT_PROVIDER !== "amazon_pay") {
    return { group: await linkOwnerAmazon(ownerId, groupId), authorization: null };
  }
  const group = (await readGroups()).find((candidate) => candidate.id === groupId && candidate.ownerId === ownerId);
  if (!group) return null;
  const authorization = await createAmazonLinkSession(
    { kind: "owner", groupId, ownerId },
    `/group/manage/${encodeURIComponent(groupId)}`
  );
  return { group: ownerView(group), authorization };
}

export async function completeGroupAmazonLink(target: AmazonLinkTarget, authorizationId: string) {
  return serialize(async () => {
    const groups = await readGroups();
    const group = groups.find((candidate) => candidate.id === target.groupId);
    if (!group) throw new Error("The shared basket no longer exists.");
    if (target.kind === "owner") {
      if (group.ownerId !== target.ownerId) throw new Error("Amazon Pay authorization does not match this basket owner.");
      group.ownerAmazonLinked = true;
      group.ownerAmazonAuthorizationId = authorizationId;
    } else {
      const participant = group.participants.find((candidate) => candidate.id === target.participantId);
      if (!participant) throw new Error("Amazon Pay authorization does not match a basket participant.");
      participant.amazonLinked = true;
      participant.amazonInstrument = "Amazon Pay Balance";
      participant.amazonAuthorizationId = authorizationId;
    }
    group.version++;
    group.updatedAt = new Date().toISOString();
    await writeGroups(groups);
    return group;
  });
}
export async function placeGroupOrder(ownerId: string, groupId: string, requestContext: { sourceIp?: string | null; sourceUserAgent?: string | null } = {}) {
  const prepared = await serialize(async () => {
    const groups = await readGroups(); const group = groups.find((candidate) => candidate.id === groupId && candidate.ownerId === ownerId); if (!group) return null;
    if (group.status === "placed") return { placed: true as const, group: ownerView(group) };
    if (group.status !== "ready") throw new Error("Wait for every friend contribution before placing the order.");
    if (group.ownerPayablePaise > 0 && !group.ownerAmazonLinked) throw new Error("Link Amazon Pay before paying your share.");
    const transaction = group.ownerPayablePaise > 0 ? await createPaymentTransaction(group.ownerPayablePaise, "success", {
      amazonAuthorizationId: group.ownerAmazonAuthorizationId,
      ...requestContext
    }) : null;
    group.ownerContributionStatus = transaction ? "pending" : "paid"; group.updatedAt = new Date().toISOString(); await writeGroups(groups);
    return { placed: false as const, transactionId: transaction?.id ?? null, groupId: group.id, items: group.items, fallbackTransactionId: group.contributions[0]?.paymentTransactionId ?? `group_${group.id}` };
  });
  if (!prepared || prepared.placed) return prepared?.group ?? null;
  const payment = prepared.transactionId ? await capturePayment(prepared.transactionId) : null; if (payment && payment.status !== "approved") throw new Error("Amazon Pay did not approve the owner contribution.");
  const order = await createOrder(ownerId, { total: prepared.items.reduce((sum, item) => sum + item.unitPricePaise * item.quantity, 0) / 100, paymentTransactionId: prepared.transactionId ?? prepared.fallbackTransactionId, paymentProvider: payment?.provider ?? (process.env.PAYMENT_PROVIDER === "amazon_pay" ? "amazon_pay" : "fake"), items: prepared.items.map((item) => ({ productId: item.productId, name: item.name, quantity: item.quantity, price: item.unitPricePaise / 100 })) });
  if (!order) throw new Error("Could not create the delivery order.");
  await updateOrderPayment(ownerId, order.id, "approved");
  return serialize(async () => {
    const groups = await readGroups(); const group = groups.find((candidate) => candidate.id === prepared.groupId); if (!group) return null;
    group.ownerContributionStatus = "paid"; group.orderId = order.id; group.status = "placed"; group.version++; group.updatedAt = new Date().toISOString(); await writeGroups(groups); return ownerView(group);
  });
}
