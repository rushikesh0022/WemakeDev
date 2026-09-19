import { createHash, createHmac } from "node:crypto";

export const AMAZON_PAY_ALGORITHM = "AWS4-HMAC-SHA384";
export const AMAZON_PAY_REGION = "eu-west-1";
export const AMAZON_PAY_SERVICE = "AmazonPay";

type Scalar = string | number | boolean | null | undefined;

function encode(value: string) {
  return encodeURIComponent(value).replace(/[!'()*]/g, (character) => `%${character.charCodeAt(0).toString(16).toUpperCase()}`);
}

export function canonicalPairs(values: Record<string, Scalar>) {
  return Object.entries(values)
    .filter(([, value]) => value !== undefined && value !== null)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${encode(key)}=${encode(String(value))}`)
    .join("&");
}

export function createAmazonPayCanonicalRequest(input: {
  method: "GET" | "POST";
  hostname: string;
  path: string;
  query?: Record<string, Scalar>;
  headers: Record<string, Scalar>;
  payload?: Record<string, Scalar>;
}) {
  return [
    input.method,
    `${input.hostname}${input.path}`,
    canonicalPairs(input.query ?? {}),
    canonicalPairs(input.headers),
    canonicalPairs(input.payload ?? {})
  ].join("\n");
}

function hmac(key: string | Buffer, value: string) {
  return createHmac("sha384", key).update(value).digest();
}

function sha384(value: string) {
  return createHash("sha384").update(value).digest("hex");
}

export function formatAmazonPayDate(date: Date) {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

export function signAmazonPayRequest(input: {
  method: "GET" | "POST";
  hostname: string;
  path: string;
  query?: Record<string, Scalar>;
  payload?: Record<string, Scalar>;
  merchantId: string;
  accessKey: string;
  secretKey: string;
  sourceIp: string;
  sourceUserAgent: string;
  date?: Date;
  expiresSeconds?: number;
}) {
  const date = input.date ?? new Date();
  const amzDate = formatAmazonPayDate(date);
  const dateStamp = amzDate.slice(0, 8);
  const headers = {
    "x-amz-algorithm": AMAZON_PAY_ALGORITHM,
    "x-amz-client-id": input.merchantId,
    "x-amz-date": amzDate,
    "x-amz-expires": String(input.expiresSeconds ?? 900),
    "x-amz-source": "Browser",
    "x-amz-user-agent": input.sourceUserAgent,
    "x-amz-user-ip": input.sourceIp
  };
  const canonicalRequest = createAmazonPayCanonicalRequest({ ...input, headers });
  const credentialScope = `${dateStamp}/${AMAZON_PAY_REGION}/${AMAZON_PAY_SERVICE}/aws4_request`;
  const stringToSign = `${AMAZON_PAY_ALGORITHM}\n${amzDate}\n${credentialScope}\n${sha384(canonicalRequest)}`;
  const dateKey = hmac(`AWS4${input.secretKey}`, dateStamp);
  const regionKey = hmac(dateKey, AMAZON_PAY_REGION);
  const serviceKey = hmac(regionKey, AMAZON_PAY_SERVICE);
  const signingKey = hmac(serviceKey, "aws4_request");
  const signatureBytes = hmac(signingKey, stringToSign);
  const signature = signatureBytes.toString("base64url");
  return {
    canonicalRequest,
    stringToSign,
    signature,
    headers: { ...headers, Authorization: `AMZ+${input.accessKey}:${signature}` }
  };
}
