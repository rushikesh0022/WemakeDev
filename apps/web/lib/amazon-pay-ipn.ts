import { createVerify } from "node:crypto";
import type { PaymentStatus } from "./payments";

type SnsEnvelope = {
  Type?: string;
  MessageId?: string;
  TopicArn?: string;
  Subject?: string;
  Message?: string;
  Timestamp?: string;
  SignatureVersion?: string;
  Signature?: string;
  SigningCertURL?: string;
  SigningCertUrl?: string;
  SubscribeURL?: string;
  Token?: string;
};

function certificateUrl(envelope: SnsEnvelope) {
  const raw = envelope.SigningCertURL || envelope.SigningCertUrl;
  if (!raw) throw new Error("The notification has no signing certificate.");
  const url = new URL(raw);
  if (url.protocol !== "https:" || !/^sns\.[a-z0-9-]+\.amazonaws\.com(\.cn)?$/.test(url.hostname) || !/^\/SimpleNotificationService-[A-Za-z0-9_-]+\.pem$/.test(url.pathname)) {
    throw new Error("The notification signing certificate URL is invalid.");
  }
  return url.toString();
}

export function createSnsSigningString(envelope: SnsEnvelope) {
  const fields = envelope.Type === "Notification"
    ? ["Message", "MessageId", ...(envelope.Subject ? ["Subject"] : []), "Timestamp", "TopicArn", "Type"]
    : ["Message", "MessageId", "SubscribeURL", "Timestamp", "Token", "TopicArn", "Type"];
  return fields.map((field) => `${field}\n${String(envelope[field as keyof SnsEnvelope] ?? "")}\n`).join("");
}

export async function verifyAmazonPayNotification(envelope: SnsEnvelope) {
  if (!envelope.Signature || !["1", "2"].includes(envelope.SignatureVersion || "")) throw new Error("The notification signature is invalid.");
  const expectedTopic = process.env.AMAZON_PAY_SNS_TOPIC_ARN?.trim();
  if (!expectedTopic || envelope.TopicArn !== expectedTopic) throw new Error("The notification topic is not authorized.");
  const response = await fetch(certificateUrl(envelope), { signal: AbortSignal.timeout(5_000), cache: "no-store" });
  if (!response.ok) throw new Error("The notification signing certificate could not be loaded.");
  const certificate = await response.text();
  if (certificate.length > 20_000 || !certificate.includes("BEGIN CERTIFICATE")) throw new Error("The notification signing certificate is invalid.");
  const verifier = createVerify(envelope.SignatureVersion === "2" ? "RSA-SHA256" : "RSA-SHA1");
  verifier.update(createSnsSigningString(envelope), "utf8");
  verifier.end();
  if (!verifier.verify(certificate, envelope.Signature, "base64")) throw new Error("The notification signature could not be verified.");
  return envelope;
}

function firstString(value: Record<string, unknown>, keys: string[]) {
  for (const key of keys) if (typeof value[key] === "string" && value[key]) return value[key] as string;
  return null;
}

export function parseAmazonPayNotification(message: string) {
  const parsed = JSON.parse(message) as Record<string, unknown>;
  const nested = parsed.notification && typeof parsed.notification === "object" ? parsed.notification as Record<string, unknown> : parsed;
  const providerStatus = firstString(nested, ["status", "chargeStatus", "captureStatus", "transactionStatus"]);
  const transactionId = firstString(nested, ["customData", "merchantTransactionId", "chargeId", "referenceId"]);
  const providerReference = firstString(nested, ["amazonChargeId", "transactionId", "chargeId"]);
  if (!providerStatus || !transactionId || !providerReference) throw new Error("The Amazon Pay notification is incomplete.");
  const status: PaymentStatus = providerStatus === "CaptureApproved" ? "approved"
    : providerStatus === "CapturePending" ? "pending"
      : providerStatus.toLowerCase().includes("refund") ? "refunded"
        : "declined";
  const amount = nested.approvedAmount ?? nested.amount;
  const amountPaise = typeof amount === "number" || typeof amount === "string" ? Math.round(Number(amount) * 100) : 0;
  return { transactionId, providerReference, status, approvedAmountPaise: status === "approved" ? amountPaise : 0 };
}
