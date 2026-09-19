import "server-only";

export type AwsRuntimeStatus = {
  configured: boolean;
  region: string | null;
  apiUrl: string | null;
  tableName: string | null;
  cognitoUserPoolId: string | null;
  cognitoClientId: string | null;
  paymentProvider: "fake" | "amazon_pay";
  amazonPayConfigured: boolean;
  amazonPayMissingFields: string[];
  modelProvider: string;
};

function clean(value: string | undefined) {
  const result = value?.trim();
  return result ? result : null;
}

export function getAwsRuntimeStatus(): AwsRuntimeStatus {
  const region = clean(process.env.AWS_REGION);
  const apiUrl = clean(process.env.PICO_AWS_API_URL);
  const tableName = clean(process.env.PICO_DYNAMODB_TABLE);
  const cognitoUserPoolId = clean(process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID);
  const cognitoClientId = clean(process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID);
  const amazonPayFields = {
    merchantId: clean(process.env.AMAZON_PAY_MERCHANT_ID),
    accessKey: clean(process.env.AMAZON_PAY_ACCESS_KEY),
    secretKey: clean(process.env.AMAZON_PAY_SECRET_KEY),
    oauthClientId: clean(process.env.AMAZON_PAY_OAUTH_CLIENT_ID),
    ipnUrl: clean(process.env.AMAZON_PAY_IPN_URL)
  };
  const amazonPayMissingFields = Object.entries(amazonPayFields)
    .filter(([, value]) => !value)
    .map(([field]) => field);

  return {
    configured: Boolean(region && apiUrl && tableName && cognitoUserPoolId && cognitoClientId),
    region,
    apiUrl,
    tableName,
    cognitoUserPoolId,
    cognitoClientId,
    paymentProvider: process.env.PAYMENT_PROVIDER === "amazon_pay" ? "amazon_pay" : "fake",
    amazonPayConfigured: amazonPayMissingFields.length === 0,
    amazonPayMissingFields,
    modelProvider: process.env.LLM_PROVIDER?.trim() || "local"
  };
}
