import "server-only";

import { randomUUID } from "node:crypto";
import { readState, writeState } from "./state-store";

export type PaymentStatus = "pending" | "approved" | "declined" | "timed_out" | "refunded";
export type FakePaymentScenario = "success" | "pending" | "decline" | "timeout";

export type PaymentTransaction = {
  id: string;
  provider: "fake" | "amazon_pay";
  providerReference: string | null;
  idempotencyKey: string;
  requestedAmountPaise: number;
  approvedAmountPaise: number;
  status: PaymentStatus;
  scenario?: FakePaymentScenario;
  amazonAuthorizationId: string | null;
  sourceIp: string | null;
  sourceUserAgent: string | null;
  createdAt: string;
  updatedAt: string;
  providerResponse: Record<string, string>;
};

type ProviderResult = Pick<PaymentTransaction, "providerReference" | "approvedAmountPaise" | "status" | "providerResponse">;

export interface PaymentProvider {
  readonly id: PaymentTransaction["provider"];
  capture(transaction: PaymentTransaction): Promise<ProviderResult>;
}

export class FakePaymentProvider implements PaymentProvider {
  readonly id = "fake" as const;

  async capture(transaction: PaymentTransaction): Promise<ProviderResult> {
    const scenario = transaction.scenario ?? "success";
    const status: PaymentStatus = scenario === "success" ? "approved" : scenario === "decline" ? "declined" : scenario === "timeout" ? "timed_out" : "pending";
    return {
      providerReference: `fake_${randomUUID().replaceAll("-", "")}`,
      approvedAmountPaise: status === "approved" ? transaction.requestedAmountPaise : 0,
      status,
      providerResponse: { scenario, result: status }
    };
  }
}

export class AmazonPayProvider implements PaymentProvider {
  readonly id = "amazon_pay" as const;

  async capture(transaction: PaymentTransaction): Promise<ProviderResult> {
    if (!transaction.amazonAuthorizationId) throw new Error("Link Amazon Pay to this payer before creating a charge.");
    if (!transaction.sourceIp || !transaction.sourceUserAgent) throw new Error("Amazon Pay requires the payer request context before creating a charge.");
    throw new Error("Amazon Pay account linking is ready, but sandbox Charge and Status calls remain disabled until merchant signing credentials and safelisted callbacks are configured.");
  }
}

let writeQueue = Promise.resolve();

async function readTransactions(): Promise<PaymentTransaction[]> {
  return readState("payments", () => []);
}

async function writeTransactions(transactions: PaymentTransaction[]) {
  await writeState("payments", transactions);
}

function serialize<T>(operation: () => Promise<T>) {
  const result = writeQueue.then(operation, operation);
  writeQueue = result.then(() => undefined, () => undefined);
  return result;
}

export async function createPaymentTransaction(amountPaise: number, scenario: FakePaymentScenario = "success", context: { amazonAuthorizationId?: string | null; sourceIp?: string | null; sourceUserAgent?: string | null } = {}) {
  return serialize(async () => {
    const now = new Date().toISOString();
    const provider = process.env.PAYMENT_PROVIDER === "amazon_pay" ? "amazon_pay" : "fake";
    const transaction: PaymentTransaction = {
      id: `pay_${randomUUID().replaceAll("-", "")}`,
      provider,
      providerReference: null,
      idempotencyKey: randomUUID(),
      requestedAmountPaise: Math.max(0, Math.round(amountPaise)),
      approvedAmountPaise: 0,
      status: "pending",
      scenario,
      amazonAuthorizationId: context.amazonAuthorizationId ?? null,
      sourceIp: context.sourceIp?.slice(0, 128) || null,
      sourceUserAgent: context.sourceUserAgent?.slice(0, 512) || null,
      createdAt: now,
      updatedAt: now,
      providerResponse: {}
    };
    const transactions = await readTransactions();
    await writeTransactions([...transactions, transaction]);
    return transaction;
  });
}

export async function capturePayment(transactionId: string) {
  const transactions = await readTransactions();
  const transaction = transactions.find((candidate) => candidate.id === transactionId);
  if (!transaction) throw new Error("Payment transaction was not found.");
  const provider: PaymentProvider = transaction.provider === "amazon_pay" ? new AmazonPayProvider() : new FakePaymentProvider();
  const result = await provider.capture(transaction);
  return serialize(async () => {
    const latest = await readTransactions();
    const index = latest.findIndex((candidate) => candidate.id === transactionId);
    if (index < 0) throw new Error("Payment transaction was not found.");
    latest[index] = { ...latest[index], ...result, updatedAt: new Date().toISOString() };
    await writeTransactions(latest);
    return latest[index];
  });
}

export async function applyAmazonPayIpn(payload: { transactionId: string; providerReference: string; status: PaymentStatus; approvedAmountPaise: number }) {
  return serialize(async () => {
    const transactions = await readTransactions();
    const index = transactions.findIndex((candidate) => candidate.id === payload.transactionId);
    if (index < 0) return null;
    if (transactions[index].providerReference === payload.providerReference && transactions[index].status === payload.status) return transactions[index];
    transactions[index] = {
      ...transactions[index],
      providerReference: payload.providerReference,
      status: payload.status,
      approvedAmountPaise: payload.approvedAmountPaise,
      updatedAt: new Date().toISOString(),
      providerResponse: { source: "verified_ipn" }
    };
    await writeTransactions(transactions);
    return transactions[index];
  });
}
