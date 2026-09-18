import "server-only";

import { createHmac, randomBytes, randomUUID, scryptSync, timingSafeEqual } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { cookies } from "next/headers";

export const SESSION_COOKIE = "zaply_session";

export type Address = {
  label: string;
  line1: string;
  city: string;
  pincode: string;
};

export type AccountOrder = {
  id: string;
  createdAt: string;
  status: "confirmed";
  total: number;
  itemCount: number;
  items: Array<{ productId: string; name: string; quantity: number; price: number }>;
};

type StoredUser = {
  id: string;
  name: string;
  email: string;
  phone: string;
  passwordSalt: string;
  passwordHash: string;
  role: "customer" | "admin";
  createdAt: string;
  address: Address | null;
  orders: AccountOrder[];
};

export type PublicUser = Omit<StoredUser, "passwordSalt" | "passwordHash">;

const dataDirectory = path.join(process.cwd(), ".zaply-data");
const usersFile = path.join(dataDirectory, "users.json");

function publicUser(user: StoredUser): PublicUser {
  const { passwordHash: _hash, passwordSalt: _salt, ...safe } = user;
  return { ...safe, phone: safe.phone ?? "", address: safe.address ?? null, orders: safe.orders ?? [] };
}

async function readUsers(): Promise<StoredUser[]> {
  try {
    return JSON.parse(await readFile(usersFile, "utf8"));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }
}

async function writeUsers(users: StoredUser[]) {
  await mkdir(dataDirectory, { recursive: true });
  const temporary = `${usersFile}.${randomUUID()}.tmp`;
  await writeFile(temporary, JSON.stringify(users, null, 2), { mode: 0o600 });
  await rename(temporary, usersFile);
}

function hashPassword(password: string, salt: string) {
  return scryptSync(password, salt, 64).toString("hex");
}

function adminEmails() {
  return new Set((process.env.ADMIN_EMAILS ?? "").split(",").map((email) => email.trim().toLowerCase()).filter(Boolean));
}

export async function registerUser(input: { name: string; email: string; phone?: string; password: string }) {
  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();
  const phone = (input.phone ?? "").trim();
  if (name.length < 2) throw new Error("Enter your full name.");
  if (!/^\S+@\S+\.\S+$/.test(email)) throw new Error("Enter a valid email address.");
  if (input.password.length < 8) throw new Error("Password must contain at least 8 characters.");
  const users = await readUsers();
  if (users.some((user) => user.email === email)) throw new Error("An account with this email already exists.");
  const passwordSalt = randomBytes(16).toString("hex");
  const user: StoredUser = {
    id: `usr_${randomUUID().replaceAll("-", "")}`,
    name,
    email,
    phone,
    passwordSalt,
    passwordHash: hashPassword(input.password, passwordSalt),
    role: adminEmails().has(email) ? "admin" : "customer",
    createdAt: new Date().toISOString(),
    address: null,
    orders: []
  };
  await writeUsers([...users, user]);
  return publicUser(user);
}

export async function authenticateUser(emailInput: string, password: string) {
  const email = emailInput.trim().toLowerCase();
  const user = (await readUsers()).find((candidate) => candidate.email === email);
  if (!user) return null;
  const provided = Buffer.from(hashPassword(password, user.passwordSalt), "hex");
  const expected = Buffer.from(user.passwordHash, "hex");
  if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) return null;
  return publicUser(user);
}

export async function updateUser(userId: string, input: { name?: string; phone?: string; address?: Address | null }) {
  const users = await readUsers();
  const index = users.findIndex((user) => user.id === userId);
  if (index < 0) return null;
  const current = users[index];
  const name = input.name?.trim() ?? current.name;
  if (name.length < 2) throw new Error("Enter your full name.");
  users[index] = {
    ...current,
    name,
    phone: input.phone?.trim() ?? current.phone,
    address: input.address === undefined ? current.address : input.address
  };
  await writeUsers(users);
  return publicUser(users[index]);
}

export async function createOrder(userId: string, input: { total: number; items: AccountOrder["items"] }) {
  const users = await readUsers();
  const index = users.findIndex((user) => user.id === userId);
  if (index < 0) return null;
  const order: AccountOrder = {
    id: `ZP${Date.now().toString(36).toUpperCase()}`,
    createdAt: new Date().toISOString(),
    status: "confirmed",
    total: Math.max(0, Math.round(input.total)),
    itemCount: input.items.reduce((sum, item) => sum + item.quantity, 0),
    items: input.items.slice(0, 100)
  };
  users[index] = { ...users[index], orders: [order, ...(users[index].orders ?? [])] };
  await writeUsers(users);
  return order;
}

function authSecret() {
  if (process.env.AUTH_SECRET) return process.env.AUTH_SECRET;
  if (process.env.NODE_ENV === "production") throw new Error("AUTH_SECRET is required in production.");
  return "zaply-local-development-secret-change-before-deploying";
}

export function createSessionToken(user: PublicUser) {
  const payload = Buffer.from(JSON.stringify({ sub: user.id, role: user.role, exp: Date.now() + 7 * 86400000 })).toString("base64url");
  const signature = createHmac("sha256", authSecret()).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

function verifySessionToken(token: string) {
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;
  const expected = createHmac("sha256", authSecret()).update(payload).digest("base64url");
  const suppliedBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (suppliedBuffer.length !== expectedBuffer.length || !timingSafeEqual(suppliedBuffer, expectedBuffer)) return null;
  try {
    const session = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as { sub: string; role: string; exp: number };
    return session.exp > Date.now() ? session : null;
  } catch {
    return null;
  }
}

export async function currentUser() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const session = verifySessionToken(token);
  if (!session) return null;
  const user = (await readUsers()).find((candidate) => candidate.id === session.sub);
  return user ? publicUser(user) : null;
}

export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 7 * 24 * 60 * 60
};
