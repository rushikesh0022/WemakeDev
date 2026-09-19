import "server-only";

export type AwsRuntimeStatus = {
  configured: boolean;
  region: string | null;
  apiUrl: string | null;
  tableName: string | null;
  cognitoUserPoolId: string | null;
  cognitoClientId: string | null;
  paymentProvider: "fake" | "amazon_pay";
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

  return {
    configured: Boolean(region && apiUrl && tableName && cognitoUserPoolId && cognitoClientId),
    region,
    apiUrl,
    tableName,
    cognitoUserPoolId,
    cognitoClientId,
    paymentProvider: process.env.PAYMENT_PROVIDER === "amazon_pay" ? "amazon_pay" : "fake",
    modelProvider: process.env.LLM_PROVIDER?.trim() || "local"
  };
}
