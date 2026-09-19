import "server-only";

import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";

const documentClient = DynamoDBDocumentClient.from(new DynamoDBClient({
  region: process.env.AWS_REGION || "us-east-1"
}), { marshallOptions: { removeUndefinedValues: true } });

function useDynamoDb() {
  return process.env.DATA_BACKEND === "dynamodb";
}

function tableName() {
  const value = process.env.PICO_DYNAMODB_TABLE?.trim();
  if (!value) throw new Error("PICO_DYNAMODB_TABLE is required when DATA_BACKEND=dynamodb.");
  return value;
}

export async function readState<T>(key: string, fallback: () => T): Promise<T> {
  if (useDynamoDb()) {
    const result = await documentClient.send(new GetCommand({
      TableName: tableName(),
      Key: { pk: `STATE#${key}`, sk: "CURRENT" },
      ConsistentRead: true
    }));
    return result.Item?.value === undefined ? fallback() : result.Item.value as T;
  }

  const filename = path.join(process.cwd(), ".zaply-data", `${key}.json`);
  try {
    return JSON.parse(await readFile(filename, "utf8")) as T;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return fallback();
    throw error;
  }
}

export async function writeState<T>(key: string, value: T) {
  if (useDynamoDb()) {
    await documentClient.send(new PutCommand({
      TableName: tableName(),
      Item: {
        pk: `STATE#${key}`,
        sk: "CURRENT",
        value,
        updatedAt: new Date().toISOString()
      }
    }));
    return;
  }

  const directory = path.join(process.cwd(), ".zaply-data");
  const filename = path.join(directory, `${key}.json`);
  await mkdir(directory, { recursive: true });
  const temporary = `${filename}.${randomUUID()}.tmp`;
  await writeFile(temporary, JSON.stringify(value, null, 2), { mode: 0o600 });
  await rename(temporary, filename);
}
