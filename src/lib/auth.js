import { randomUUID } from "node:crypto";
import fs from "fs/promises";
import path from "path";

const USERS_FILE = path.join(process.cwd(), "src", "data", "auth-users.json");

export function normalizeEmail(value = "") {
  return String(value).trim().toLowerCase();
}

export function normalizeName(value = "") {
  return String(value).trim();
}

async function ensureUsersFile() {
  const directory = path.dirname(USERS_FILE);
  await fs.mkdir(directory, { recursive: true });

  try {
    await fs.access(USERS_FILE);
  } catch {
    await fs.writeFile(USERS_FILE, "[]", "utf8");
  }
}

export async function readUsers() {
  await ensureUsersFile();

  try {
    const raw = await fs.readFile(USERS_FILE, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function writeUsers(users) {
  await ensureUsersFile();
  await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2), "utf8");
}

export async function registerUser({ name, email, password }) {
  const safeName = normalizeName(name);
  const safeEmail = normalizeEmail(email);
  const safePassword = String(password || "").trim();

  if (!safeName || safeName.length < 2) {
    throw new Error("Please enter your full name.");
  }

  if (!safeEmail || !safeEmail.includes("@")) {
    throw new Error("Please enter a valid email address.");
  }

  if (safePassword.length < 8) {
    throw new Error("Password must be at least 8 characters long.");
  }

  const users = await readUsers();
  const existing = users.find((user) => user.email === safeEmail);
  if (existing) {
    throw new Error("An account already exists for this email address.");
  }

  const record = {
    id: randomUUID(),
    name: safeName,
    email: safeEmail,
    password: safePassword,
    createdAt: new Date().toISOString(),
  };

  users.push(record);
  await writeUsers(users);

  return {
    id: record.id,
    name: record.name,
    email: record.email,
    createdAt: record.createdAt,
  };
}

export async function authenticateUser({ email, password }) {
  const safeEmail = normalizeEmail(email);
  const safePassword = String(password || "").trim();

  if (!safeEmail || !safeEmail.includes("@")) {
    throw new Error("Please enter a valid email address.");
  }

  if (!safePassword) {
    throw new Error("Please enter your password.");
  }

  const users = await readUsers();
  const user = users.find((entry) => entry.email === safeEmail && entry.password === safePassword);
  if (!user) {
    throw new Error("We could not find an account matching those details.");
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    createdAt: user.createdAt,
  };
}

