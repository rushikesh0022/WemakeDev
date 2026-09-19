import "server-only";

import { createCipheriv, createHash, randomBytes, randomUUID, timingSafeEqual } from "node:crypto";
import { readState, writeState } from "./state-store";

export type AmazonLinkTarget =
  | { kind: "owner"; groupId: string; ownerId: string }
  | { kind: "participant"; groupId: string; participantId: string };

export type AmazonLinkAuthorization = {
  clientId: string;
  redirectUri: string;
  state: string;
  scope: "payments::conduct_silentpay";
};

type AmazonLinkSession = {
  id: string;
  stateHash: string;
  target: AmazonLinkTarget;
  returnTo: string;
  expiresAt: string;
  usedAt: string | null;
  createdAt: string;
};

type StoredAmazonAuthorization = {
  id: string;
  subjectKey: string;
  encryptedTokens: string;
  expiresAt: string;
  createdAt: string;
};

type TokenResponse = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  error?: string;
  error_description?: string;
};

let writeQueue = Promise.resolve();

function serialize<T>(operation: () => Promise<T>) {
  const result = writeQueue.then(operation, operation);
  writeQueue = result.then(() => undefined, () => undefined);
  return result;
}

function digest(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function secureEqual(left: string, right: string) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

function required(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required for Amazon Pay account linking.`);
  return value;
}

function encryptionKey() {
  const encoded = required("AMAZON_PAY_TOKEN_ENCRYPTION_KEY");
  const key = Buffer.from(encoded, "base64");
  if (key.length !== 32) throw new Error("AMAZON_PAY_TOKEN_ENCRYPTION_KEY must be a base64-encoded 32-byte key.");
  return key;
}

function encryptTokens(tokens: { accessToken: string; refreshToken: string }) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(JSON.stringify(tokens), "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv, tag, ciphertext].map((part) => part.toString("base64url")).join(".");
}

function safeReturnTo(value: string) {
  if (!value.startsWith("/group/") || value.startsWith("//")) throw new Error("Invalid Amazon Pay return route.");
  return value;
}

async function findActiveSession(state: string) {
  if (!state) return null;
  return (await readState<AmazonLinkSession[]>("amazon-link-sessions", () => []))
    .find((item) => !item.usedAt && Date.parse(item.expiresAt) > Date.now() && secureEqual(item.stateHash, digest(state))) ?? null;
}

export async function getAmazonLinkReturnTo(state: string) {
  return (await findActiveSession(state))?.returnTo ?? null;
}

export function amazonPayLinkingConfigured() {
  return [
    "AMAZON_PAY_OAUTH_CLIENT_ID",
    "AMAZON_PAY_OAUTH_CLIENT_SECRET",
    "AMAZON_PAY_REDIRECT_URI",
    "AMAZON_PAY_TOKEN_ENCRYPTION_KEY"
  ].every((name) => Boolean(process.env[name]?.trim()));
}

export async function createAmazonLinkSession(target: AmazonLinkTarget, returnToInput: string): Promise<AmazonLinkAuthorization> {
  const clientId = required("AMAZON_PAY_OAUTH_CLIENT_ID");
  const redirectUri = required("AMAZON_PAY_REDIRECT_URI");
  encryptionKey();
  const state = randomBytes(32).toString("base64url");
  const now = new Date();
  const session: AmazonLinkSession = {
    id: `amazon_link_${randomUUID().replaceAll("-", "")}`,
    stateHash: digest(state),
    target,
    returnTo: safeReturnTo(returnToInput),
    expiresAt: new Date(now.getTime() + 10 * 60_000).toISOString(),
    usedAt: null,
    createdAt: now.toISOString()
  };
  await serialize(async () => {
    const sessions = await readState<AmazonLinkSession[]>("amazon-link-sessions", () => []);
    const active = sessions.filter((item) => !item.usedAt && Date.parse(item.expiresAt) > Date.now());
    await writeState("amazon-link-sessions", [...active, session]);
  });
  return { clientId, redirectUri, state, scope: "payments::conduct_silentpay" };
}

export async function completeAmazonLink(state: string, code: string) {
  if (!state || !code) throw new Error("Amazon Pay did not return a valid authorization response.");
  const session = await findActiveSession(state);
  if (!session) throw new Error("This Amazon Pay authorization has expired or was already used.");

  const response = await fetch("https://api.amazon.co.uk/auth/o2/token", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      grant_type: "authorization_code",
      code,
      client_id: required("AMAZON_PAY_OAUTH_CLIENT_ID"),
      client_secret: required("AMAZON_PAY_OAUTH_CLIENT_SECRET"),
      redirect_uri: required("AMAZON_PAY_REDIRECT_URI")
    }),
    signal: AbortSignal.timeout(10_000)
  });
  const payload = await response.json() as TokenResponse;
  if (!response.ok || !payload.access_token || !payload.refresh_token) {
    throw new Error(payload.error_description || payload.error || "Amazon Pay token exchange failed.");
  }

  const authorization: StoredAmazonAuthorization = {
    id: `amazon_auth_${randomUUID().replaceAll("-", "")}`,
    subjectKey: session.target.kind === "owner" ? `owner:${session.target.ownerId}` : `participant:${session.target.participantId}`,
    encryptedTokens: encryptTokens({ accessToken: payload.access_token, refreshToken: payload.refresh_token }),
    expiresAt: new Date(Date.now() + Math.max(60, Number(payload.expires_in) || 3600) * 1000).toISOString(),
    createdAt: new Date().toISOString()
  };

  await serialize(async () => {
    const [sessions, authorizations] = await Promise.all([
      readState<AmazonLinkSession[]>("amazon-link-sessions", () => []),
      readState<StoredAmazonAuthorization[]>("amazon-authorizations", () => [])
    ]);
    const index = sessions.findIndex((item) => item.id === session.id && !item.usedAt);
    if (index < 0) throw new Error("This Amazon Pay authorization was already completed.");
    sessions[index] = { ...sessions[index], usedAt: new Date().toISOString() };
    await Promise.all([
      writeState("amazon-link-sessions", sessions),
      writeState("amazon-authorizations", [...authorizations, authorization])
    ]);
  });

  return { target: session.target, returnTo: session.returnTo, authorizationId: authorization.id };
}
