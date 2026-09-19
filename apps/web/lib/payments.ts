import "server-only";

import { randomUUID } from "node:crypto";
import { getAmazonAccessToken } from "./amazon-pay";
import { signAmazonPayRequest } from "./amazon-pay-signature";
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
  getStatus?(transaction: PaymentTransaction): Promise<ProviderResult>;
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
    const merchantId = requiredAmazonConfig("AMAZON_PAY_MERCHANT_ID");
    const accessKey = requiredAmazonConfig("AMAZON_PAY_ACCESS_KEY");
    const secretKey = requiredAmazonConfig("AMAZON_PAY_SECRET_KEY");
    const callbackUrl = requiredAmazonConfig("AMAZON_PAY_IPN_URL");
    const hostname = process.env.AMAZON_PAY_ENVIRONMENT === "production" ? "amazonpay.amazon.in" : "amazonpay-sandbox.amazon.in";
    const path = "/v1/payments/charge";
    const accessToken = await getAmazonAccessToken(transaction.amazonAuthorizationId);
    const chargeId = transaction.id.replace(/[^A-Za-z0-9_-]/g, "").slice(0, 50);
    const payload = {
      accessToken,
      amount: (transaction.requestedAmountPaise / 100).toFixed(2),
      attributableProgram: "S2SPay",
      callbackUrl,
      chargeId,
      currencyCode: "INR",
      customData: transaction.id,
      intent: "Capture",
      merchantId,
      noteToCustomer: "Nesto order payment",
      paymentMetaData: "",
      referenceId: chargeId,
      selectedPaymentInstrumentType: "AmazonPayBalance",
      timeoutInSecs: "900"
    };
    const signed = signAmazonPayRequest({
      method: "POST", hostname, path, payload, merchantId, accessKey, secretKey,
      sourceIp: transaction.sourceIp,
      sourceUserAgent: transaction.sourceUserAgent
    });
    const response = await fetch(`https://${hostname}${path}`, {
      method: "POST",
      headers: { "content-type": "application/json", ...signed.headers },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(15_000)
    });
    const body = await response.json().catch(() => ({})) as Record<string, unknown>;
    if (!response.ok) throw new Error(readProviderMessage(body) || `Amazon Pay Charge failed (${response.status}).`);
    return providerResult(body, transaction, chargeId);
  }

  async getStatus(transaction: PaymentTransaction): Promise<ProviderResult> {
    if (!transaction.sourceIp || !transaction.sourceUserAgent) throw new Error("Amazon Pay requires the original payer request context.");
    const merchantId = requiredAmazonConfig("AMAZON_PAY_MERCHANT_ID");
    const accessKey = requiredAmazonConfig("AMAZON_PAY_ACCESS_KEY");
    const secretKey = requiredAmazonConfig("AMAZON_PAY_SECRET_KEY");
    const hostname = process.env.AMAZON_PAY_ENVIRONMENT === "production" ? "amazonpay.amazon.in" : "amazonpay-sandbox.amazon.in";
    const path = "/v1/payments/charge";
    const query = { merchantId, txnId: transaction.id, txnIdType: "MerchantTxnId" };
    const signed = signAmazonPayRequest({
      method: "GET", hostname, path, query, merchantId, accessKey, secretKey,
      sourceIp: transaction.sourceIp, sourceUserAgent: transaction.sourceUserAgent
    });
    const response = await fetch(`https://${hostname}${path}?${new URLSearchParams(query)}`, {
      headers: signed.headers, signal: AbortSignal.timeout(15_000), cache: "no-store"
    });
    const body = await response.json().catch(() => ({})) as Record<string, unknown>;
    if (!response.ok) throw new Error(readProviderMessage(body) || `Amazon Pay Status failed (${response.status}).`);
    return providerResult(body, transaction, transaction.providerReference || transaction.id);
  }
}

function requiredAmazonConfig(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required for Amazon Pay.`);
  return value;
}

function readProviderMessage(body: Record<string, unknown>) {
  for (const key of ["message", "errorMessage", "reasonDescription", "description"]) {
    if (typeof body[key] === "string") return body[key] as string;
  }
  return null;
}

function providerResult(body: Record<string, unknown>, transaction: PaymentTransaction, fallbackReference: string): ProviderResult {
  const providerStatus = String(body.status ?? body.chargeStatus ?? body.captureStatus ?? "");
  const status: PaymentStatus = providerStatus === "CaptureApproved" ? "approved" : providerStatus === "CapturePending" ? "pending" : "declined";
  return {
    providerReference: String(body.amazonChargeId ?? body.chargeId ?? body.transactionId ?? fallbackReference),
    approvedAmountPaise: status === "approved" ? transaction.requestedAmountPaise : 0,
    status,
    providerResponse: {
      result: providerStatus || status,
      ...(typeof body.amazonPayUrl === "string" ? { amazonPayUrl: body.amazonPayUrl } : {})
    }
  };
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
  if (transaction.status === "approved" || transaction.status === "refunded") return transaction;
  const result = transaction.provider === "amazon_pay" && Object.keys(transaction.providerResponse).length > 0 && provider.getStatus
    ? await provider.getStatus(transaction)
    : await provider.capture(transaction);
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
    const current = transactions[index];
    if (payload.approvedAmountPaise < 0 || payload.approvedAmountPaise > current.requestedAmountPaise) throw new Error("The Amazon Pay notification amount is invalid.");
    if (current.status === "approved" && payload.status !== "refunded") return current;
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
