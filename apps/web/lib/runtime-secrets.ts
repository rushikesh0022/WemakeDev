import "server-only";

import { GetParameterCommand, SSMClient } from "@aws-sdk/client-ssm";

const ssm = new SSMClient({ region: process.env.AWS_REGION || "us-east-1" });
const cache = new Map<string, string>();

export async function runtimeSecret(environmentName: string, parameterNameEnvironment: string) {
  const direct = process.env[environmentName]?.trim();
  if (direct) return direct;

  const parameterName = process.env[parameterNameEnvironment]?.trim();
  if (!parameterName) throw new Error(`${environmentName} is not configured.`);
  const cached = cache.get(parameterName);
  if (cached) return cached;

  const response = await ssm.send(new GetParameterCommand({ Name: parameterName, WithDecryption: true }));
  const value = response.Parameter?.Value?.trim();
  if (!value) throw new Error(`AWS Parameter Store did not return ${parameterName}.`);
  cache.set(parameterName, value);
  return value;
}
